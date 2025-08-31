import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Clipboard,
} from "react-native";
import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { loggingService } from "../../services/loggingService";
import { colors, spacing } from "../../design-system/tokens";
import { useToolMenu } from "../../hooks/useToolMenu";
import { useChatInput } from "../../hooks/useChatInput";
import { useContextTide } from "../../hooks/useContextTide";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { ChatInput } from "../../components/chat/ChatInput";
import { ToolMenu } from "../../components/tools/ToolMenu";
// import { EnergyChart } from "../../components/tides/EnergyChart";

import {
  createAgentContext,
  executeAgentCommand,
} from "../../utils/agentCommandUtils";
import EnergyChart from "../../components/EnergyChart";
import { getChartData } from "../../components/data/data";

export default function Home() {
  const { getCurrentServerUrl, isConnected } = useMCP();
  const {
    messages,
    isLoading,
    // pendingToolCalls,
    sendMessage,
    executeMCPTool,
    sendAgentMessage,
  } = useChat();

  // ✅ REQUIREMENT 1: Defined size of chart and canvas
  const CHART_HEIGHT = 400; // Chart height in pixels
  const CHART_MARGIN = 20; // Chart margin for axes space
  const { width: CHART_WIDTH } = useWindowDimensions(); // Chart width from screen dimensions

  const [_agentInitialized, setAgentInitialized] = useState(false);
  const [_isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [templateToInject, setTemplateToInject] = useState<string>("");

  // Context tide management - handles daily/weekly/monthly switching
  const { getCurrentContextTideId, setToolExecuting, currentContextTide } =
    useContextTide();

  // Template injection callback
  const injectTemplate = useCallback((template: string) => {
    setTemplateToInject(template);
  }, []);

  // Clear template after injection
  const onTemplateInjected = useCallback(() => {
    setTemplateToInject("");
  }, []);

  // Copy conversation function
  const handleCopyConversation = useCallback(() => {
    if (messages.length === 0) {
      Alert.alert("No Messages", "There are no messages to copy.");
      return;
    }

    const conversationText = messages
      .map((message) => {
        const timestamp = new Date(message.timestamp).toLocaleString();
        const type =
          message.type === "user"
            ? "You"
            : message.type === "assistant"
            ? "Assistant"
            : "System";
        return `[${timestamp}] ${type}: ${message.content}`;
      })
      .join("\n\n");

    Clipboard.setString(conversationText);
    Alert.alert("Copied!", "Conversation copied to clipboard.");
  }, [messages]);

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
    injectTemplate,
  });

  // Chat input state management - context-aware
  const { inputMessage, setInputMessage, handleSendMessage } = useChatInput({
    getCurrentContextTideId, // ✅ Context-aware tide ID
    isConnected,
    getCurrentServerUrl,
    sendMessage,
    executeMCPTool,
  });

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
        tideId: contextTideId || undefined,
        currentContextTide,
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
      currentContextTide,
      isConnected,
      getCurrentServerUrl,
      sendAgentMessage,
      toggleToolMenu,
    ]
  );

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
        {/* <View style={styles.tideInfoHeader}>
          <EnergyChart onPress={() => ""} />
        </View> */}

        {/* ✅ REQUIREMENT 2: Sample data from getChartData() function */}
        <EnergyChart
          data={getChartData()} // Sample data transformed to ChartDataPoint format
          chartHeight={CHART_HEIGHT}
          chartMargin={CHART_MARGIN}
          chartWidth={CHART_WIDTH}
        />
        {/* Messages */}
        <ChatMessages messages={messages} />
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
        toggleToolMenu={toggleToolMenu}
        scrollable={true}
        getToolAvailability={getToolAvailability}
        onCopyConversation={handleCopyConversation}
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
        onFocusChange={setIsChatInputFocused}
        templateToInject={templateToInject}
        onTemplateInjected={onTemplateInjected}
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
    backgroundColor: colors.backgroundColor,
    paddingVertical: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  tideInfoInnerHeader: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: colors.containerBorder,
    backgroundColor: colors.containerBackground,
    borderRadius: 20,
  },

  container: {
    backgroundColor: colors.backgroundColor,
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
    borderColor: colors.containerBorder,
  },
  hierarchicalToggleButtonActive: {
    backgroundColor: colors.backgroundColor,
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
