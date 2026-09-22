import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";

export default function RequestFlightScreen() {
  const navigation = useNavigation<any>();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const { data } = await api.post("/travel/requests", {
        origin,
        destination,
        depart_date: departDate,
        passengers: parseInt(passengers, 10) || 1,
        cabin_class: "economy",
      });
      navigation.navigate("FlightRequestStatus", { requestId: data.request_id });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request a Flight</Text>
      <Text style={styles.subtitle}>Our travel partner will send you a quote.</Text>

      <TextInput style={styles.input} placeholder="From (city/airport)" value={origin} onChangeText={setOrigin} />
      <TextInput style={styles.input} placeholder="To (city/airport)" value={destination} onChangeText={setDestination} />
      <TextInput style={styles.input} placeholder="Departure date (YYYY-MM-DD)" value={departDate} onChangeText={setDepartDate} />
      <TextInput style={styles.input} placeholder="Passengers" value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />

      <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.confirmText}>{submitting ? "Sending..." : "Send Request"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15 },
  confirmButton: { marginTop: 16, backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
