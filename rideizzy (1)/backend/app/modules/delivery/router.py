from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.core.auth import get_current_user, CurrentUser
from app.core.firebase import db
from app.models.schemas import DeliveryRequest, DeliveryStatusUpdate

router = APIRouter(prefix="/delivery", tags=["delivery"])

# Pricing reuses the same VEHICLE_PRICING table and /rides/estimate endpoint
# as the ride-hailing module (see rides/router.py) - the math is identical,
# only what happens after differs, which is why this module exists separately.


@router.post("/request")
async def request_delivery(payload: DeliveryRequest, user: CurrentUser = Depends(get_current_user)):
    ref = db.collection("deliveries").document()
    data = {
        "senderId": user.uid,
        "driverId": None,
        "pickup": payload.pickup.model_dump(),
        "dropoff": payload.dropoff.model_dump(),
        "vehicleClass": payload.vehicle_class,
        "packageDescription": payload.package_description,
        "recipientName": payload.recipient_name,
        "recipientPhone": payload.recipient_phone,
        "status": "searching",
        "fare": payload.estimated_fare,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    ref.set(data)
    return {"delivery_id": ref.id, **data}


@router.get("/{delivery_id}")
async def get_delivery(delivery_id: str, user: CurrentUser = Depends(get_current_user)):
    doc = db.collection("deliveries").document(delivery_id).get()
    if not doc.exists:
        raise HTTPException(404, "Delivery not found")
    return {"delivery_id": doc.id, **doc.to_dict()}


@router.post("/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, payload: DeliveryStatusUpdate, user: CurrentUser = Depends(get_current_user)):
    ref = db.collection("deliveries").document(delivery_id)
    if not ref.get().exists:
        raise HTTPException(404, "Delivery not found")

    update = {"status": payload.status}
    if payload.status == "accepted":
        update["driverId"] = user.uid
    if payload.status == "delivered":
        update["deliveredAt"] = datetime.now(timezone.utc).isoformat()

    ref.update(update)
    return {"delivery_id": delivery_id, **update}


@router.get("/history/me")
async def my_delivery_history(user: CurrentUser = Depends(get_current_user)):
    deliveries = (
        db.collection("deliveries")
        .where("senderId", "==", user.uid)
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )
    return [{"delivery_id": d.id, **d.to_dict()} for d in deliveries]