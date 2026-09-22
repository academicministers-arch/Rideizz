"""
The mobile app signs the user in with Firebase Auth (Google Sign-In),
then sends the Firebase ID token on every request as:

    Authorization: Bearer <id_token>

This dependency verifies that token server-side and loads the user's
profile (including their roles) from Firestore, so every route knows
who's calling and what they're allowed to do.
"""
from fastapi import Header, HTTPException, Depends
from app.core.firebase import firebase_auth, db


class CurrentUser:
    def __init__(self, uid: str, email: str, roles: list[str]):
        self.uid = uid
        self.email = email
        self.roles = roles

    def has_role(self, role: str) -> bool:
        return role in self.roles


async def get_current_user(authorization: str = Header(...)) -> CurrentUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    id_token = authorization.split(" ", 1)[1]

    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    uid = decoded["uid"]
    email = decoded.get("email", "")

    user_doc = db.collection("users").document(uid).get()
    roles = user_doc.to_dict().get("roles", []) if user_doc.exists else []

    return CurrentUser(uid=uid, email=email, roles=roles)


def require_role(role: str):
    """Route guard: use as a dependency to restrict an endpoint to a role.
    Example: @router.post(..., dependencies=[Depends(require_role("school_admin"))])
    """
    async def checker(user: CurrentUser = Depends(get_current_user)):
        if not user.has_role(role):
            raise HTTPException(status_code=403, detail=f"Requires role: {role}")
        return user
    return checker
