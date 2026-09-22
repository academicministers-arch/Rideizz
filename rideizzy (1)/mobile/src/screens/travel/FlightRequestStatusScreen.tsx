import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { api } from "../../services/api";
import { formatUGX } from "../../utils/currency";

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for a quote from our travel partner",
  quoted: "An agent has quoted this - awaiting admin approval",
  quote_approved: "Quote approved - review below",
  confirmed: "Booking confirmed",
  ticketed: "Ticket issued",
};

export default function FlightRequestStatusScreen() {
  const { params } = useRoute<any>();
  const { requestId } = params;
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await api.get("/travel/requests/me");
      const match = data.find((r: any) => r.request_id === requestId);
      if (match) setRequest(match);
    }, 4000);
    return () => clearInterval(interval);
  }, [requestId]);

  async function handleDecision(quoteId: string, decision: "accept" | "decline") {
    await api.post(`/travel/quotes/${quoteId}/decision`, { decision });
  }

  if (!request) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{request.origin} → {request.destination}</Text>
      <Text style={styles.status}>{STATUS_LABELS[request.status] ?? request.status}</Text>

      {request.status === "quote_approved" && request.quote && (
        <View style={styles.quoteCard}>
          <Text style={styles.quotePrice}>
            {request.quote.currency === "UGX" ? formatUGX(request.quote.price) : `${request.quote.price} ${request.quote.currency}`}
          </Text>
          <Text style={styles.quoteItinerary}>{request.quote.itinerary}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptButton} onPress={() => handleDecision(request.quote.quote_id, "accept")}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} onPress={() => handleDecision(request.quote.quote_id, "decline")}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700" },
  status: { fontSize: 14, color: "#666", marginTop: 8, marginBottom: 20 },
  quoteCard: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16 },
  quotePrice: { fontSize: 22, fontWeight: "700", color: "#1A73E8" },
  quoteItinerary: { fontSize: 14, color: "#444", marginTop: 8 },
  actions: { flexDirection: "row", marginTop: 16, gap: 10 },
  acceptButton: { flex: 1, backgroundColor: "#1A73E8", padding: 14, borderRadius: 10, alignItems: "center" },
  acceptText: { color: "#fff", fontWeight: "700" },
  declineButton: { flex: 1, borderWidth: 1, borderColor: "#ddd", padding: 14, borderRadius: 10, alignItems: "center" },
  declineText: { color: "#666", fontWeight: "700" },
});