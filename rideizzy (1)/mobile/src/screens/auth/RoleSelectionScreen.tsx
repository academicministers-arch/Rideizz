import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const ROLE_OPTIONS = [
  { key: "rider", label: "I need rides or want to book flights" },
  { key: "school_admin", label: "I book transport trips for a school" },
  { key: "driver", label: "I'm a driver" },
];
// Note: "agent" (travel agency staff) isn't self-selected here - it's granted
// automatically when an admin-invited email signs in (see backend
// shared/router.py). "admin" is assigned manually in Firestore, not chosen here.

export default function RoleSelectionScreen() {
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]));
  }

  async function handleContinue() {
    await api.post("/users/profile", {
      name: user?.displayName ?? "",
      email: user?.email ?? "",
      roles: selected,
    });
    await refreshProfile();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What brings you to Rideizzy?</Text>
      <Text style={styles.subtitle}>Select all that apply — you can add more later.</Text>

      {ROLE_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.option, selected.includes(opt.key) && styles.optionSelected]}
          onPress={() => toggle(opt.key)}
        >
          <Text style={selected.includes(opt.key) ? styles.optionTextSelected : styles.optionText}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.continueButton, selected.length === 0 && styles.disabled]}
        disabled={selected.length === 0}
        onPress={handleContinue}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  option: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 16, marginBottom: 12 },
  optionSelected: { borderColor: "#1A73E8", backgroundColor: "#EAF1FD" },
  optionText: { fontSize: 15, color: "#333" },
  optionTextSelected: { fontSize: 15, color: "#1A73E8", fontWeight: "600" },
  continueButton: { marginTop: 24, backgroundColor: "#1A73E8", padding: 16, borderRadius: 10, alignItems: "center" },
  disabled: { opacity: 0.4 },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
