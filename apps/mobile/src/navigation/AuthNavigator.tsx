// Authentication navigation stack with proper TypeScript types

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Initial from "../screens/Auth/Initial";
import CreateAccount from "../screens/Auth/CreateAccount";
import EmailConfirmation from "../screens/Auth/EmailConfirmation";
import { AuthStackParamList, Routes, NavigationOptions } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.auth.initial}
      screenOptions={NavigationOptions.noGesture}
    >
      <Stack.Screen
        name={Routes.auth.initial}
        component={Initial}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name={Routes.auth.createAccount}
        component={CreateAccount}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name={Routes.auth.emailConfirmation}
        component={EmailConfirmation}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      {/* AuthLoading screen can be added when needed */}
    </Stack.Navigator>
  );
}

// Export types for backwards compatibility
export type AuthNavigationParams = AuthStackParamList;
