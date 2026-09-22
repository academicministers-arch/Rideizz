from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.auth import get_current_user, CurrentUser
from app.core.google_maps import autocomplete_places, get_place_details

router = APIRouter(prefix="/maps", tags=["maps"])


@router.get("/autocomplete")
async def autocomplete(input: str = Query(..., min_length=2), user: CurrentUser = Depends(get_current_user)):
    """Called as the user types in a pickup/dropoff field. Returns suggestions
    to show in a dropdown list - the mobile app shows `description` and, once
    the user taps one, calls /maps/place-details/{place_id} to get real coordinates."""
    try:
        return await autocomplete_places(input)
    except RuntimeError as e:
        raise HTTPException(502, str(e))


@router.get("/place-details/{place_id}")
async def place_details(place_id: str, user: CurrentUser = Depends(get_current_user)):
    """Called once the user taps a suggestion - turns it into real lat/lng
    the app can send to /rides/estimate, /rides/request, /delivery/request, etc."""
    try:
        return await get_place_details(place_id)
    except RuntimeError as e:
        raise HTTPException(502, str(e))