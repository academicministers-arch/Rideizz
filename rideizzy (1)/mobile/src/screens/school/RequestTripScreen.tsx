import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const VEHICLE_TYPES = ["coaster", "bus"];

export default function RequestTripScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengerCount, setPassengerCount] = useState("");
  const [vehicleType, setVehicleType] = useState("coaster");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post("/school/trips", {
        school_id: profile?.schoolId,
        destination,
        date,
        passenger_count: parseInt(passengerCount, 10) || 0,
        vehicle_type: vehicleType,
        notes,
      });
      Alert.alert("Trip requested", "We'll assign a vehicle and driver shortly.");
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Destination</Text>
      <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="e.g. National Museum" />

      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Number of passengers</Text>
      <TextInput style={styles.input} value={passengerCount} onChangeText={setPassengerCount} keyboardType="number-pad" placeholder="e.g. 40" />

      <Text style={styles.label}>Vehicle type</Text>
      <View style={styles.vehicleRow}>
        {VEHICLE_TYPES.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.vehicleOption, vehicleType === v && styles.vehicleOptionSelected]}
            onPress={() => setVehicleType(v)}
          >
            <Text style={vehicleType === v ? styles.vehicleTextSelected : styles.vehicleText}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Special requirements..." />

      <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.confirmText}>{submitting ? "Submitting..." : "Submit Trip Request"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 13, color: "#666", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15 },
  vehicleRow: { flexDirection: "row", gap: 10 },
  vehicleOption: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, alignItems: "center" },
  vehicleOptionSelected: { borderColor: "#1A73E8", backgroundColor: "#EAF1FD" },
  vehicleText: { color: "#333" },
  vehicleTextSelected: { color: "#1A73E8", fontWeight: "700" },
  confirmButton: { marginTop: 28, backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
