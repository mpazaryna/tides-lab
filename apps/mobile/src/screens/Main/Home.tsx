import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Clipboard,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { loggingService } from "../../services/loggingService";
import { colors, spacing } from "../../design-system/tokens";
import { useToolMenu } from "../../hooks/useToolMenu";
import { useChatInput } from "../../hooks/useChatInput";
import { useContextTide } from "../../hooks/useContextTide";
import { useTimeContext } from "../../context/TimeContext";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { ChatInput } from "../../components/chat/ChatInput";
import { ToolMenu } from "../../components/tools/ToolMenu";
// import { EnergyChart } from "../../components/tides/EnergyChart";

import {
  createAgentContext,
  executeAgentCommand,
} from "../../utils/agentCommandUtils";
import EnergyChart from "../../components/EnergyChart";
import { getChartData, numberToEnergyLevel } from "../../components/data/data";
import { ContextToggle } from "../../components/ContextToggle";
import { getSimpleTimeContext } from "../../utils/timeContextHelpers";
import { Text } from "../../design-system";
import {
  ChevronLeft,
  ChevronRight,
  Timer,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";

export default function Home() {
  const insets = useSafeAreaInsets();
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
  const CHART_HEIGHT = 44; // Chart height in pixels
  const CHART_MARGIN = 20; // Chart margin for axes space
  const { width } = useWindowDimensions();
  const CHART_WIDTH = width - 48; // Chart width from screen dimensions minus 52px

  const [_agentInitialized, setAgentInitialized] = useState(false);
  const [_isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [templateToInject, setTemplateToInject] = useState<string>("");

  // Context tide management - handles daily/weekly/monthly switching
  const { getCurrentContextTideId, setToolExecuting, currentContextTide } =
    useContextTide();

  // Time navigation for chart history
  const {
    navigateBackward,
    navigateForward,
    dateOffset,
    currentContext,
    isAtPresent,
  } = useTimeContext();

  // Get last energy level with formatted display
  const getLastEnergyDisplay = useCallback(() => {
    const chartData = getChartData();
    if (chartData.length === 0) return "No data";

    // Sort by timestamp to get the most recent
    const sortedData = chartData.sort((a, b) => b.x - a.x);
    const lastPoint = sortedData[0];

    // Convert to string descriptor and number
    const energyNumber = Math.round(lastPoint.y);
    const energyLabel = numberToEnergyLevel(energyNumber);

    // Capitalize first letter
    const capitalizedLabel =
      energyLabel.charAt(0).toUpperCase() + energyLabel.slice(1);

    return `${capitalizedLabel} (${energyNumber})`;
  }, []);

  // Get time and relative time since last update
  const getLastUpdatedDisplay = useCallback(() => {
    const chartData = getChartData();
    if (chartData.length === 0) return "No updates";

    // Sort by timestamp to get the most recent
    const sortedData = chartData.sort((a, b) => b.x - a.x);
    const lastPoint = sortedData[0];
    const lastUpdateTime = new Date(lastPoint.x);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdateTime.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format the actual time
    // const actualTime = lastUpdateTime.toLocaleTimeString([], {
    //   hour: 'numeric',
    //   minute: '2-digit',
    //   hour12: true
    // });
    
    // Format the relative time
    let relativeTime;
    if (minutes < 1) relativeTime = "Just now";
    else if (minutes < 60) relativeTime = `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    else if (hours < 24) relativeTime = `${hours} hour${hours > 1 ? "s" : ""} ago`;
    else if (days === 1) relativeTime = "Yesterday";
    else relativeTime = `${days} day${days > 1 ? "s" : ""} ago`;
    
    return `${relativeTime}`;
  }, []);



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
    <View style={[styles.container, { paddingTop: 44 }]}>
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
        <ImageBackground 
          source={require('../../../assets/defaultTidesGradient.png')}
          style={styles.energyChartWrapper}
          imageStyle={styles.energyChartBackgroundImage}
        >
          <View style={styles.descriptionContainerRow}>
            <View style={styles.wholeDescriptionContainer}>
              <View style={styles.descriptionContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text variant="caption" color="rgba(255,255,255,.5)">
                    Updated {getLastUpdatedDisplay()}
                  </Text>
                  <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
                </View>

           
                  <Text
                    variant="body"
                    weight="semibold"
                    color="rgba(255,255,255,1)"
                    style={styles.title}
                  >
                    {getLastEnergyDisplay()}
                  </Text>
   
            
              </View>
            </View>
            <View style={styles.wholeDescriptionContainer}>
              <View style={styles.descriptionContainer}>
                {/* <Text
                  variant="caption"
                  color="rgba(255,255,255,.5)"
                  style={{ textAlign: "right" }}
                >
                  {getSimpleTimeContext(currentContext, dateOffset)}
                </Text>
                <Text
                  variant="body"
                  weight="semibold"
                  color="rgba(255,255,255,1)"
                  style={styles.title}
                >
                  {isAtPresent ? 'Current' : `${dateOffset} ${currentContext === 'daily' ? 'day' : currentContext === 'weekly' ? 'week' : 'month'}${dateOffset > 1 ? 's' : ''} ago`}
                </Text> */}
              </View>
              <Timer />
            </View>
          </View>
          <EnergyChart
            data={getChartData()} // Sample data transformed to ChartDataPoint format
            chartHeight={CHART_HEIGHT}
            chartMargin={CHART_MARGIN}
            chartWidth={CHART_WIDTH}
          />
          {/* Context Toggle */}
          <View style={styles.contextToggleWrapper}>
            <TouchableOpacity
              onPress={navigateBackward}
              style={[styles.navigationButton, { opacity: 1 }]}
            >
              <ChevronLeft
                height={18}
                width={18}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
            <ContextToggle variant="full" showLabels={true} />
            <TouchableOpacity
              onPress={navigateForward}
              disabled={isAtPresent}
              style={[
                styles.navigationButton,
                { opacity: isAtPresent ? 0.3 : 1 },
              ]}
            >
              <ChevronRight
                height={18}
                width={18}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
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
  energyChartWrapper: {
    margin: 16,
    marginTop: 4,
    marginBottom: 0,
    borderRadius: 20,
    paddingBottom: 8,
    paddingHorizontal: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 13,
    overflow: "hidden",
  },
  energyChartBackgroundImage: {
    borderRadius: 20,
  },
  contextToggleWrapper: {
    paddingBottom: 0,
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: 10,
    width: "100%",
    height: 44,
  },
  descriptionContainerRow: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  wholeDescriptionContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  title: {},
  description: {
    color: "rgba(255,255,255,.6)",
    fontSize: 13,
  },
  navigationButton: {
    height: 28,
    width: 28,
    backgroundColor: "rgba(255,255,255,.08)",
    borderRadius: 100,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
