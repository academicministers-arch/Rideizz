from pydantic import BaseModel
from typing import Optional, Literal


# ---------- Shared ----------
class UserProfile(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    roles: list[str] = []


# ---------- Rides ----------
class GeoPoint(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None


# Passenger ride classes: a motorbike (boda) is its own class, not a
# "cheap car" - different vehicle entirely, different pricing shape.
RideVehicleClass = Literal["motorbike", "economy", "comfort", "xl"]

# Delivery classes: a small motorbike delivery vs. hiring a truck for
# moving/house-shifting are very different jobs and price very differently.
DeliveryVehicleClass = Literal["delivery_motorbike", "delivery_truck_small", "delivery_truck_large"]


class RideRequest(BaseModel):
    pickup: GeoPoint
    dropoff: GeoPoint
    vehicle_class: RideVehicleClass = "economy"
    estimated_fare: Optional[float] = None  # from POST /rides/estimate, shown to rider before confirming


class FareEstimateRequest(BaseModel):
    pickup: GeoPoint
    dropoff: GeoPoint


class RideStatusUpdate(BaseModel):
    status: Literal["searching", "accepted", "in_progress", "completed", "cancelled"]


class DriverLocationUpdate(BaseModel):
    lat: float
    lng: float
    heading: Optional[float] = None


# ---------- Delivery (motorbike parcels or truck hire for moving/shifting) ----------
class DeliveryRequest(BaseModel):
    pickup: GeoPoint
    dropoff: GeoPoint
    vehicle_class: DeliveryVehicleClass
    package_description: str
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    estimated_fare: Optional[float] = None


class DeliveryStatusUpdate(BaseModel):
    status: Literal["searching", "accepted", "picked_up", "in_transit", "delivered", "cancelled"]


# ---------- School transport ----------
# School transport is trip-based only: a school requests a bus/coaster for a
# specific trip (sports day, excursion, event run). There is no parent-managed
# recurring daily booking in this app.
class SchoolTripRequest(BaseModel):
    school_id: str
    destination: str
    date: str
    passenger_count: int
    vehicle_type: Literal["bus", "coaster"] = "coaster"
    notes: Optional[str] = None


class TripAssignment(BaseModel):
    vehicle_id: str
    driver_id: str


class CheckEvent(BaseModel):
    student_name: str
    type: Literal["check_in", "check_out"]


# ---------- Travel ----------
class FlightRequest(BaseModel):
    origin: str
    destination: str
    depart_date: str
    return_date: Optional[str] = None
    passengers: int = 1
    cabin_class: Literal["economy", "premium", "business", "first"] = "economy"
    notes: Optional[str] = None


class FlightQuote(BaseModel):
    request_id: str
    price: float
    currency: str = "UGX"
    itinerary: str
    expires_at: str


class QuoteDecision(BaseModel):
    decision: Literal["accept", "decline"]


# ---------- Admin: agencies ----------
class AgencyInvite(BaseModel):
    name: str
    contact_email: str
    phone: Optional[str] = None