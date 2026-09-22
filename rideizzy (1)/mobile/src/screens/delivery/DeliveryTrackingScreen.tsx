import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { api } from "../../services/api";
import { watchDriverLocation } from "../../services/driverLocation";
import { formatUGX } from "../../utils/currency";

const STATUS_LABELS: Record<string, string> = {
  searching: "Finding a driver...",
  accepted: "Driver assigned - heading to pickup",
  picked_up: "Picked up - on the way",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function DeliveryTrackingScreen() {
  const { params } = useRoute<any>();
  const { deliveryId } = params;
  const [delivery, setDelivery] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await api.get(`/delivery/${deliveryId}`);
      setDelivery(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [deliveryId]);

  useEffect(() => {
    if (!delivery?.driverId) return;
    const unsubscribe = watchDriverLocation(delivery.driverId, (loc) => {
      if (loc) setDriverLocation({ lat: loc.lat, lng: loc.lng });
    });
    return unsubscribe;
  }, [delivery?.driverId]);

  if (!delivery) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

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
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} title="Driver" />
        </MapView>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color="#1A73E8" />
        </View>
      )}

      <View style={styles.statusBar}>
        <Text style={styles.title}>{STATUS_LABELS[delivery.status] ?? delivery.status}</Text>
        <Text style={styles.meta}>{delivery.packageDescription}</Text>
        {delivery.fare != null && <Text style={styles.fare}>{formatUGX(delivery.fare)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  title: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
  fare: { fontSize: 16, fontWeight: "700", color: "#1A73E8", marginTop: 8 },
});