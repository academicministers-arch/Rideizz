import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

const KAMPALA_FALLBACK = { latitude: 0.3476, longitude: 32.5825 };

export default function RidesHomeScreen() {
  const navigation = useNavigation<any>();
  const [region, setRegion] = useState({
    ...KAMPALA_FALLBACK,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return; // falls back to the default region above
      const position = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFillObject} region={region}>
        <Marker coordinate={region} title="You are here" />
      </MapView>

      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate("RequestRide")}>
        <Text style={styles.searchText}>Where to?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deliveryButton} onPress={() => navigation.navigate("RequestDelivery")}>
        <Text style={styles.deliveryText}>📦 Send a Package or Book a Truck</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  searchText: { color: "#888", fontSize: 15 },
  deliveryButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#1A73E8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
  },
  deliveryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});