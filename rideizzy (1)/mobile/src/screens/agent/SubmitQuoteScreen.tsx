import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";

export default function SubmitQuoteScreen() {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();
  const { requestId, request } = params;

  const [price, setPrice] = useState("");
  const [itinerary, setItinerary] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post(`/travel/requests/${requestId}/quote`, {
        request_id: requestId,
        price: parseFloat(price) || 0,
        currency: "USD",
        itinerary,
        expires_at: expiresAt,
      });
      Alert.alert("Quote submitted", "Sent for admin approval before it reaches the traveler.");
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{request.origin} → {request.destination}</Text>
      <Text style={styles.subtitle}>{request.depart_date} · {request.passengers} pax</Text>

      <Text style={styles.label}>Price (USD)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 850" />

      <Text style={styles.label}>Itinerary details</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={itinerary}
        onChangeText={setItinerary}
        placeholder="Flight numbers, layovers, times..."
        multiline
      />

      <Text style={styles.label}>Quote expires</Text>
      <TextInput style={styles.input} value={expiresAt} onChangeText={setExpiresAt} placeholder="YYYY-MM-DD" />

      <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.confirmText}>{submitting ? "Sending..." : "Submit Quote for Approval"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 16 },
  label: { fontSize: 13, color: "#666", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  confirmButton: { marginTop: 24, backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
