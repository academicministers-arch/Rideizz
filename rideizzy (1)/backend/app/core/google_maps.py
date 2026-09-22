"""
Thin wrapper around Google Maps Platform HTTP APIs. Kept server-side
(rather than called directly from the mobile app) so the API key never
ships inside the app bundle - only your backend ever sends it.
"""
import os
import httpx

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

_BASE = "https://maps.googleapis.com/maps/api"


async def autocomplete_places(input_text: str, session_token: str | None = None) -> list[dict]:
    """Returns a list of {description, place_id} suggestions as the user types."""
    params = {"input": input_text, "key": GOOGLE_MAPS_API_KEY}
    if session_token:
        params["sessiontoken"] = session_token

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{_BASE}/place/autocomplete/json", params=params)
    data = resp.json()

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise RuntimeError(f"Places autocomplete failed: {data.get('status')}")

    return [
        {"description": p["description"], "place_id": p["place_id"]}
        for p in data.get("predictions", [])
    ]


async def get_place_details(place_id: str) -> dict:
    """Turns a place_id (from autocomplete) into real lat/lng + formatted address."""
    params = {
        "place_id": place_id,
        "fields": "geometry,formatted_address",
        "key": GOOGLE_MAPS_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{_BASE}/place/details/json", params=params)
    data = resp.json()

    if data.get("status") != "OK":
        raise RuntimeError(f"Place details failed: {data.get('status')}")

    result = data["result"]
    location = result["geometry"]["location"]
    return {
        "lat": location["lat"],
        "lng": location["lng"],
        "address": result.get("formatted_address", ""),
    }


async def get_distance_and_duration(pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float) -> tuple[float, float]:
    """Returns (distance_km, duration_min) for the real driving route between two points."""
    params = {
        "origins": f"{pickup_lat},{pickup_lng}",
        "destinations": f"{dropoff_lat},{dropoff_lng}",
        "key": GOOGLE_MAPS_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{_BASE}/distancematrix/json", params=params)
    data = resp.json()

    try:
        element = data["rows"][0]["elements"][0]
        if element["status"] != "OK":
            raise KeyError
        distance_km = element["distance"]["value"] / 1000
        duration_min = element["duration"]["value"] / 60
    except (KeyError, IndexError):
        raise RuntimeError("Could not calculate a route between these points")

    return distance_km, duration_min