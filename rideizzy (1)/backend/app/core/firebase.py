"""
Initializes the Firebase Admin SDK once for the whole app.
This gives the backend access to:
  - Firestore (our database)
  - Auth (to verify tokens sent from the React Native app after Google Sign-In)
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

_CRED_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(_CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()
firebase_auth = auth  # re-exported so other modules just `from app.core.firebase import firebase_auth`
