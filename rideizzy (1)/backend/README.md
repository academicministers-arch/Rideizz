# Rideizzy Backend (FastAPI + Firebase)

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com using your Google account.
2. Enable **Authentication → Google Sign-In** and **Firestore Database** (start in production mode).
3. Go to **Project Settings → Service Accounts → Generate new private key**. Save the
   downloaded JSON as `backend/firebase-service-account.json` (do NOT commit this file).
4. Copy `.env.example` to `.env` and fill in your project id.

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then edit .env
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs for the interactive API docs (Swagger UI) —
useful for testing endpoints before the mobile app is wired up.

## How auth works here

- The React Native app signs the user in with **Firebase Auth (Google Sign-In)**.
- On every API call, it sends `Authorization: Bearer <firebase_id_token>`.
- `app/core/auth.py` verifies that token server-side and loads the user's
  roles from Firestore — no separate login system needed on the backend.

## Project structure

```
app/
  core/       # firebase init, auth verification
  models/     # pydantic request/response schemas
  modules/
    rides/    # ride-hailing endpoints
    school/   # school bus/coaster booking endpoints
    travel/   # flight request/quote endpoints via travel agency
    shared/   # user profile, wallet
  main.py     # FastAPI app, mounts all routers
```

## Firestore security rules

The API enforces role checks server-side, but you should ALSO lock down
Firestore directly (since the mobile app's Firebase SDK can, in principle,
read Firestore directly too). Ask for a `firestore.rules` file next if you
want that layer written out.

## Flight quote approval flow

`flight_requests.status` moves through: `pending` → `quoted` (agent
submitted) → `quote_approved` (admin signed off) → `confirmed` (traveler
accepted). The traveler never sees a quote until an admin approves it via
`POST /travel/admin/quotes/{quote_id}/approve` — this is a deliberate gate,
not just a status label.

## How travel agencies get access

There's no self-serve "sign up as an agency" flow. An admin calls
`POST /admin/agencies` with the agency's contact email. That's just a
record — it doesn't create a login. The first time someone signs in with
that exact Google email, `POST /users/profile` (in `shared/router.py`)
checks the `agencies` collection, finds the match, and silently adds the
`agent` role plus links their `agencyId`. This avoids needing to create
Firebase accounts on someone else's behalf.

## Granting the admin role

There's intentionally no API endpoint that grants `"admin"` — add it
directly to a user's `roles` array in the Firestore console for your own
account. Everything else that only an admin can do (`require_role("admin")`)
checks against that array.

## Next steps

- Add a background worker (or Cloud Function) for actual driver-matching
  logic in `rides/request_ride` instead of just setting status "searching".
- Add a payment provider integration (Flutterwave/Paystack/Stripe) as its
  own module — call it from wallet top-ups and from ride/booking payment
  confirmation, writing to the `transactions` collection.
- Add Firebase Cloud Messaging server-side calls so notifications actually
  push instead of only being polled via `/notifications/me`.
- Add a screen/endpoint flow for assigning a vehicle+driver to a school trip
  (`POST /school/trips/{id}/assign` exists, no UI consumes it yet).
