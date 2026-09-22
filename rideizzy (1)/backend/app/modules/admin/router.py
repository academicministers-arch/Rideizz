from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.core.auth import require_role, CurrentUser
from app.core.firebase import db
from app.models.schemas import AgencyInvite

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/agencies", dependencies=[Depends(require_role("admin"))])
async def invite_agency(payload: AgencyInvite, user: CurrentUser = Depends(require_role("admin"))):
    """Admin invites a travel agency by email. Nothing happens on Firebase's
    side yet - we can't create a Google-linked account for someone else.
    Instead we record the invite; the next time that email signs in with
    Google, POST /users/profile (see shared router) checks this collection
    and automatically grants them the 'agent' role."""
    ref = db.collection("agencies").document()
    data = {
        "name": payload.name,
        "contactEmail": payload.contact_email.lower(),
        "phone": payload.phone,
        "status": "invited",   # invited -> active (flips once they sign in)
        "invitedBy": user.uid,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    ref.set(data)
    return {"agency_id": ref.id, **data}


@router.get("/agencies", dependencies=[Depends(require_role("admin"))])
async def list_agencies():
    agencies = db.collection("agencies").stream()
    return [{"agency_id": a.id, **a.to_dict()} for a in agencies]


@router.get("/notifications", dependencies=[Depends(require_role("admin"))])
async def admin_notifications():
    notifs = (
        db.collection("notifications")
        .where("audience", "==", "admin_broadcast")
        .order_by("createdAt", direction="DESCENDING")
        .limit(50)
        .stream()
    )
    return [{"notification_id": n.id, **n.to_dict()} for n in notifs]
