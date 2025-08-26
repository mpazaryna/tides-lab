// Root navigation stack with enhanced types and loading states

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

import { RootStackParamList, Routes, NavigationOptions } from "./types";
import { Loading as LoadingScreen } from "../design-system";

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, apiKey, loading } = useAuth();

  // Show loading screen while determining auth state
  if (loading) {
    return <LoadingScreen message="Initializing app..." />;
  }

  const isAuthenticated = user && apiKey;

  return (
    <RootStack.Navigator
      screenOptions={{
        ...NavigationOptions.fullScreen,
        animationTypeForReplace: isAuthenticated ? "push" : "pop",
      }}
    >
      {isAuthenticated ? (
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
