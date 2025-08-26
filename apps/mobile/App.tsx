// GREEN

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { TimeContextProvider } from "./src/context/TimeContext";
import { ServerEnvironmentProvider } from "./src/context/ServerEnvironmentContext";
import { AuthProvider } from "./src/context/AuthContext";
import { MCPProvider } from "./src/context/MCPContext";
import { ChatProvider } from "./src/context/ChatContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "./src/design-system/tokens";

const AppContent: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        style={{
          height: insets.top,
          backgroundColor: colors.background.primary,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TimeContextProvider>
          <ServerEnvironmentProvider>
            <AuthProvider>
              <MCPProvider>
                <ChatProvider>
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                </ChatProvider>
              </MCPProvider>
            </AuthProvider>
          </ServerEnvironmentProvider>
        </TimeContextProvider>
      </KeyboardAvoidingView>
      <View
        style={{
          height: insets.bottom,
          backgroundColor: colors.background.secondary,
        }}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
};

export default App;
