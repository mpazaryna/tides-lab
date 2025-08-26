// Main navigation stack with proper TypeScript types

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import { AlignLeft, ChartLine } from "lucide-react-native";
import Home from "../screens/Main/Home";
import Settings from "../screens/Main/Settings";
import TideDetails from "../screens/Main/TideDetails";
import { MainStackParamList, Routes, NavigationOptions } from "./types";
import { colors } from "../design-system/tokens";

const Stack = createNativeStackNavigator<MainStackParamList>();

const SettingsHeaderButton = React.memo(({ navigation }: any) => (
  <TouchableOpacity
    onPress={() => navigation.navigate(Routes.main.settings)}
    style={{ padding: 8 }}
  >
    <AlignLeft size={24} color={colors.primary[900]} />
  </TouchableOpacity>
));

const ProjectHeaderButton = React.memo(({ navigation }: any) => (
  <TouchableOpacity
    onPress={() => navigation.navigate(Routes.main.settings)}
    style={{ padding: 8 }}
  >
    <ChartLine size={24} color={colors.primary[900]} />
  </TouchableOpacity>
));
1;

// const TidesListHeaderButton = React.memo(({ navigation }: any) => (
//   <Button
//     onPress={() => navigation.navigate(Routes.main.tidesList)}
//     title="Chat"
//     color={colors.primary[500]}
//   />
// ));

const getHomeScreenOptions = ({ navigation, route }: any) => ({
  title: route.params?.tideId
    ? `${route.params?.tideName || "Home"} (${route.params.tideId})`
    : "Tides",
  headerTintColor: colors.primary[900],
  headerShown: true,
  headerShadowVisible: false,
  headerRight: () => <ProjectHeaderButton navigation={navigation} />,
  headerLeft: () => <SettingsHeaderButton navigation={navigation} />,

  back: colors.background.primary,
});

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.main.home}
      screenOptions={{
        ...NavigationOptions.withHeader,
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
      }}
    >
      <Stack.Screen
        name={Routes.main.home}
        component={Home}
        options={getHomeScreenOptions}
      />

      <Stack.Screen
        name={Routes.main.settings}
        component={Settings}
        options={{
          headerShadowVisible: false,
          title: "Settings",
          headerShown: true,
        }}
      />

      <Stack.Screen
        name={Routes.main.tideDetails}
        component={TideDetails}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
