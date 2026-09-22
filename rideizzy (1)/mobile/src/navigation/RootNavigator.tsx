import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";

import RidesHomeScreen from "../screens/rides/RidesHomeScreen";
import RequestRideScreen from "../screens/rides/RequestRideScreen";
import FindingDriverScreen from "../screens/rides/FindingDriverScreen";
import RequestDeliveryScreen from "../screens/delivery/RequestDeliveryScreen";
import DeliveryTrackingScreen from "../screens/delivery/DeliveryTrackingScreen";

import SchoolTripsScreen from "../screens/school/SchoolTripsScreen";
import RequestTripScreen from "../screens/school/RequestTripScreen";

import RequestFlightScreen from "../screens/travel/RequestFlightScreen";
import FlightRequestStatusScreen from "../screens/travel/FlightRequestStatusScreen";

import AgentQueueScreen from "../screens/agent/AgentQueueScreen";
import SubmitQuoteScreen from "../screens/agent/SubmitQuoteScreen";

import AdminAgenciesScreen from "../screens/admin/AdminAgenciesScreen";
import AdminQuoteApprovalScreen from "../screens/admin/AdminQuoteApprovalScreen";

import NotificationsScreen from "../screens/notifications/NotificationsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function RidesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RidesHome" component={RidesHomeScreen} />
      <Stack.Screen name="RequestRide" component={RequestRideScreen} options={{ headerShown: true, title: "Request a Ride" }} />
      <Stack.Screen name="FindingDriver" component={FindingDriverScreen} options={{ headerShown: true, title: "Your Ride" }} />
      <Stack.Screen name="RequestDelivery" component={RequestDeliveryScreen} options={{ headerShown: true, title: "Send a Package" }} />
      <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} options={{ headerShown: true, title: "Delivery" }} />
    </Stack.Navigator>
  );
}

// school_admin only - requesting trips for the school, not parents booking kids
function SchoolStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SchoolTrips" component={SchoolTripsScreen} />
      <Stack.Screen name="RequestTrip" component={RequestTripScreen} options={{ headerShown: true, title: "Request a Trip" }} />
    </Stack.Navigator>
  );
}

function TravelStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RequestFlight" component={RequestFlightScreen} />
      <Stack.Screen name="FlightRequestStatus" component={FlightRequestStatusScreen} options={{ headerShown: true, title: "Flight Request" }} />
    </Stack.Navigator>
  );
}

// agent role - travel agency staff, invited by admin
function AgentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgentQueue" component={AgentQueueScreen} />
      <Stack.Screen name="SubmitQuote" component={SubmitQuoteScreen} options={{ headerShown: true, title: "Submit Quote" }} />
    </Stack.Navigator>
  );
}

// admin role - invite agencies, approve quotes
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="AdminQuoteApproval" component={AdminQuoteApprovalScreen} options={{ title: "Approvals" }} />
      <Stack.Screen name="AdminAgencies" component={AdminAgenciesScreen} options={{ title: "Agencies" }} />
    </Stack.Navigator>
  );
}

// Tabs shown depend on which roles the logged-in user has.
function MainTabs() {
  const { profile } = useAuth();
  const roles = profile?.roles ?? [];

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {roles.includes("rider") && <Tab.Screen name="Rides" component={RidesStack} />}
      {roles.includes("school_admin") && <Tab.Screen name="School" component={SchoolStack} />}
      {roles.includes("rider") && <Tab.Screen name="Travel" component={TravelStack} />}
      {roles.includes("agent") && <Tab.Screen name="Agency" component={AgentStack} />}
      {roles.includes("admin") && <Tab.Screen name="Admin" component={AdminStack} />}
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen />
      ) : !profile ? (
        <RoleSelectionScreen />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}