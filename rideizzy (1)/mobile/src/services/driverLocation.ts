import { ref, set, onValue, off } from "firebase/database";
import { rtdb } from "../config/firebase";

/**
 * Called from the DRIVER's device during an active trip, every few seconds.
 * Writes straight to Realtime Database - no backend round trip - since RTDB
 * is built for exactly this write pattern (frequent, small, low-latency).
 * Wire this into a setInterval in the driver app's active-trip screen once
 * that screen exists.
 */
export function pushDriverLocation(driverUid: string, lat: number, lng: number, heading?: number) {
  return set(ref(rtdb, `driver_locations/${driverUid}`), {
    lat,
    lng,
    heading: heading ?? null,
    updatedAt: Date.now(),
  });
}

/**
 * Called from the RIDER's device to watch a specific driver move in real
 * time once a ride is accepted. Returns an unsubscribe function - call it
 * in a useEffect cleanup so you don't leak listeners between screens.
 */
export function watchDriverLocation(
  driverUid: string,
  callback: (loc: { lat: number; lng: number; heading: number | null } | null) => void
) {
  const locationRef = ref(rtdb, `driver_locations/${driverUid}`);
  const listener = onValue(locationRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(locationRef, "value", listener);
}