import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { api } from "../../services/api";

// This uses simple polling for clarity. For production, swap this for a live
// Firestore onSnapshot listener on `rides/{rideId}` from the client SDK -
// it's push-based and won't hammer your API.
export default function FindingDriverScreen() {
  const { params } = useRoute<any>();
  const { rideId } = params;
  const [ride, setRide] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await api.get(`/rides/${rideId}`);
      setRide(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [rideId]);

  if (!ride || ride.status === "searching") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.status}>Finding you a driver...</Text>
      </View>
    );
  }

  if (ride.status === "accepted" || ride.status === "in_progress") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Driver is on the way</Text>
        <Text style={styles.status}>Status: {ride.status}</Text>
        {/* TODO: render MapView here with a live Firestore listener on
            driver_locations/{ride.driverId} to show the approaching driver */}
      </View>
    );
  }

  if (ride.status === "completed") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Trip complete</Text>
        <Text style={styles.status}>Fare: {ride.fare ?? "—"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Ride {ride.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  status: { fontSize: 15, color: "#666", marginTop: 12 },
});
