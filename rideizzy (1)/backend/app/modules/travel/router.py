from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.core.auth import get_current_user, require_role, CurrentUser
from app.core.firebase import db
from app.core.notifications import notify_user, notify_admins
from app.models.schemas import FlightRequest, FlightQuote, QuoteDecision

router = APIRouter(prefix="/travel", tags=["travel"])

# Flight request status flow:
#   pending -> quoted (agent submitted, awaiting admin) -> quote_approved
#   (admin approved, traveler can now see it) -> confirmed (traveler accepted)


@router.post("/requests")
async def create_flight_request(payload: FlightRequest, user: CurrentUser = Depends(get_current_user)):
    ref = db.collection("flight_requests").document()
    data = {
        "userId": user.uid,
        "status": "pending",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        **payload.model_dump(),
    }
    ref.set(data)
    return {"request_id": ref.id, **data}


@router.get("/requests/me")
async def my_flight_requests(user: CurrentUser = Depends(get_current_user)):
    reqs = db.collection("flight_requests").where("userId", "==", user.uid).stream()
    results = []
    for r in reqs:
        item = {"request_id": r.id, **r.to_dict()}
        # attach the approved quote so the traveler's status screen has
        # everything it needs in one call
        if item["status"] in ("quote_approved", "confirmed"):
            quotes = db.collection("quotes").where("request_id", "==", r.id).where("status", "==", "approved").limit(1).stream()
            for q in quotes:
                item["quote"] = {"quote_id": q.id, **q.to_dict()}
        results.append(item)
    return results


@router.get("/requests/queue", dependencies=[Depends(require_role("agent"))])
async def agent_queue():
    """Travel agent's incoming queue - requests still awaiting a quote."""
    reqs = db.collection("flight_requests").where("status", "==", "pending").stream()
    return [{"request_id": r.id, **r.to_dict()} for r in reqs]


@router.post("/requests/{request_id}/quote", dependencies=[Depends(require_role("agent"))])
async def submit_quote(request_id: str, payload: FlightQuote, user: CurrentUser = Depends(get_current_user)):
    req_ref = db.collection("flight_requests").document(request_id)
    if not req_ref.get().exists:
        raise HTTPException(404, "Flight request not found")

    quote_ref = db.collection("quotes").document()
    quote_data = {
        "agentId": user.uid,
        "status": "pending_admin_approval",
        **payload.model_dump(),
    }
    quote_ref.set(quote_data)

    req_ref.update({"status": "quoted"})
    notify_admins(
        "New quote awaiting approval",
        f"An agent submitted a quote for flight request {request_id}.",
        notif_type="quote_submitted",
    )
    return {"quote_id": quote_ref.id, **quote_data}


# ---- Admin approval gate: nothing reaches the traveler before this ----
@router.get("/admin/quotes/pending", dependencies=[Depends(require_role("admin"))])
async def pending_quotes():
    quotes = db.collection("quotes").where("status", "==", "pending_admin_approval").stream()
    return [{"quote_id": q.id, **q.to_dict()} for q in quotes]


@router.post("/admin/quotes/{quote_id}/approve", dependencies=[Depends(require_role("admin"))])
async def approve_quote(quote_id: str, user: CurrentUser = Depends(get_current_user)):
    quote_ref = db.collection("quotes").document(quote_id)
    quote_doc = quote_ref.get()
    if not quote_doc.exists:
        raise HTTPException(404, "Quote not found")

    quote = quote_doc.to_dict()
    quote_ref.update({"status": "approved"})

    req_ref = db.collection("flight_requests").document(quote["request_id"])
    req_doc = req_ref.get()
    req_ref.update({"status": "quote_approved"})

    # Notify both the traveler and the admin feed, as required.
    traveler_id = req_doc.to_dict()["userId"]
    notify_user(
        traveler_id,
        "Your flight quote is ready",
        "A quote for your flight request has been approved and is ready to review.",
        notif_type="quote_approved",
    )
    notify_admins(
        "Quote approved",
        f"Quote {quote_id} for request {quote['request_id']} was approved by {user.email}.",
        notif_type="quote_approved",
    )
    return {"quote_id": quote_id, "status": "approved"}


@router.post("/quotes/{quote_id}/decision")
async def decide_on_quote(quote_id: str, payload: QuoteDecision, user: CurrentUser = Depends(get_current_user)):
    quote_doc = db.collection("quotes").document(quote_id).get()
    if not quote_doc.exists:
        raise HTTPException(404, "Quote not found")

    quote = quote_doc.to_dict()
    if quote["status"] != "approved":
        raise HTTPException(400, "Quote is not yet approved by admin")

    req_ref = db.collection("flight_requests").document(quote["request_id"])

    if payload.decision == "accept":
        booking_ref = db.collection("flight_bookings").document()
        booking_ref.set({
            "quoteId": quote_id,
            "userId": user.uid,
            "paymentStatus": "pending",
            "ticketRef": None,
        })
        req_ref.update({"status": "confirmed"})
        notify_admins("Booking confirmed", f"Traveler accepted quote {quote_id}.", notif_type="booking_confirmed")
        return {"booking_id": booking_ref.id, "status": "confirmed"}
    else:
        req_ref.update({"status": "pending"})  # back to queue for a new quote
        return {"status": "declined"}
