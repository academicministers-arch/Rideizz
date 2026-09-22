import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { api } from "../../services/api";

export default function AdminQuoteApprovalScreen() {
  const [quotes, setQuotes] = useState<any[]>([]);

  function load() {
    api.get("/travel/admin/quotes/pending").then(({ data }) => setQuotes(data));
  }

  useEffect(load, []);

  async function approve(quoteId: string) {
    await api.post(`/travel/admin/quotes/${quoteId}/approve`);
    Alert.alert("Approved", "The traveler has been notified.");
    load();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quotes Awaiting Approval</Text>

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.quote_id}
        ListEmptyComponent={<Text style={styles.empty}>Nothing waiting on you right now.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.price}>{item.price} {item.currency}</Text>
            <Text style={styles.itinerary}>{item.itinerary}</Text>
            <TouchableOpacity style={styles.approveButton} onPress={() => approve(item.quote_id)}>
              <Text style={styles.approveText}>Approve & Notify Traveler</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  empty: { color: "#888", marginTop: 20, textAlign: "center" },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16, marginBottom: 12 },
  price: { fontSize: 18, fontWeight: "700", color: "#1A73E8" },
  itinerary: { fontSize: 14, color: "#444", marginTop: 6, marginBottom: 12 },
  approveButton: { backgroundColor: "#1A9E4E", padding: 12, borderRadius: 8, alignItems: "center" },
  approveText: { color: "#fff", fontWeight: "700" },
});
