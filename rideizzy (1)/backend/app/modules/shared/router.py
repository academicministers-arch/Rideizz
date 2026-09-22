from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user, CurrentUser
from app.core.firebase import db
from app.models.schemas import UserProfile

router = APIRouter(tags=["shared"])


@router.post("/users/profile")
async def create_or_update_profile(payload: UserProfile, user: CurrentUser = Depends(get_current_user)):
    """Called right after first Google Sign-In to save the user's profile +
    chosen role(s). Also checks: has an admin invited this exact email as a
    travel agency? If so, silently grant the 'agent' role and link the
    agency record - this is how agencies get access without us having to
    create Firebase accounts on their behalf."""
    roles = list(payload.roles)

    agency_matches = (
        db.collection("agencies")
        .where("contactEmail", "==", payload.email.lower())
        .limit(1)
        .stream()
    )
    agency_doc = next(agency_matches, None)
    agency_id = None
    if agency_doc:
        agency_id = agency_doc.id
        if "agent" not in roles:
            roles.append("agent")
        db.collection("agencies").document(agency_id).update({"status": "active"})

    profile_data = payload.model_dump()
    profile_data["roles"] = roles
    if agency_id:
        profile_data["agencyId"] = agency_id

    db.collection("users").document(user.uid).set(profile_data, merge=True)

    # every user gets a wallet the first time their profile is created
    wallet_ref = db.collection("wallets").document(user.uid)
    if not wallet_ref.get().exists:
        wallet_ref.set({"balance": 0, "currency": "USD"})

    return {"uid": user.uid, **profile_data}


@router.get("/users/me")
async def get_my_profile(user: CurrentUser = Depends(get_current_user)):
    doc = db.collection("users").document(user.uid).get()
    if not doc.exists:
        raise HTTPException(404, "Profile not found - call POST /users/profile first")
    return {"uid": user.uid, **doc.to_dict()}


@router.get("/wallet/me")
async def get_my_wallet(user: CurrentUser = Depends(get_current_user)):
    doc = db.collection("wallets").document(user.uid).get()
    if not doc.exists:
        raise HTTPException(404, "Wallet not found")
    return doc.to_dict()


@router.get("/wallet/transactions")
async def my_transactions(user: CurrentUser = Depends(get_current_user)):
    txns = (
        db.collection("transactions")
        .where("userId", "==", user.uid)
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )
    return [{"transaction_id": t.id, **t.to_dict()} for t in txns]


@router.get("/notifications/me")
async def my_notifications(user: CurrentUser = Depends(get_current_user)):
    notifs = (
        db.collection("notifications")
        .where("audience", "==", "user")
        .where("userId", "==", user.uid)
        .order_by("createdAt", direction="DESCENDING")
        .limit(50)
        .stream()
    )
    return [{"notification_id": n.id, **n.to_dict()} for n in notifs]
