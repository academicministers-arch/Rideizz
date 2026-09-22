import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { api } from "../../services/api";
import { watchDriverLocation } from "../../services/driverLocation";
import { formatUGX } from "../../utils/currency";

// Ride status still comes from polling the API (it changes rarely: searching
// -> accepted -> in_progress -> completed). Driver location, which changes
// constantly, is watched live from Realtime Database instead - no polling.
export default function FindingDriverScreen() {
  const { params } = useRoute<any>();
  const { rideId } = params;
  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await api.get(`/rides/${rideId}`);
      setRide(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [rideId]);

  useEffect(() => {
    if (!ride?.driverId || (ride.status !== "accepted" && ride.status !== "in_progress")) return;
    const unsubscribe = watchDriverLocation(ride.driverId, (loc) => {
      if (loc) setDriverLocation({ lat: loc.lat, lng: loc.lng });
    });
    return unsubscribe;
  }, [ride?.driverId, ride?.status]);

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
      <View style={styles.container}>
        {driverLocation ? (
          <MapView
            style={StyleSheet.absoluteFillObject}
            region={{
              latitude: driverLocation.lat,
              longitude: driverLocation.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Your driver" />
          </MapView>
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color="#1A73E8" />
            <Text style={styles.status}>Waiting for driver's location...</Text>
          </View>
        )}
        <View style={styles.statusBar}>
          <Text style={styles.title}>Driver is on the way</Text>
          <Text style={styles.status}>Status: {ride.status}</Text>
        </View>
      </View>
    );
  }

  if (ride.status === "completed") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Trip complete</Text>
        <Text style={styles.status}>Fare: {formatUGX(ride.fare)}</Text>
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  status: { fontSize: 15, color: "#666", marginTop: 12 },
  statusBar: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
});