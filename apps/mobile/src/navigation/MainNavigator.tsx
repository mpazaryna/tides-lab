// Main navigation stack with proper TypeScript types

import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  TouchableOpacity,
  View,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  AlignLeft,
  ChartLine,
  Sun,
  Waves,
  Moon,
  Lock,
} from "lucide-react-native";
import Home from "../screens/Main/Home";
import Settings from "../screens/Main/Settings";
import TideDetails from "../screens/Main/TideDetails";
import { MainStackParamList, Routes, NavigationOptions } from "./types";
import { colors } from "../design-system/tokens";
import { useTimeContext, TimeContextType } from "../context/TimeContext";
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
  const {
    currentContext,
    setCurrentContext,
    dateOffset,
    isAtPresent,
    resetToPresent,
    contextSwitchingDisabled, // New: check if tool execution is disabling context switching
  } = useTimeContext();
  const [showTooltip, setShowTooltip] = useState(false);

  const title = route.params?.tideId
    ? `${route.params?.tideName || "Home"} (${route.params.tideId})`
    : getContextDateRangeWithOffset(currentContext, dateOffset);

  const contextOptions: {
    label: string;
    value: TimeContextType;
    icon: any;
    disabled?: boolean;
  }[] = [
    { label: "Daily", value: "daily", icon: Sun },
    { label: "Weekly", value: "weekly", icon: Waves },
    { label: "Monthly", value: "monthly", icon: Moon },
    { label: "Project", value: "project", icon: ChartLine, disabled: true },
  ];

  const handleTitlePress = () => {
    if (route.params?.tideId) return; // Don't show context switcher when viewing specific tide
    if (contextSwitchingDisabled) return; // Don't show when tool is executing
    setShowTooltip(!showTooltip);
  };

  const handleContextSelect = async (value: TimeContextType) => {
    if (contextSwitchingDisabled) return; // Prevent context switching during tool execution

    if (currentContext === value && !isAtPresent) {
      // If clicking the same context and not at present, jump to present
      resetToPresent();
    } else {
      // Otherwise, switch context (now integrates with tide system)
      await setCurrentContext(value);
    }
    setShowTooltip(false);
  };

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        onPress={handleTitlePress}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginVertical: -8,
          marginHorizontal: -12,
          opacity: contextSwitchingDisabled ? 0.6 : 1.0, // Visual feedback when disabled
        }}
        disabled={contextSwitchingDisabled}
      >
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            marginTop: 0,
          }}
        >
          <Text color={colors.titleColor} variant="header">
            {title}
          </Text>
          {/* 
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 2.5,
            }}
          >
            <Text variant="captionSmall" color={colors.text.tertiary}>
              {contextOptions.find((option) => option.value === currentContext)
                ?.label || currentContext}{" "}
              Tide
            </Text>

            <ChevronDown
              size={11.5}
              color={colors.text.tertiary}
              strokeWidth={2.5}
              style={{ marginLeft: 2.5 }}
            />
          </View> */}
        </View>
      </TouchableOpacity>

      <Modal visible={showTooltip} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowTooltip(false)}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                marginTop: 60, // Adjust based on header height
              }}
            >
              {/* Upward pointing caret with border */}
              <View style={{ alignSelf: "center" }}>
                {/* Border triangle (slightly larger, behind) */}
                <View
                  style={{
                    width: 0,
                    height: 0,
                    backgroundColor: "transparent",
                    borderStyle: "solid",
                    borderLeftWidth: 9,
                    borderRightWidth: 9,
                    borderBottomWidth: 9,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: colors.neutral[200],
                    position: "absolute",
                    top: -0.5,
                    left: -1,
                    zIndex: 0,
                  }}
                />
                {/* Main triangle (on top) */}
                <View
                  style={{
                    width: 0,
                    height: 0,
                    backgroundColor: "transparent",
                    borderStyle: "solid",
                    borderLeftWidth: 8,
                    borderRightWidth: 8,
                    borderBottomWidth: 8,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderBottomColor: colors.background.secondary,
                    marginBottom: -1,
                    zIndex: 1001,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1.5 },
                    shadowOpacity: 0.03,
                    shadowRadius: 1.5,
                  }}
                />
              </View>

              {/* Tooltip container */}
              <View
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 16,
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1.5 },
                  shadowOpacity: 0.03,
                  shadowRadius: 1.5,
                  elevation: 4,
                  borderWidth: 0.5,
                  borderColor: colors.neutral[200],
                  gap: 8,
                  width: 296,
                }}
              >
                {contextOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = currentContext === option.value;
                  const isDisabled =
                    contextSwitchingDisabled || option.disabled;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleContextSelect(option.value)}
                      disabled={isDisabled}
                      style={{
                        paddingVertical: 10,
                        paddingBottom: 7.5,
                        borderRadius: 8,
                        backgroundColor: isSelected
                          ? colors.primary[100]
                          : "transparent",
                        alignItems: "center",
                        width: 64,
                        opacity: isDisabled ? 0.7 : 1.0, // Visual feedback when disabled
                      }}
                    >
                      <IconComponent
                        size={20}
                        color={
                          isDisabled
                            ? colors.neutral[300]
                            : isSelected
                            ? colors.text.primary
                            : colors.text.tertiary
                        }
                        strokeWidth={2}
                        style={{ marginBottom: 2.5 }}
                      />
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {option.disabled && (
                          <Lock
                            size={8}
                            color={colors.neutral[400]}
                            strokeWidth={2}
                            style={{ marginRight: 2 }}
                          />
                        )}
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? "500" : "400",
                            color: isDisabled
                              ? colors.neutral[300]
                              : isSelected
                              ? colors.text.primary
                              : colors.text.tertiary,
                            textAlign: "center",
                          }}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  back: colors.backgroundColor,
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
