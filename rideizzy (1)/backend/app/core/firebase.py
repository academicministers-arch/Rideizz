"""
Initializes the Firebase Admin SDK once for the whole app.
This gives the backend access to:
  - Firestore (our main database - users, rides, bookings, quotes...)
  - Realtime Database (live driver location only - chosen for its low-latency,
    high-write-frequency design, which suits GPS pings better than Firestore)
  - Auth (to verify tokens sent from the React Native app after Google Sign-In)
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth, db as rtdb

_CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "")

if not firebase_admin._apps:
    cred = credentials.Certificate(_CRED_PATH)
    firebase_admin.initialize_app(cred, {"databaseURL": _DATABASE_URL} if _DATABASE_URL else None)

db = firestore.client()
firebase_auth = auth  # re-exported so other modules just `from app.core.firebase import firebase_auth`


def driver_location_ref(driver_uid: str):
    """Realtime Database reference for one driver's live location,
    at path: driver_locations/{driver_uid}"""
    return rtdb.reference(f"driver_locations/{driver_uid}")