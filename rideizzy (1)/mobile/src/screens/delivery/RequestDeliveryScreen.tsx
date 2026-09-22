import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PlaceAutocompleteInput from "../../components/PlaceAutocompleteInput";
import { PlaceDetails } from "../../services/maps";
import { api } from "../../services/api";
import { formatUGX } from "../../utils/currency";

const DELIVERY_CLASSES = [
  { key: "delivery_motorbike", label: "Motorbike Parcel", note: "Small packages, documents, food" },
  { key: "delivery_truck_small", label: "Small Truck", note: "A few boxes, small furniture move" },
  { key: "delivery_truck_large", label: "Large Truck", note: "Full house/office shifting" },
];

export default function RequestDeliveryScreen() {
  const navigation = useNavigation<any>();
  const [pickup, setPickup] = useState<PlaceDetails | null>(null);
  const [dropoff, setDropoff] = useState<PlaceDetails | null>(null);
  const [vehicleClass, setVehicleClass] = useState("delivery_motorbike");
  const [packageDescription, setPackageDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
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

  async function handleSubmit() {
    if (!pickup || !dropoff || !packageDescription) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/delivery/request", {
        pickup,
        dropoff,
        vehicle_class: vehicleClass,
        package_description: packageDescription,
        recipient_name: recipientName || null,
        recipient_phone: recipientPhone || null,
        estimated_fare: estimate?.estimates?.[vehicleClass] ?? null,
      });
      navigation.navigate("DeliveryTracking", { deliveryId: data.delivery_id });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <PlaceAutocompleteInput placeholder="Pickup location" onSelect={handlePickupSelected} />
      <PlaceAutocompleteInput placeholder="Delivery location" onSelect={handleDropoffSelected} />

      {estimating && <ActivityIndicator style={{ marginTop: 12 }} color="#1A73E8" />}
      {estimate && (
        <Text style={styles.tripMeta}>
          {estimate.distance_km} km · ~{Math.round(estimate.duration_min)} min
        </Text>
      )}

      <Text style={styles.sectionTitle}>What are you sending?</Text>
      {DELIVERY_CLASSES.map((v) => (
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
            {estimate ? formatUGX(estimate.estimates[v.key]) : "—"}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Package / load description</Text>
      <TextInput
        style={styles.input}
        value={packageDescription}
        onChangeText={setPackageDescription}
        placeholder="e.g. 2 boxes of clothes, or full 2-bedroom house move"
      />

      <Text style={styles.label}>Recipient name (optional)</Text>
      <TextInput style={styles.input} value={recipientName} onChangeText={setRecipientName} />

      <Text style={styles.label}>Recipient phone (optional)</Text>
      <TextInput style={styles.input} value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />

      <TouchableOpacity
        style={[styles.confirmButton, !estimate && styles.disabled]}
        onPress={handleSubmit}
        disabled={submitting || !estimate || !packageDescription}
      >
        <Text style={styles.confirmText}>{submitting ? "Requesting..." : "Confirm Delivery"}</Text>
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
  label: { fontSize: 13, color: "#666", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15 },
  confirmButton: { marginTop: 24, backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center" },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});