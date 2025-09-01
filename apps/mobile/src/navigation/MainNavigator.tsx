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
import { getHumanisticTimeContext } from "../utils/timeContextHelpers";
import { Text } from "../design-system";

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

  const timeContext = getHumanisticTimeContext(currentContext, dateOffset);
  const isCurrentTime =
    timeContext === "Today" ||
    timeContext === "This week" ||
    timeContext === "This month";

  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", minHeight: 40 }}
    >
      <Text
        color={colors.titleColor}
        style={{ lineHeight: 18.4 }}
        variant="body"
        weight="semibold"
      >
        {title}
      </Text>
      {!isCurrentTime && (
        <Text
          color={colors.inputPlaceholder}
          variant="caption"
          style={{ lineHeight: 13.8 }}
        >
          {timeContext}
        </Text>
      )}
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
    backgroundColor: "transparent",
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
