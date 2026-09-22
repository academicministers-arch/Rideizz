import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Rideizzy</Text>
      <Text style={styles.tagline}>Rides. School transport. Flights.</Text>

      <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  logo: { fontSize: 32, fontWeight: "700", color: "#1A73E8", marginBottom: 8 },
  tagline: { fontSize: 14, color: "#666", marginBottom: 48 },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
  },
  googleButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
});
