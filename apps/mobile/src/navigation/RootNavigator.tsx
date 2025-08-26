// Root navigation stack with enhanced types and loading states

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

import { RootStackParamList, Routes, NavigationOptions } from "./types";
import { LoadingScreen } from "../components/Loading";

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, loading } = useAuth();

  // Show loading screen while determining auth state
  if (loading) {
    return <LoadingScreen message="Initializing app..." />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        ...NavigationOptions.fullScreen,
        animationTypeForReplace: session ? "push" : "pop",
      }}
    >
      {session ? (
        <RootStack.Screen
          name={Routes.root.main}
          component={MainNavigator}
          options={{ gestureEnabled: true }}
        />
      ) : (
        <RootStack.Screen
          name={Routes.root.auth}
          component={AuthNavigator}
          options={{ gestureEnabled: true }}
        />
      )}
    </RootStack.Navigator>
  );
}

// Export types for backwards compatibility
export type { RootStackParamList } from "./types";
