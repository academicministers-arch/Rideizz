import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { api } from "../../services/api";

export default function AdminAgenciesScreen() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadAgencies() {
    api.get("/admin/agencies").then(({ data }) => setAgencies(data));
  }

  useEffect(loadAgencies, []);

  async function handleInvite() {
    if (!name || !email) return;
    setSubmitting(true);
    try {
      await api.post("/admin/agencies", { name, contact_email: email });
      setName("");
      setEmail("");
      Alert.alert("Invited", "They'll get agent access the next time they sign in with this Google email.");
      loadAgencies();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Agencies</Text>

      <View style={styles.inviteForm}>
        <TextInput style={styles.input} placeholder="Agency name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Contact Google email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.inviteButton} onPress={handleInvite} disabled={submitting}>
          <Text style={styles.inviteText}>{submitting ? "Inviting..." : "Invite Agency"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={agencies}
        keyExtractor={(item) => item.agency_id}
        ListEmptyComponent={<Text style={styles.empty}>No agencies invited yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.agencyName}>{item.name}</Text>
            <Text style={styles.meta}>{item.contactEmail}</Text>
            <Text style={[styles.status, item.status === "active" ? styles.active : styles.invited]}>
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  inviteForm: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 10 },
  inviteButton: { backgroundColor: "#1A73E8", padding: 14, borderRadius: 10, alignItems: "center" },
  inviteText: { color: "#fff", fontWeight: "700" },
  empty: { color: "#888", marginTop: 20, textAlign: "center" },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 14, marginBottom: 10 },
  agencyName: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666", marginTop: 2 },
  status: { fontSize: 12, marginTop: 6, fontWeight: "700" },
  active: { color: "#1A9E4E" },
  invited: { color: "#B8860B" },
});
