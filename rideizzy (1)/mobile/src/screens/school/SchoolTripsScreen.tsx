import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function SchoolTripsScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    // In a full build, schoolId would live on the school_admin's profile.
    // Assuming it's stored there as profile.schoolId once set up during onboarding.
    if (profile?.schoolId) {
      api.get(`/school/trips/${profile.schoolId}`).then(({ data }) => setTrips(data));
    }
  }, [profile]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>School Trips</Text>
      <Text style={styles.subtitle}>Request transport for a school trip or event.</Text>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.trip_id}
        ListEmptyComponent={<Text style={styles.empty}>No trips requested yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.destination}>{item.destination}</Text>
            <Text style={styles.meta}>{item.date} · {item.passenger_count} passengers · {item.vehicle_type}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("RequestTrip")}>
        <Text style={styles.primaryText}>Request a Trip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 16 },
  empty: { color: "#888", marginTop: 20, textAlign: "center" },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 14, marginBottom: 10 },
  destination: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
  status: { fontSize: 13, color: "#888", marginTop: 4 },
  primaryButton: { backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700" },
});
