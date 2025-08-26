import React, { useState, useCallback, useEffect, useRef } from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { useServerEnvironment } from "../../context/ServerEnvironmentContext";
import { MainStackParamList } from "../../navigation/types";
import { loggingService } from "../../services/loggingService";
import { colors, spacing } from "../../design-system/tokens";
import { useTidesManagement } from "../../hooks/useTidesManagement";
import { useToolMenu } from "../../hooks/useToolMenu";
import { useDebugPanel } from "../../hooks/useDebugPanel";
import { useChatInput } from "../../hooks/useChatInput";
import { useDailyTide } from "../../hooks/useDailyTide";
import { useContextTide } from "../../hooks/useContextTide";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { ChatInput } from "../../components/chat/ChatInput";
import { ToolMenu } from "../../components/tools/ToolMenu";
import { TideInfo } from "../../components/tides/TideInfo";

import {
  createAgentContext,
  executeAgentCommand,
} from "../../utils/agentCommandUtils";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "Home">;

export default function Home() {
  const navigation = useNavigation<NavigationProp>();

  const { getCurrentServerUrl, updateServerUrl, isConnected } = useMCP();
  const { currentEnvironment, switchEnvironment, environments } =
    useServerEnvironment();
  const {
    messages,
    isLoading,
    // pendingToolCalls,
    sendMessage,
    executeMCPTool,
    sendAgentMessage,
  } = useChat();

  const [_agentInitialized, setAgentInitialized] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  // Daily tide management - ensures hierarchical tides always exist
  const {
    dailyTide,
    isReady: dailyTideReady,
    loading: dailyTideLoading,
    error: dailyTideError,
    refreshDailyTide,
  } = useDailyTide();

  // Context tide management - handles daily/weekly/monthly switching
  const {
    currentContext,
    currentContextTide,
    isToolExecuting,
    contextSwitchingDisabled,
    switchContext,
    getCurrentContextTideId,
    setToolExecuting,
  } = useContextTide();

  // Tides state management
  const {
    activeTides,
    //  tidesLoading,
    //   tidesError,
    refreshTides,
  } = useTidesManagement(isConnected);

  // Tool menu state management - context-aware
  const {
    showToolMenu,
    toolButtonActive,
    rotationAnim,
    menuHeightAnim,
    toggleToolMenu,
    getToolAvailability,
    handleToolSelect,
  } = useToolMenu({
    executeMCPTool,
    sendMessage,
    getCurrentContextTideId,
    setToolExecuting,
  });

  // Debug panel state management
  const {
    // showDebugPanel,
    // debugTestResults,
    setShowDebugPanel,
    setDebugTestResults,
    runDebugTests,
    testEdgeCases,
  } = useDebugPanel({
    getCurrentServerUrl,
    currentEnvironment,
    isConnected,
    environments,
    switchEnvironment,
    updateServerUrl,
  });

  // Chat input state management - context-aware
  const {
    inputMessage,
    setInputMessage,
    handleSendMessage,
    toolSuggestion,
    showSuggestion,
    acceptSuggestion,
    dismissSuggestion,
  } = useChatInput({
    getCurrentContextTideId, // ✅ Context-aware tide ID
    isConnected,
    getCurrentServerUrl,
    sendMessage,
    runDebugTests,
    testEdgeCases,
    setShowDebugPanel,
    setDebugTestResults,
    executeMCPTool,
  });

  // AI features state management
  // const {
  //   insights,
  //   suggestions,
  //   isAnalyzing,
  //   isGeneratingSuggestions,
  //   error: aiError,
  //   analyzeProductivity,
  //   getFlowSuggestions,
  //   clearAIState,
  // } = useAIFeatures();

  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize agent service when component mounts
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const serverUrl = getCurrentServerUrl();
        setAgentInitialized(true);

        loggingService.info("Chat", "Agent service initialized", { serverUrl });
      } catch (initError) {
        loggingService.error("Chat", "Failed to initialize agent service", {
          error: initError,
        });
      }
    };

    initializeAgent();
  }, [getCurrentServerUrl]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle agent commands - context-aware
  const handleAgentCommand = useCallback(
    async (command: string) => {
      const contextTideId = getCurrentContextTideId();
      const context = createAgentContext({
        tideId: contextTideId, // ✅ Use context tide instead of route param
        activeTides,           // Keep for backward compatibility with agent system
        isConnected,
        getCurrentServerUrl,
      });

      await executeAgentCommand({
        command,
        context,
        sendAgentMessage,
        toggleToolMenu,
      });
    },
    [
      getCurrentContextTideId,
      activeTides,  // Keep for agent context compatibility
      isConnected,
      getCurrentServerUrl,
      sendAgentMessage,
      toggleToolMenu,
    ]
  );

  // // AI feature handlers
  // const handleAnalyzeProductivity = useCallback(async () => {
  //   // Create sample sessions for demonstration
  //   // In a real app, this would come from actual flow session data
  //   const sampleSessions: TideSession[] = [
  //     {
  //       duration: 25,
  //       energy_level: 8,
  //       completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  //       productivity_score: 9,
  //       intensity: 'moderate',
  //       work_context: 'Development work'
  //     },
  //     {
  //       duration: 30,
  //       energy_level: 6,
  //       completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  //       productivity_score: 7,
  //       intensity: 'gentle',
  //       work_context: 'Planning session'
  //     },
  //     {
  //       duration: 20,
  //       energy_level: 9,
  //       completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  //       productivity_score: 8,
  //       intensity: 'strong',
  //       work_context: 'Creative work'
  //     }
  //   ];

  //   await analyzeProductivity(sampleSessions, 'quick');
  // }, [analyzeProductivity]);

  // const handleGetFlowSuggestions = useCallback(async () => {
  //   // Create sample recent sessions for demonstration
  //   const recentSessions: TideSession[] = [
  //     {
  //       duration: 25,
  //       energy_level: 8,
  //       completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  //       productivity_score: 9,
  //     },
  //     {
  //       duration: 30,
  //       energy_level: 6,
  //       completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  //       productivity_score: 7,
  //     }
  //   ];

  //   const userContext: UserContext = {
  //     energy_level: 7, // Could be derived from latest session or user input
  //     recent_sessions: recentSessions,
  //     preferences: {
  //       work_style: 'focused', // Could be stored in user preferences
  //     },
  //   };

  //   await getFlowSuggestions(userContext);
  // }, [getFlowSuggestions]);

  // const handleClearAIError = useCallback(() => {
  //   clearAIState();
  // }, [clearAIState]);

  return (
    <View style={[styles.container]}>
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // scrollEnabled={isChatInputFocused}
        scrollEnabled={false}
      >
        {/* Tide Info Header */}
        <View style={styles.tideInfoHeader}>
          <TideInfo onPress={() => navigation.navigate("TidesList")} />
        </View>

        {/* Messages */}
        <ChatMessages messages={messages} />

        {/* <View style={styles.hierarchicalToggle}>
        <TouchableOpacity
          style={[
            styles.hierarchicalToggleButton,
            showHierarchicalComponents && styles.hierarchicalToggleButtonActive,
          ]}
          onPress={toggleHierarchicalComponents}
        >
          <Text
            style={[
              styles.hierarchicalToggleText,
              showHierarchicalComponents && styles.hierarchicalToggleTextActive,
            ]}
          >
            {showHierarchicalComponents ? "Hide" : "Show"} Hierarchical
          </Text>
        </TouchableOpacity>
      </View> */}
      </ScrollView>

      {/* Tool Menu Overlay */}
      {showToolMenu && (
        <TouchableOpacity
          style={styles.toolMenuOverlay}
          activeOpacity={1}
          onPress={toggleToolMenu}
        />
      )}

      {/* Tool Menu */}
      <ToolMenu
        showToolMenu={showToolMenu}
        menuHeightAnim={menuHeightAnim}
        handleToolSelect={handleToolSelect}
        handleAgentCommand={handleAgentCommand}
        refreshTides={refreshTides}
        toggleToolMenu={toggleToolMenu}
        scrollable={true}
        getToolAvailability={getToolAvailability}
      />
      {/* Chat Input with Hierarchical Toggle */}

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        toolButtonActive={toolButtonActive}
        rotationAnim={rotationAnim}
        toggleToolMenu={toggleToolMenu}
        toolSuggestion={toolSuggestion}
        showSuggestion={showSuggestion}
        onAcceptSuggestion={acceptSuggestion}
        onDismissSuggestion={dismissSuggestion}
        onFocusChange={setIsChatInputFocused}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  tideInfoHeader: {
    paddingTop: 10,
    backgroundColor: colors.background.primary,
    paddingVertical: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  tideInfoInnerHeader: {
    flex: 1,

    borderWidth: 0.5,
    // borderBottomWidth: 0.5,
    borderColor: colors.neutral[200],
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 1.5,
    // },
    // shadowRadius: 1.5,
    // shadowOpacity: 0.03,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
  },

  container: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  errorCard: {
    margin: spacing[4],
    backgroundColor: colors.error + "10",
    borderColor: colors.error + "30",
  },
  retryButton: {
    marginTop: spacing[2],
  },
  hierarchicalSection: {
    maxHeight: 400,
    backgroundColor: colors.background.secondary,
  },
  hierarchicalContent: {
    paddingVertical: spacing[2],
  },
  hierarchicalToggle: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    alignItems: "center",
  },
  hierarchicalToggleButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.neutral[100],
    borderRadius: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  hierarchicalToggleButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  hierarchicalToggleText: {
    color: colors.neutral[700],
    fontSize: 14,
    fontWeight: "500",
  },
  hierarchicalToggleTextActive: {
    color: colors.neutral[50],
  },
  contextSwitcherSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.background.primary,
  },
  toolMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
});
