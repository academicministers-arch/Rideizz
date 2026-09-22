from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.core.auth import get_current_user, CurrentUser
from app.core.firebase import db, driver_location_ref
from app.core.google_maps import get_distance_and_duration
from app.models.schemas import RideRequest, RideStatusUpdate, DriverLocationUpdate, FareEstimateRequest

router = APIRouter(prefix="/rides", tags=["rides"])

# Pricing model per vehicle class: base fare + (distance_km * per_km) +
# (duration_min * per_min), with a minimum fare floor. All amounts are in
# Ugandan Shillings (UGX) - no decimals, since UGX isn't normally quoted
# with cents. Each class has its own numbers rather than a shared
# multiplier, because a motorbike (boda), a car, and a moving truck are
# different vehicles with different cost structures - not just
# "cheaper/pricier versions of the same ride."
#
# Delivery classes live in this same table (and this same /rides/estimate
# endpoint) because the underlying calculation - distance, time, vehicle
# cost - is identical. The delivery module only differs in what happens
# AFTER the price is estimated (its own request/status endpoints).
#
# These are starting figures loosely modeled on typical Kampala boda/taxi
# fares - adjust to match what you actually want to charge.
VEHICLE_PRICING = {
    # Passenger rides
    "motorbike": {"base": 1000, "per_km": 700, "per_min": 100, "min_fare": 2000},
    "economy":   {"base": 3000, "per_km": 1200, "per_min": 200, "min_fare": 5000},
    "comfort":   {"base": 4000, "per_km": 1600, "per_min": 300, "min_fare": 8000},
    "xl":        {"base": 5000, "per_km": 2000, "per_min": 400, "min_fare": 12000},
    # Delivery / moving
    "delivery_motorbike":   {"base": 2000, "per_km": 800, "per_min": 150, "min_fare": 3000},
    "delivery_truck_small": {"base": 15000, "per_km": 2500, "per_min": 400, "min_fare": 25000},
    "delivery_truck_large": {"base": 40000, "per_km": 4000, "per_min": 600, "min_fare": 70000},
}


@router.post("/estimate")
async def estimate_fare(payload: FareEstimateRequest, user: CurrentUser = Depends(get_current_user)):
    """Calls Google's Distance Matrix API for real driving distance/time,
    then prices EVERY vehicle class (rides and delivery alike) against it.
    The rides screen shows only the ride classes; the delivery screen shows
    only the delivery classes - same endpoint, same distance calculation,
    just filtered client-side."""
    try:
        distance_km, duration_min = await get_distance_and_duration(
            payload.pickup.lat, payload.pickup.lng, payload.dropoff.lat, payload.dropoff.lng
        )
    except RuntimeError as e:
        raise HTTPException(400, str(e))

    estimates = {}
    for vehicle_class, rates in VEHICLE_PRICING.items():
        raw_fare = rates["base"] + distance_km * rates["per_km"] + duration_min * rates["per_min"]
        # UGX isn't quoted with decimals - round to the nearest whole shilling.
        estimates[vehicle_class] = round(max(raw_fare, rates["min_fare"]))

    return {
        "distance_km": round(distance_km, 2),
        "duration_min": round(duration_min, 1),
        "currency": "UGX",
        "estimates": estimates,
    }


@router.post("/request")
async def request_ride(payload: RideRequest, user: CurrentUser = Depends(get_current_user)):
    """Rider requests a ride. Status starts as 'searching'.
    A real matching engine would run here (or in a background worker) to find
    a nearby available driver — this stub just creates the ride record."""
    ride_ref = db.collection("rides").document()
    ride_data = {
        "riderId": user.uid,
        "driverId": None,
        "pickup": payload.pickup.model_dump(),
        "dropoff": payload.dropoff.model_dump(),
        "vehicleClass": payload.vehicle_class,
        "status": "searching",
        "fare": payload.estimated_fare,  # locked in from the estimate the rider saw
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    ride_ref.set(ride_data)
    return {"ride_id": ride_ref.id, **ride_data}


@router.get("/{ride_id}")
async def get_ride(ride_id: str, user: CurrentUser = Depends(get_current_user)):
    doc = db.collection("rides").document(ride_id).get()
    if not doc.exists:
        raise HTTPException(404, "Ride not found")
    return {"ride_id": doc.id, **doc.to_dict()}


@router.post("/{ride_id}/status")
async def update_ride_status(ride_id: str, payload: RideStatusUpdate, user: CurrentUser = Depends(get_current_user)):
    """Driver (or the matching engine) moves the ride through its state machine."""
    ride_ref = db.collection("rides").document(ride_id)
    if not ride_ref.get().exists:
        raise HTTPException(404, "Ride not found")

    update = {"status": payload.status}
    if payload.status == "accepted":
        update["driverId"] = user.uid
    if payload.status == "completed":
        update["endedAt"] = datetime.now(timezone.utc).isoformat()

    ride_ref.update(update)
    return {"ride_id": ride_id, **update}


@router.get("/history/me")
async def my_ride_history(user: CurrentUser = Depends(get_current_user)):
    rides = (
        db.collection("rides")
        .where("riderId", "==", user.uid)
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )
    return [{"ride_id": r.id, **r.to_dict()} for r in rides]


@router.post("/driver/location")
async def update_driver_location(payload: DriverLocationUpdate, user: CurrentUser = Depends(get_current_user)):
    """Driver app calls this every few seconds during an active trip.
    In production, the driver's mobile app should write directly to the
    Realtime Database with the Firebase client SDK instead of round-tripping
    through this endpoint - it's lower latency and this is exactly the write
    pattern RTDB is built for. This endpoint exists as a fallback/testing path."""
    driver_location_ref(user.uid).set({
        "lat": payload.lat,
        "lng": payload.lng,
        "heading": payload.heading,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "ok"}