import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";

import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { useServerEnvironment } from "../../context/ServerEnvironmentContext";
import { MainStackParamList } from "../../navigation/types";
import { loggingService } from "../../services/loggingService";
import { Text } from "../../components/Text";
import { colors, spacing } from "../../design-system/tokens";
import { Card } from "../../components/Card";
import { useTidesManagement } from "../../hooks/useTidesManagement";
import { useToolMenu } from "../../hooks/useToolMenu";
import { useDebugPanel } from "../../hooks/useDebugPanel";
import { useChatInput } from "../../hooks/useChatInput";
// import { useAIFeatures, TideSession, UserContext } from "../../hooks/useAIFeatures";
// import { TidesSection } from "../../components/tides/TidesSection";
// import { ToolCallDisplay } from "../../components/tools/ToolCallDisplay";
import { DebugPanel } from "../../components/debug/DebugPanel";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { ChatInput } from "../../components/chat/ChatInput";
import { ToolMenu } from "../../components/tools/ToolMenu";
// import { AIInsightsSection } from "../../components/ai/AIInsightsSection";
import {
  createAgentContext,
  executeAgentCommand,
} from "../../utils/agentCommandUtils";

type HomeScreenRouteProp = RouteProp<MainStackParamList, "Home">;

export default function Home() {
  const route = useRoute<HomeScreenRouteProp>();
  const { tideId } = route.params || {};

  const { getCurrentServerUrl, updateServerUrl, isConnected } = useMCP();
  const { currentEnvironment, switchEnvironment, environments } =
    useServerEnvironment();
  const {
    messages,
    isLoading,
    error,
    // pendingToolCalls,
    sendMessage,
    executeMCPTool,
    sendAgentMessage,
    checkConnections,
  } = useChat();

  const [_agentInitialized, setAgentInitialized] = useState(false);

  // Tides state management
  const {
    activeTides,
    //  tidesLoading,
    //   tidesError,
    refreshing,
    refreshTides,
  } = useTidesManagement(isConnected);

  // Tool menu state management
  const {
    showToolMenu,
    toolButtonActive,
    rotationAnim,
    menuHeightAnim,
    toggleToolMenu,
    getToolAvailability,
    handleToolSelect,
  } = useToolMenu({
    activeTides,
    tideId,
    executeMCPTool,
    sendMessage,
  });

  // Debug panel state management
  const {
    showDebugPanel,
    debugTestResults,
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

  // Chat input state management
  const { inputMessage, setInputMessage, handleSendMessage } = useChatInput({
    activeTides,
    tideId,
    isConnected,
    getCurrentServerUrl,
    sendAgentMessage,
    runDebugTests,
    testEdgeCases,
    setShowDebugPanel,
    setDebugTestResults,
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

  // Handle agent commands
  const handleAgentCommand = useCallback(
    async (command: string) => {
      const context = createAgentContext({
        tideId,
        activeTides,
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
      tideId,
      activeTides,
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
    <KeyboardAvoidingView
      style={[styles.keyboardContainer]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Error Display */}
      {error && (
        <Card variant="outlined" padding={3} style={styles.errorCard}>
          <Text variant="body" color="error">
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => checkConnections()}
            style={styles.retryButton}
          >
            <Text variant="bodySmall" color="primary">
              Retry Connection
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Active Tides Section */}
      {/* <TidesSection
        isConnected={isConnected}
        activeTides={activeTides}
        tidesLoading={tidesLoading}
        tidesError={tidesError}
        refreshing={refreshing}
        refreshTides={refreshTides}
      /> */}

      {/* AI Insights Section */}
      {/* {isConnected && (
        <AIInsightsSection
          insights={insights}
          suggestions={suggestions}
          isAnalyzing={isAnalyzing}
          isGeneratingSuggestions={isGeneratingSuggestions}
          error={aiError}
          onAnalyzePress={handleAnalyzeProductivity}
          onSuggestionsPress={handleGetFlowSuggestions}
          onClearError={handleClearAIError}
        />
      )} */}

      {/* Messages */}
      <ChatMessages
        ref={scrollViewRef}
        messages={messages}
        refreshing={refreshing}
        refreshTides={refreshTides}
      />

      {/* Debug Panel */}
      <DebugPanel
        showDebugPanel={showDebugPanel}
        debugTestResults={debugTestResults}
        setShowDebugPanel={setShowDebugPanel}
        setDebugTestResults={setDebugTestResults}
      />

      {/* Pending Tool Calls */}
      {/* {pendingToolCalls.map((toolCall) => (
        <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
      ))} */}

      {/* Tool Menu */}
      <ToolMenu
        showToolMenu={showToolMenu}
        menuHeightAnim={menuHeightAnim}
        handleToolSelect={handleToolSelect}
        handleAgentCommand={handleAgentCommand}
        refreshTides={refreshTides}
        toggleToolMenu={toggleToolMenu}
        getToolAvailability={getToolAvailability}
      />

      {/* Chat Input */}
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        toolButtonActive={toolButtonActive}
        rotationAnim={rotationAnim}
        toggleToolMenu={toggleToolMenu}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  errorCard: {
    margin: spacing[4],
    backgroundColor: colors.error + "10",
    borderColor: colors.error + "30",
  },
  retryButton: {
    marginTop: spacing[2],
  },
});
