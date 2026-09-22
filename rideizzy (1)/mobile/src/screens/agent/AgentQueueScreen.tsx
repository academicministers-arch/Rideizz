import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";

export default function AgentQueueScreen() {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    api.get("/travel/requests/queue").then(({ data }) => setRequests(data));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flight Requests</Text>
      <Text style={styles.subtitle}>Awaiting a quote from you.</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.request_id}
        ListEmptyComponent={<Text style={styles.empty}>No pending requests right now.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("SubmitQuote", { requestId: item.request_id, request: item })}
          >
            <Text style={styles.route}>{item.origin} → {item.destination}</Text>
            <Text style={styles.meta}>{item.depart_date} · {item.passengers} pax · {item.cabin_class}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 16 },
  empty: { color: "#888", marginTop: 20, textAlign: "center" },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 14, marginBottom: 10 },
  route: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
});
