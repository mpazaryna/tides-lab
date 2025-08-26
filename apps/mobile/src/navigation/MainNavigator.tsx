// Main navigation stack with proper TypeScript types

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, StyleSheet } from "react-native";
import Home from "../screens/Main/Home";
import Chat from "../screens/Main/Chat";
import Settings from "../screens/Main/Settings";
import { MainStackParamList, Routes, NavigationOptions } from "./types";
import { Text } from "../design-system";

const Stack = createNativeStackNavigator<MainStackParamList>();

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
  },
});

const SettingsHeaderButton = ({ navigation }: any) => (
  <TouchableOpacity
    onPress={() => navigation.navigate(Routes.main.settings)}
    style={styles.headerButton}
  >
    <Text variant="body" color="primary" weight="medium">
      Settings
    </Text>
  </TouchableOpacity>
);

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.main.home}
      screenOptions={NavigationOptions.withHeader}
    >
      <Stack.Screen
        name={Routes.main.home}
        component={Home}
        options={({ navigation }) => ({
          title: "Home",
          headerShown: true,
          headerRight: () => <SettingsHeaderButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name={Routes.main.chat}
        component={Chat}
        options={{
          title: "Chat Assistant",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.server}
        component={Home} // TODO: Replace with actual Server component
        options={{
          title: "Server Settings",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.mcp}
        component={Home} // TODO: Replace with actual MCP component
        options={{
          title: "MCP Connection",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.settings}
        component={Settings}
        options={{
          title: "Settings",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.tidesList}
        component={Home} // TODO: Replace with actual TidesList component
        options={{
          title: "Your Tides",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.tide}
        component={Home} // TODO: Replace with actual Tide component
        options={({ route }) => ({
          title: route.params?.tideName || "Tide Details",
          headerShown: true,
        })}
      />
      <Stack.Screen
        name={Routes.main.flowSession}
        component={Home} // TODO: Replace with actual FlowSession component
        options={NavigationOptions.fullScreen}
      />
      <Stack.Screen
        name={Routes.main.tideDetails}
        component={Home} // TODO: Replace with actual TideDetails component
        options={{
          title: "Tide Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.profile}
        component={Home} // TODO: Replace with actual Profile component
        options={{
          title: "Profile",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={Routes.main.about}
        component={Home} // TODO: Replace with actual About component
        options={{
          title: "About",
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
