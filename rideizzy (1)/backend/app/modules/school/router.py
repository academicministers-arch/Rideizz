from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.core.auth import get_current_user, require_role, CurrentUser
from app.core.firebase import db
from app.models.schemas import SchoolTripRequest, TripAssignment, CheckEvent

router = APIRouter(prefix="/school", tags=["school"])


# ---- School admin requests a trip (sports day, excursion, event run) ----
@router.post("/trips", dependencies=[Depends(require_role("school_admin"))])
async def request_trip(payload: SchoolTripRequest, user: CurrentUser = Depends(get_current_user)):
    ref = db.collection("school_trips").document()
    data = {
        "requestedBy": user.uid,
        "status": "pending",       # pending -> assigned -> completed -> cancelled
        "vehicleId": None,
        "driverId": None,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        **payload.model_dump(),
    }
    ref.set(data)
    return {"trip_id": ref.id, **data}


@router.get("/trips/{school_id}")
async def list_trips_for_school(school_id: str, user: CurrentUser = Depends(get_current_user)):
    trips = db.collection("school_trips").where("school_id", "==", school_id).stream()
    return [{"trip_id": t.id, **t.to_dict()} for t in trips]


@router.get("/trips", dependencies=[Depends(require_role("admin"))])
async def list_unassigned_trips():
    """Ops/admin queue: trips waiting for a vehicle + driver assignment."""
    trips = db.collection("school_trips").where("status", "==", "pending").stream()
    return [{"trip_id": t.id, **t.to_dict()} for t in trips]


@router.post("/trips/{trip_id}/assign", dependencies=[Depends(require_role("admin"))])
async def assign_trip(trip_id: str, payload: TripAssignment):
    trip_ref = db.collection("school_trips").document(trip_id)
    if not trip_ref.get().exists:
        raise HTTPException(404, "Trip not found")

    trip_ref.update({
        "vehicleId": payload.vehicle_id,
        "driverId": payload.driver_id,
        "status": "assigned",
    })
    return {"trip_id": trip_id, "status": "assigned"}


# ---- Check-in / check-out log for the trip roster (safety-critical trail) ----
@router.post("/trips/{trip_id}/checkins")
async def log_check_event(trip_id: str, payload: CheckEvent, user: CurrentUser = Depends(get_current_user)):
    """Driver taps this when a student boards/exits during the trip.
    Appends to that trip's log rather than overwriting, so there's a full
    timestamped audit trail per trip."""
    log_ref = db.collection("trip_logs").document(trip_id)

    event = {
        "studentName": payload.student_name,
        "type": payload.type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "loggedBy": user.uid,
    }

    doc = log_ref.get()
    events = doc.to_dict().get("events", []) if doc.exists else []
    events.append(event)
    log_ref.set({"tripId": trip_id, "events": events}, merge=True)

    return {"trip_id": trip_id, "event": event}
