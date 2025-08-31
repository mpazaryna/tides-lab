// Main navigation stack with proper TypeScript types

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, View } from "react-native";
import { AlignLeft, ChartLine } from "lucide-react-native";
import Home from "../screens/Main/Home";
import Settings from "../screens/Main/Settings";
import TideDetails from "../screens/Main/TideDetails";
import { MainStackParamList, Routes, NavigationOptions } from "./types";
import { colors } from "../design-system/tokens";
import { useTimeContext } from "../context/TimeContext";
import { getContextDateRangeWithOffset } from "../utils/contextUtils";
import { Text } from "../components/Text";

const Stack = createNativeStackNavigator<MainStackParamList>();

const SettingsHeaderButton = React.memo(({ navigation }: any) => (
  <TouchableOpacity
    onPress={() => navigation.navigate(Routes.main.settings)}
    style={{ padding: 8 }}
  >
    <AlignLeft size={24} color={colors.titleColor} />
  </TouchableOpacity>
));

const TidesHeaderButton = React.memo(({ navigation }: any) => (
  <TouchableOpacity
    onPress={() => navigation.navigate(Routes.main.settings)}
    style={{ padding: 8 }}
  >
    <ChartLine size={24} color={colors.titleColor} />
  </TouchableOpacity>
));
1;

const HomeScreenTitle: React.FC<{ route: any }> = ({ route }) => {
  const { currentContext, dateOffset } = useTimeContext();

  const title = route.params?.tideId
    ? `${route.params?.tideName || "Home"} (${route.params.tideId})`
    : getContextDateRangeWithOffset(currentContext, dateOffset);

  return (
    <View style={{ alignItems: "center" }}>
      <Text color={colors.titleColor} variant="header">
        {title}
      </Text>
    </View>
  );
};

const getHomeScreenOptions = ({ navigation, route }: any) => ({
  headerTitle: () => <HomeScreenTitle route={route} />,
  headerTintColor: colors.primary[900],
  headerShown: true,
  headerShadowVisible: false,
  headerRight: () => <TidesHeaderButton navigation={navigation} />,
  headerLeft: () => <SettingsHeaderButton navigation={navigation} />,
  headerTransparent: true,
  headerStyle: {
    backgroundColor: 'transparent',
  },
});

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={Routes.main.home}
      screenOptions={{
        ...NavigationOptions.withHeader,
        headerStyle: {
          backgroundColor: colors.backgroundColor,
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
