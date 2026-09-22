# Rideizzy Mobile (React Native + Expo)

## Setup in VS Code

1. Install the **Expo Go** app on your phone (easiest way to test without a simulator).
2. In VS Code terminal:

```bash
cd mobile
npm install
```

3. Fill in your Firebase web config in `src/config/firebase.ts` (from Firebase
   Console > Project Settings > General > Your apps > Add app > Web).
4. Enable **Google** as a sign-in provider: Firebase Console > Authentication >
   Sign-in method > Google. Copy the **Web client ID** it generates into
   `src/context/AuthContext.tsx` (`clientId: "..."`).
5. Point `src/services/api.ts` at your running FastAPI backend's URL.
6. Run:

```bash
npx expo install expo-auth-session expo-web-browser
npm start
```

Scan the QR code with Expo Go (or press `a` / `i` for an emulator).

## Recommended VS Code extensions

- ES7+ React/Redux/React-Native snippets
- Prettier
- React Native Tools

## How the pieces fit together

```
App.tsx
  └─ AuthProvider          (src/context/AuthContext.tsx)
       └─ RootNavigator     (src/navigation/RootNavigator.tsx)
            ├─ LoginScreen          (not signed in)
            ├─ RoleSelectionScreen  (signed in, no profile yet)
            └─ MainTabs             (signed in, has profile)
                 ├─ Rides tab   → RidesHome → RequestRide → FindingDriver
                 ├─ School tab  → SchoolDashboard → BookTransport
                 └─ Travel tab  → RequestFlight → FlightRequestStatus
```

Every screen that needs data calls `src/services/api.ts`, which automatically
attaches the signed-in user's Firebase ID token to each request - the FastAPI
backend verifies it and knows who's calling.

## Roles and how they get access

- **rider** / **school_admin** / **driver** — self-selected at signup (`RoleSelectionScreen`).
- **agent** (travel agency staff) — NOT self-selected. An admin invites an
  agency by email (`AdminAgenciesScreen` → `POST /admin/agencies`). The next
  time that exact Google email signs in, the backend automatically grants
  the `agent` role and links their agency record — see
  `backend/app/modules/shared/router.py`.
- **admin** — not grantable from the app UI at all yet. Set this manually in
  Firestore: open the `users/{uid}` document for your own account and add
  `"admin"` to the `roles` array. This is intentional - you don't want a
  self-service path to admin.

## What's stubbed vs. what's real here

**Working end-to-end (once you fill in your Firebase keys):**
- Google Sign-In → backend token verification → role-based navigation
- Ride request → status polling → basic trip lifecycle
- School trip requests (school-organized trips only, no parent/child booking)
- Flight request → agent quote → **admin approval gate** → traveler accept/decline
- Admin inviting travel agencies by email, with auto role-grant on sign-in
- Notifications feed (polled), fired on quote approval to both traveler and admin

**Intentionally left as next steps** (flagged with `TODO` / comments in the code):
- Live driver location on a map (swap the polling in `FindingDriverScreen`
  for a Firestore `onSnapshot` listener on `driver_locations/{driverId}`)
- Real address autocomplete (currently hardcoded coordinates in
  `RequestRideScreen` - wire up `react-native-google-places-autocomplete`)
- Driver-side screens (backend route `/rides/driver/location` already exists)
- Vehicle/driver assignment UI for school trips (`POST /school/trips/{id}/assign`
  exists on the backend, no screen yet - likely an ops/admin screen)
- `schoolId` needs to actually be set on a school_admin's profile somewhere
  (currently assumed present in `SchoolTripsScreen`/`RequestTripScreen`)
- Payment screen + wallet top-up UI
- Real push notifications (Firebase Cloud Messaging) - the in-app
  notifications feed works now, but it's polled, not pushed

## Next steps I'd suggest

1. Get Google Sign-In actually working first (steps 3-4 above) - everything
   else depends on it.
2. Wire up `RequestRideScreen`'s hardcoded coordinates to real geocoding.
3. Build the driver-side app/screens next, since ride matching is the
   highest-value real-time feature.
