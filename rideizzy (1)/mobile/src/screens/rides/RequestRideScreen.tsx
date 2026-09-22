import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PlaceAutocompleteInput from "../../components/PlaceAutocompleteInput";
import { PlaceDetails } from "../../services/maps";
import { api } from "../../services/api";

const RIDE_CLASSES = [
  { key: "motorbike", label: "Motorbike", note: "Fastest through traffic, 1 passenger" },
  { key: "economy", label: "Economy", note: "Affordable everyday rides" },
  { key: "comfort", label: "Comfort", note: "Newer cars, extra legroom" },
  { key: "xl", label: "XL", note: "For groups up to 6" },
];

export default function RequestRideScreen() {
  const navigation = useNavigation<any>();
  const [pickup, setPickup] = useState<PlaceDetails | null>(null);
  const [dropoff, setDropoff] = useState<PlaceDetails | null>(null);
  const [vehicleClass, setVehicleClass] = useState("economy");
  const [estimate, setEstimate] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handlePickupSelected(place: PlaceDetails) {
    setPickup(place);
    if (dropoff) await fetchEstimate(place, dropoff);
  }

  async function handleDropoffSelected(place: PlaceDetails) {
    setDropoff(place);
    if (pickup) await fetchEstimate(pickup, place);
  }

  async function fetchEstimate(p: PlaceDetails, d: PlaceDetails) {
    setEstimating(true);
    try {
      const { data } = await api.post("/rides/estimate", { pickup: p, dropoff: d });
      setEstimate(data);
    } finally {
      setEstimating(false);
    }
  }

  async function handleRequestRide() {
    if (!pickup || !dropoff) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/rides/request", {
        pickup,
        dropoff,
        vehicle_class: vehicleClass,
        estimated_fare: estimate?.estimates?.[vehicleClass] ?? null,
      });
      navigation.navigate("FindingDriver", { rideId: data.ride_id });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <PlaceAutocompleteInput placeholder="Pickup location" onSelect={handlePickupSelected} />
      <PlaceAutocompleteInput placeholder="Where to?" onSelect={handleDropoffSelected} />

      {estimating && <ActivityIndicator style={{ marginTop: 12 }} color="#1A73E8" />}

      {estimate && (
        <Text style={styles.tripMeta}>
          {estimate.distance_km} km · ~{Math.round(estimate.duration_min)} min
        </Text>
      )}

      <Text style={styles.sectionTitle}>Choose a ride</Text>
      {RIDE_CLASSES.map((v) => (
        <TouchableOpacity
          key={v.key}
          style={[styles.vehicleOption, vehicleClass === v.key && styles.vehicleOptionSelected]}
          onPress={() => setVehicleClass(v.key)}
        >
          <View>
            <Text style={styles.vehicleLabel}>{v.label}</Text>
            <Text style={styles.vehicleNote}>{v.note}</Text>
          </View>
          <Text style={styles.vehiclePrice}>
            {estimate ? `$${estimate.estimates[v.key].toFixed(2)}` : "—"}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.confirmButton, !estimate && styles.disabled]}
        onPress={handleRequestRide}
        disabled={submitting || !estimate}
      >
        <Text style={styles.confirmText}>{submitting ? "Requesting..." : "Confirm Ride"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  tripMeta: { fontSize: 13, color: "#666", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  vehicleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  vehicleOptionSelected: { borderColor: "#1A73E8", backgroundColor: "#EAF1FD" },
  vehicleLabel: { fontSize: 15, fontWeight: "600" },
  vehicleNote: { fontSize: 12, color: "#888", marginTop: 2 },
  vehiclePrice: { fontSize: 14, color: "#1A73E8", fontWeight: "700" },
  confirmButton: { marginTop: 20, backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center" },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});