import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowUp,
  Plus,
  Waves,
  Zap,
  Link,
  BarChart3,
  Users,
  FileText,
  Brain,
  Eye,
  Target,
  Clock,
  CheckCircle,
  PauseCircle,
} from "lucide-react-native";

import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { useServerEnvironment } from "../../context/ServerEnvironmentContext";
import { mcpService } from "../../services/mcpService";
import { Card, colors, spacing, Text, Stack } from "../../design-system";
import type { ChatMessage, MCPToolCall } from "../../types/chat";
import type { Tide } from "../../types";
import { MainStackParamList } from "../../navigation/types";
import { loggingService } from "../../services/loggingService";

type HomeScreenRouteProp = RouteProp<MainStackParamList, "Home">;

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
}) => {
  const getBubbleStyle = () => {
    // Check if this is an agent message
    if (message.metadata?.agentResponse) {
      return [styles.messageBubble, styles.agentBubble];
    }

    switch (message.type) {
      case "user":
        return [styles.messageBubble, styles.userBubble];
      case "assistant":
        return [styles.messageBubble, styles.assistantBubble];
      case "tool_result":
        return [styles.messageBubble, styles.toolBubble];
      case "system":
        return [styles.messageBubble, styles.systemBubble];
      default:
        return [styles.messageBubble, styles.assistantBubble];
    }
  };

  const getTextColor = () => {
    switch (message.type) {
      case "user":
        return "secondary";
      case "system":
        return "secondary";
      default:
        return "primary";
    }
  };

  const formatToolResult = (result: any) => {
    if (typeof result === "string") return result;
    if (typeof result === "object") {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage && styles.ownMessageContainer,
      ]}
    >
      <View style={getBubbleStyle()}>
        {message.metadata?.toolName && (
          <Text variant="bodySmall" color="tertiary" style={styles.toolName}>
            🔧 {message.metadata.toolName}
          </Text>
        )}

        {message.metadata?.agentResponse && (
          <Text variant="bodySmall" color="tertiary" style={styles.agentHeader}>
            Tides Agent
          </Text>
        )}

        <Text variant="body" color={getTextColor()}>
          {message.type === "tool_result" && message.metadata?.toolResult
            ? formatToolResult(message.metadata.toolResult)
            : message.content}
        </Text>

        {message.metadata?.error && (
          <Text variant="bodySmall" color="error" style={styles.errorText}>
            ⚠️ Error occurred
          </Text>
        )}
      </View>
      <Text variant="bodySmall" color="tertiary" style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );
};

interface ToolCallDisplayProps {
  toolCall: MCPToolCall;
}

interface TideCardProps {
  tide: Tide;
  onPress?: () => void;
}

const TideCard: React.FC<TideCardProps> = ({ tide, onPress }) => {
  const getFlowTypeIcon = (flowType: string) => {
    switch (flowType) {
      case "daily":
        return Clock;
      case "weekly":
        return Waves;
      case "project":
        return Target;
      case "seasonal":
        return PauseCircle;
      default:
        return Waves;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "paused":
        return PauseCircle;
      case "completed":
        return CheckCircle;
      default:
        return Waves;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "paused":
        return colors.warning;
      case "completed":
        return colors.primary[500];
      default:
        return colors.neutral[500];
    }
  };

  const FlowTypeIcon = getFlowTypeIcon(tide.flow_type);
  const StatusIcon = getStatusIcon(tide.status);
  const statusColor = getStatusColor(tide.status);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.tideCard}>
      <Card variant="outlined" padding={4}>
        <View style={styles.tideCardHeader}>
          <View style={styles.tideCardTitleRow}>
            <FlowTypeIcon size={20} color={colors.primary[500]} />
            <Text
              variant="h4"
              color="primary"
              numberOfLines={1}
              style={styles.tideCardTitle}
            >
              {tide.name}
            </Text>
          </View>
          <View style={styles.tideCardStatus}>
            <StatusIcon size={16} color={statusColor} />
            <Text
              variant="bodySmall"
              color="secondary"
              style={styles.tideCardStatusText}
            >
              {tide.status}
            </Text>
          </View>
        </View>

        {tide.description && (
          <Text
            variant="body"
            color="secondary"
            numberOfLines={2}
            style={styles.tideCardDescription}
          >
            {tide.description}
          </Text>
        )}

        <View style={styles.tideCardFooter}>
          <View style={styles.tideCardMeta}>
            <Text variant="caption" color="tertiary">
              {tide.flow_type} • Created {formatDate(tide.created_at)}
            </Text>
          </View>
          <View style={styles.tideCardStats}>
            {tide.flow_count !== undefined && (
              <Text variant="caption" color="tertiary">
                {tide.flow_count} flows
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
  const getStatusColor = () => {
    switch (toolCall.status) {
      case "completed":
        return colors.success;
      case "failed":
        return colors.error;
      case "executing":
        return colors.warning;
      default:
        return colors.neutral[500];
    }
  };

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "completed":
        return "✓";
      case "failed":
        return "✗";
      case "executing":
        return "⏳";
      default:
        return "⏸";
    }
  };

  return (
    <Card
      variant="outlined"
      padding={3}
      style={[styles.toolCallCard, { borderLeftColor: getStatusColor() }]}
    >
      <View style={styles.toolCallHeader}>
        <Text variant="body" weight="medium">
          {getStatusIcon()} {toolCall.name}
        </Text>
        <Text variant="bodySmall" color="secondary">
          {toolCall.status}
        </Text>
      </View>

      {Object.keys(toolCall.parameters).length > 0 && (
        <View style={styles.toolCallParams}>
          <Text variant="bodySmall" color="tertiary" weight="medium">
            Parameters:
          </Text>
          {Object.entries(toolCall.parameters).map(([key, value]) => (
            <Text key={key} variant="bodySmall" color="secondary">
              • {key}: {String(value)}
            </Text>
          ))}
        </View>
      )}

      {toolCall.error && (
        <Text variant="bodySmall" color="error" style={styles.toolCallError}>
          Error: {toolCall.error}
        </Text>
      )}
    </Card>
  );
};

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
    pendingToolCalls,
    sendMessage,
    executeMCPTool,
    sendAgentMessage,
    checkConnections,
  } = useChat();

  const [inputMessage, setInputMessage] = useState("");
  const [_agentInitialized, setAgentInitialized] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugTestResults, setDebugTestResults] = useState<string[]>([]);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [toolButtonActive, setToolButtonActive] = useState(false);

  // Tides state management
  const [activeTides, setActiveTides] = useState<Tide[]>([]);
  const [tidesLoading, setTidesLoading] = useState(false);
  const [tidesError, setTidesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const menuHeightAnim = useRef(new Animated.Value(0)).current;

  // Fetch active tides
  const fetchActiveTides = useCallback(async () => {
    try {
      setTidesError(null);
      loggingService.info("Home", "Fetching active tides", {});

      const response = await mcpService.listTides();

      if (response.success && response.tides) {
        // Filter for active tides only
        const activeOnly = response.tides.filter(
          (tide) => tide.status === "active"
        );
        setActiveTides(activeOnly);

        loggingService.info("Home", "Active tides fetched successfully", {
          count: activeOnly.length,
        });
      } else {
        throw new Error(response.error || "Failed to fetch tides");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tides";
      setTidesError(errorMessage);

      loggingService.error("Home", "Failed to fetch active tides", {
        error: errorMessage,
      });
    }
  }, []);

  // Load tides with loading state
  const loadActiveTides = useCallback(async () => {
    setTidesLoading(true);
    await fetchActiveTides();
    setTidesLoading(false);
  }, [fetchActiveTides]);

  // Refresh tides (for pull-to-refresh)
  const refreshTides = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveTides();
    setRefreshing(false);
  }, [fetchActiveTides]);

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

  // Load active tides when component mounts or when connection status changes
  useEffect(() => {
    if (isConnected) {
      loadActiveTides();
    }
  }, [isConnected, loadActiveTides]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Toggle tool menu with synchronized animations
  const toggleToolMenu = useCallback(() => {
    const isOpening = !showToolMenu;

    if (isOpening) {
      setShowToolMenu(true);
      setToolButtonActive(true); // Change color immediately

      // Synchronize button rotation and menu expansion
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(menuHeightAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      setToolButtonActive(false); // Change color immediately

      // Synchronize button rotation and menu collapse
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(menuHeightAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowToolMenu(false);
      });
    }
  }, [showToolMenu, rotationAnim, menuHeightAnim]);

  // Smart parameter generation and tool availability
  const generateDefaultParams = useCallback((toolName: string) => {
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    switch (toolName) {
      case "createTide":
        return {
          name: `Tide ${dateString} ${timeString}`,
          description: `Created on ${dateString} at ${timeString}`,
          flowType: "daily"
        };
      case "startTideFlow":
        return activeTides.length > 0 ? {
          tideId: activeTides[0].id,
          intensity: "moderate",
          duration: 25,
          initialEnergy: "moderate",
          workContext: "Quick flow session"
        } : null;
      case "addEnergyToTide":
        return activeTides.length > 0 ? {
          tideId: activeTides[0].id,
          energyLevel: "moderate",
          context: `Energy added at ${timeString}`
        } : null;
      case "linkTaskToTide":
        return activeTides.length > 0 ? {
          tideId: activeTides[0].id,
          taskUrl: `https://example.com/task-${Date.now()}`,
          taskTitle: `Task created ${timeString}`,
          taskType: "general"
        } : null;
      case "getTaskLinks":
        return activeTides.length > 0 ? {
          tideId: activeTides[0].id
        } : null;
      case "getTideReport":
        return activeTides.length > 0 ? {
          tideId: activeTides[0].id,
          format: "summary"
        } : null;
      case "getTideParticipants":
        return {
          statusFilter: "active",
          limit: 10
        };
      default:
        return {};
    }
  }, [activeTides]);

  const getToolAvailability = useCallback((toolName: string) => {
    switch (toolName) {
      case "createTide":
      case "getTideParticipants":
        return { available: true, reason: "" };
      case "startTideFlow":
      case "addEnergyToTide":
      case "linkTaskToTide":
      case "getTaskLinks":
      case "getTideReport":
        return activeTides.length > 0 
          ? { available: true, reason: "" }
          : { available: false, reason: "No active tides available. Create a tide first." };
      default:
        return { available: false, reason: "Unknown tool" };
    }
  }, [activeTides]);

  // Handle tool selection with smart availability checking
  const handleToolSelect = useCallback(
    async (toolName: string, customParameters?: Record<string, any>) => {
      // Check if tool is available
      const availability = getToolAvailability(toolName);
      
      if (!availability.available) {
        // Show helpful message about what's missing
        sendMessage(availability.reason);
        toggleToolMenu();
        return;
      }

      toggleToolMenu(); // Close menu first

      try {
        // Use custom parameters, or generate smart defaults, or fall back to tide context
        const params = customParameters || 
                      generateDefaultParams(toolName) || 
                      (tideId ? { tideId } : {});
        
        await executeMCPTool(toolName, params);

        loggingService.info("ToolMenu", "MCP tool executed from menu", {
          toolName,
          tideId,
          parameters: params,
          usedDefaults: !customParameters,
        });
      } catch (error) {
        loggingService.error(
          "ToolMenu",
          "Failed to execute MCP tool from menu",
          { error, toolName, tideId, parameters: customParameters }
        );
      }
    },
    [toggleToolMenu, executeMCPTool, tideId, getToolAvailability, generateDefaultParams, sendMessage]
  );

  // Handle agent commands
  const handleAgentCommand = useCallback(
    async (command: string) => {
      toggleToolMenu(); // Close menu first

      try {
        // Create comprehensive context for the agent
        const context = {
          // Current tide context (if navigated from a specific tide)
          ...(tideId && { tideId }),

          // User's active tides for insights and analysis
          activeTides: activeTides.map((tide) => ({
            id: tide.id,
            name: tide.name,
            flow_type: tide.flow_type,
            status: tide.status,
            created_at: tide.created_at,
            description: tide.description,
            flow_count: tide.flow_count,
            last_flow: tide.last_flow,
          })),

          // Current app state
          totalActiveTides: activeTides.length,
          currentScreen: "Home",

          // Connection state
          isConnected,
          currentServerUrl: getCurrentServerUrl(),

          // Timestamp for context
          requestedAt: new Date().toISOString(),
        };

        loggingService.info("ToolMenu", "Sending agent command with context", {
          command,
          contextKeys: Object.keys(context),
          activeTidesCount: activeTides.length,
        });

        await sendAgentMessage(command, context);

        loggingService.info("ToolMenu", "Agent command executed from menu", {
          command,
          tideId,
          contextProvided: true,
        });
      } catch (agentError) {
        loggingService.error(
          "ToolMenu",
          "Failed to execute agent command from menu",
          { error: agentError, command, tideId }
        );
      }
    },
    [
      toggleToolMenu,
      sendAgentMessage,
      tideId,
      activeTides,
      isConnected,
      getCurrentServerUrl,
    ]
  );

  // Debug test functions for getCurrentServerUrl
  const runDebugTests = useCallback(async () => {
    const results: string[] = [];

    // Test 1: Basic URL retrieval
    results.push("=== Test 1: Basic getCurrentServerUrl ===");
    const currentUrl = getCurrentServerUrl();
    results.push(`✓ Current URL: ${currentUrl}`);
    results.push(`✓ Current Environment: ${currentEnvironment}`);

    // Test 2: URL consistency check
    results.push("\n=== Test 2: URL Consistency ===");
    const url1 = getCurrentServerUrl();
    const url2 = getCurrentServerUrl();
    const url3 = getCurrentServerUrl();
    results.push(`✓ Call 1: ${url1}`);
    results.push(`✓ Call 2: ${url2}`);
    results.push(`✓ Call 3: ${url3}`);
    results.push(
      `✓ Consistent: ${url1 === url2 && url2 === url3 ? "YES" : "NO"}`
    );

    // Test 3: Connection state
    results.push("\n=== Test 3: Connection State ===");
    results.push(`✓ Is Connected: ${isConnected}`);
    results.push(`✓ URL Available: ${currentUrl ? "YES" : "NO"}`);

    // Test 4: Environment details
    results.push("\n=== Test 4: Environment Details ===");
    const envCount = Object.keys(environments).length;
    results.push(`✓ Available Environments: ${envCount}`);
    Object.values(environments).forEach((env) => {
      results.push(`  - ${env.name}: ${env.url}`);
    });

    setDebugTestResults(results);
    setShowDebugPanel(true);
  }, [getCurrentServerUrl, currentEnvironment, isConnected, environments]);

  // Test edge cases
  const testEdgeCases = useCallback(async () => {
    const results: string[] = [];

    results.push("=== Edge Case Tests ===\n");

    // Edge Case 1: Rapid calls
    results.push("Test: Rapid successive calls (100x)");
    const rapidUrls = new Set();
    for (let i = 0; i < 100; i++) {
      rapidUrls.add(getCurrentServerUrl());
    }
    results.push(`✓ Unique URLs returned: ${rapidUrls.size}`);
    results.push(`✓ Consistent: ${rapidUrls.size === 1 ? "YES" : "NO"}`);

    // Edge Case 2: Empty/null checks
    results.push("\nTest: URL validation");
    const url = getCurrentServerUrl();
    results.push(`✓ URL is not null: ${url !== null}`);
    results.push(`✓ URL is not undefined: ${url !== undefined}`);
    results.push(`✓ URL is not empty: ${url !== ""}`);
    results.push(`✓ URL starts with https://: ${url.startsWith("https://")}`);
    results.push(`✓ URL contains workers.dev: ${url.includes("workers.dev")}`);

    // Edge Case 3: Switch environment and test
    results.push("\nTest: Environment switching");
    const originalEnv = currentEnvironment;
    results.push(`✓ Original environment: ${originalEnv}`);

    try {
      // Try switching to a different environment
      const envKeys = Object.keys(environments);
      const differentEnv = envKeys.find((key) => key !== originalEnv);

      if (differentEnv) {
        results.push(`✓ Switching to: ${differentEnv}`);
        await switchEnvironment(differentEnv as any);

        const newUrl = getCurrentServerUrl();
        results.push(`✓ New URL after switch: ${newUrl}`);
        results.push(`✓ URLs are different: ${url !== newUrl ? "YES" : "NO"}`);

        // Switch back
        await switchEnvironment(originalEnv as any);
        const restoredUrl = getCurrentServerUrl();
        results.push(`✓ Restored URL: ${restoredUrl}`);
        results.push(
          `✓ Back to original: ${restoredUrl === url ? "YES" : "NO"}`
        );
      }
    } catch (switchError) {
      results.push(`✗ Error during switch: ${switchError}`);
    }

    // Edge Case 4: Invalid URL update attempt
    results.push("\nTest: Invalid URL update");
    try {
      await updateServerUrl("");
      results.push("✗ Empty URL accepted (should fail)");
    } catch {
      results.push("✓ Empty URL rejected");
    }

    try {
      await updateServerUrl("not-a-url");
      results.push("✗ Invalid URL accepted (should fail)");
    } catch {
      results.push("✓ Invalid URL rejected");
    }

    // Edge Case 5: Memory/performance test
    results.push("\nTest: Performance (1000 calls)");
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      getCurrentServerUrl();
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    results.push(`✓ 1000 calls completed in ${duration}ms`);
    results.push(`✓ Average per call: ${(duration / 1000).toFixed(2)}ms`);

    setDebugTestResults(results);
    setShowDebugPanel(true);
  }, [
    getCurrentServerUrl,
    currentEnvironment,
    environments,
    switchEnvironment,
    updateServerUrl,
  ]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");

    // Check for debug commands
    if (message === "/debug") {
      runDebugTests();
      return;
    } else if (message === "/debug edge") {
      testEdgeCases();
      return;
    } else if (message === "/debug hide") {
      setShowDebugPanel(false);
      setDebugTestResults([]);
      return;
    }

    loggingService.info("Chat", "Sending user message", {
      messageLength: message.length,
    });

    try {
      // Check if message starts with agent commands
      if (message.startsWith("/agent ")) {
        const agentQuery = message.substring(7);

        // Create comprehensive context for the agent (same as handleAgentCommand)
        const context = {
          // Current tide context (if navigated from a specific tide)
          ...(tideId && { tideId }),

          // User's active tides for insights and analysis
          activeTides: activeTides.map((tide) => ({
            id: tide.id,
            name: tide.name,
            flow_type: tide.flow_type,
            status: tide.status,
            created_at: tide.created_at,
            description: tide.description,
            flow_count: tide.flow_count,
            last_flow: tide.last_flow,
          })),

          // Current app state
          totalActiveTides: activeTides.length,
          currentScreen: "Home",

          // Connection state
          isConnected,
          currentServerUrl: getCurrentServerUrl(),

          // Timestamp for context
          requestedAt: new Date().toISOString(),
        };

        loggingService.info(
          "Chat",
          "Sending agent message with context via text input",
          {
            agentQuery,
            contextKeys: Object.keys(context),
            activeTidesCount: activeTides.length,
          }
        );

        await sendAgentMessage(agentQuery, context);
      } else if (message.startsWith("/tool ")) {
        // Direct tool execution
        const toolCommand = message.substring(6);
        const [toolName, ...paramParts] = toolCommand.split(" ");

        // Simple parameter parsing (tool param1=value1 param2=value2)
        const parameters: Record<string, any> = {};
        paramParts.forEach((part) => {
          const [key, value] = part.split("=");
          if (key && value) {
            parameters[key] = value;
          }
        });

        // Include tide context if available
        if (tideId && !parameters.tideId) {
          parameters.tideId = tideId;
        }

        await executeMCPTool(toolName, parameters);
      } else {
        // Regular message
        await sendMessage(message);
      }
    } catch (sendError) {
      loggingService.error("Chat", "Failed to send message", {
        error: sendError,
        message: message.substring(0, 50),
      });
    }
  }, [
    inputMessage,
    sendMessage,
    sendAgentMessage,
    executeMCPTool,
    runDebugTests,
    testEdgeCases,
    tideId,
    activeTides,
    isConnected,
    getCurrentServerUrl,
  ]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble
        key={item.id}
        message={item}
        isOwnMessage={item.type === "user"}
      />
    ),
    []
  );

  // Tool button component with availability checking
  const ToolButton = ({ toolName, icon: Icon, title }: { 
    toolName: string; 
    icon: any; 
    title: string; 
  }) => {
    const availability = getToolAvailability(toolName);
    const isDisabled = !availability.available;
    
    return (
      <TouchableOpacity
        style={[
          styles.toolMenuItem,
          isDisabled && styles.toolMenuItemDisabled
        ]}
        onPress={() => handleToolSelect(toolName)}
        disabled={isDisabled}
      >
        <View style={styles.toolMenuItemIcon}>
          <Icon 
            size={18} 
            color={isDisabled ? colors.neutral[300] : colors.primary[500]} 
          />
        </View>
        <View style={styles.toolMenuItemContent}>
          <Text
            variant="body"
            color={isDisabled ? "tertiary" : "primary"}
            style={styles.toolMenuItemTitle}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();

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
      {isConnected && (
        <Card variant="outlined" padding={4} style={styles.tidesSection}>
          <View style={styles.tidesSectionHeader}>
            <Text variant="h4" color="primary">
              Active Tides
            </Text>
            <TouchableOpacity onPress={refreshTides} disabled={refreshing}>
              <Text
                variant="bodySmall"
                color={refreshing ? "tertiary" : "primary"}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>

          {tidesError && (
            <Text variant="body" color="error" style={styles.tidesError}>
              {tidesError}
            </Text>
          )}

          {tidesLoading ? (
            <View style={styles.tidesLoading}>
              <Text variant="body" color="secondary">
                Loading tides...
              </Text>
            </View>
          ) : activeTides.length === 0 ? (
            <View style={styles.tidesEmpty}>
              <Waves size={48} color={colors.neutral[400]} />
              <Text
                variant="body"
                color="secondary"
                align="center"
                style={styles.tidesEmptyText}
              >
                No active tides yet
              </Text>
              <Text variant="bodySmall" color="tertiary" align="center">
                Create your first tide using the tools below
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tidesScrollView}
              contentContainerStyle={styles.tidesScrollContent}
            >
              {activeTides.map((tide) => (
                <TideCard
                  key={tide.id}
                  tide={tide}
                  onPress={() => {
                    loggingService.info("Home", "Tide card pressed", {
                      tideId: tide.id,
                      tideName: tide.name,
                    });
                    // TODO: Navigate to tide detail screen
                  }}
                />
              ))}
            </ScrollView>
          )}
        </Card>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTides}
            tintColor={colors.primary[500]}
          />
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="h4" color="secondary" align="center">
              Welcome to Chat!
            </Text>
            <Text
              variant="body"
              color="tertiary"
              align="center"
              style={styles.emptyStateDescription}
            >
              Ask questions, execute tools, or get insights from the
              TideProductivityAgent.
            </Text>
            <Stack spacing={2} style={styles.helpCommands}>
              <Text variant="bodySmall" color="secondary">
                Commands you can try:
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • Type a question naturally
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /agent [question] - Ask the agent
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /tool [toolName] param=value - Execute a tool
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • Use Quick Tools below for easy access
              </Text>
              <Text
                variant="bodySmall"
                color="primary"
                style={styles.debugCommandsTitle}
              >
                Debug Commands:
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /debug - Run getCurrentServerUrl tests
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /debug edge - Run edge case tests
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /debug hide - Hide debug panel
              </Text>
            </Stack>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        {/* Debug Panel */}
        {showDebugPanel && (
          <Card style={styles.debugPanel}>
            <View style={styles.debugPanelHeader}>
              <Text variant="h4" color="primary">
                Debug Test Results
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDebugPanel(false);
                  setDebugTestResults([]);
                }}
              >
                <Text variant="body" color="secondary">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.debugScrollView}>
              {debugTestResults.map((result, index) => (
                <Text
                  key={index}
                  variant="bodySmall"
                  color={
                    result.includes("✗")
                      ? "error"
                      : result.includes("===")
                      ? "primary"
                      : "secondary"
                  }
                  style={styles.debugResultText}
                >
                  {result}
                </Text>
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Pending Tool Calls */}
        {pendingToolCalls.map((toolCall) => (
          <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
        ))}
      </ScrollView>

      {/* Message Input */}
      <View
        style={[
          styles.inputContainer,
          { paddingBottom: insets.bottom, height: 65 + insets.bottom },
        ]}
      >
        {/* Tool Menu */}
        {showToolMenu && (
          <Animated.View
            style={[
              styles.toolMenu,
              {
                height: menuHeightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 700], // Max height of 250px
                }),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.toolMenuScroll}
            >
              {/* Core Tide Management */}
              <View style={styles.menuSection}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.sectionHeader}
                >
                  TIDE MANAGEMENT
                </Text>

                <ToolButton toolName="createTide" icon={Plus} title="Create Tide" />
                
                <TouchableOpacity
                  style={styles.toolMenuItem}
                  onPress={() => {
                    // List tides by refreshing the tides display
                    refreshTides();
                    toggleToolMenu();
                  }}
                >
                  <View style={styles.toolMenuItemIcon}>
                    <Waves size={18} color={colors.primary[500]} />
                  </View>
                  <View style={styles.toolMenuItemContent}>
                    <Text
                      variant="body"
                      color="primary"
                      style={styles.toolMenuItemTitle}
                    >
                      Refresh Tides
                    </Text>
                  </View>
                </TouchableOpacity>

                <ToolButton toolName="startTideFlow" icon={CheckCircle} title="Start Flow" />
              </View>

              {/* Agent Commands Section */}
              <View style={styles.menuSection}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.sectionHeader}
                >
                  AGENT COMMANDS
                </Text>

                <TouchableOpacity
                  style={styles.toolMenuItem}
                  onPress={() => handleAgentCommand("get insights")}
                >
                  <View style={styles.toolMenuItemIcon}>
                    <Brain size={18} color={colors.primary[500]} />
                  </View>
                  <View style={styles.toolMenuItemContent}>
                    <Text
                      variant="body"
                      color="primary"
                      style={styles.toolMenuItemTitle}
                    >
                      Get Insights
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toolMenuItem}
                  onPress={() => handleAgentCommand("analyze my tides")}
                >
                  <View style={styles.toolMenuItemIcon}>
                    <Eye size={18} color={colors.primary[500]} />
                  </View>
                  <View style={styles.toolMenuItemContent}>
                    <Text
                      variant="body"
                      color="primary"
                      style={styles.toolMenuItemTitle}
                    >
                      Analyze Tides
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toolMenuItem}
                  onPress={() => handleAgentCommand("recommend actions")}
                >
                  <View style={styles.toolMenuItemIcon}>
                    <Target size={18} color={colors.primary[500]} />
                  </View>
                  <View style={styles.toolMenuItemContent}>
                    <Text
                      variant="body"
                      color="primary"
                      style={styles.toolMenuItemTitle}
                    >
                      Get Recommendations
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Energy & Tasks Section */}
              <View style={styles.menuSection}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.sectionHeader}
                >
                  ENERGY & TASKS
                </Text>

                <ToolButton toolName="addEnergyToTide" icon={Zap} title="Add Energy" />
                <ToolButton toolName="linkTaskToTide" icon={Link} title="Link Task" />
                <ToolButton toolName="getTaskLinks" icon={FileText} title="View Task Links" />
              </View>

              {/* Analytics Section */}
              <View style={styles.menuSection}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.sectionHeader}
                >
                  ANALYTICS
                </Text>

                <ToolButton toolName="getTideReport" icon={BarChart3} title="Get Report" />
                <ToolButton toolName="getTideParticipants" icon={Users} title="View Participants" />
              </View>
            </ScrollView>
          </Animated.View>
        )}
        <View style={styles.mainRow}>
          <TouchableOpacity style={styles.toolButton} onPress={toggleToolMenu}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "45deg"],
                    }),
                  },
                ],
              }}
            >
              <Plus
                size={28}
                color={
                  toolButtonActive ? colors.primary[500] : colors.neutral[400]
                }
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.messageInput}
              placeholder="Ask anything"
              placeholderTextColor={colors.text.tertiary}
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputMessage.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <View
                style={[
                  styles.sendButtonColor,
                  !inputMessage.trim() && styles.sendButtonColorDisabled,
                ]}
              >
                <ArrowUp size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.background.secondary,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[2],
    gap: spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedDot: {
    backgroundColor: colors.success,
  },
  disconnectedDot: {
    backgroundColor: colors.error,
  },
  errorCard: {
    margin: spacing[4],
    backgroundColor: colors.error + "10",
    borderColor: colors.error + "30",
  },
  retryButton: {
    marginTop: spacing[2],
  },
  agentStatusCard: {
    margin: spacing[4],
    marginBottom: 0,
    backgroundColor: colors.info + "10",
    borderColor: colors.info + "30",
  },
  messagesContainer: {
    flex: 1,
    padding: spacing[5],
  },
  messagesContent: {
    paddingBottom: spacing[4],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
  },
  emptyStateDescription: {
    marginTop: spacing[3],
    marginBottom: spacing[6],
    textAlign: "center",
    paddingHorizontal: spacing[4],
  },
  helpCommands: {
    alignItems: "center",
  },
  messageContainer: {
    marginVertical: spacing[2],
    alignItems: "flex-start",
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "100%",
  },
  userBubble: {
    backgroundColor: colors.neutral[200],
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 7.5,
    borderRadius: 18,
    borderBottomRightRadius: 0,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  toolBubble: {
    backgroundColor: colors.success + "20",
    borderColor: colors.success + "40",
    borderWidth: 1,
  },
  systemBubble: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    borderWidth: 1,
  },
  agentBubble: {
    paddingRight: spacing[4],
  },
  toolName: {
    marginBottom: spacing[1],
  },
  agentHeader: {
    marginBottom: spacing[1],
    fontWeight: "500",
  },
  errorText: {
    marginTop: spacing[1],
  },
  timestamp: {
    marginTop: spacing[1],
    fontSize: 11,
  },
  toolCallCard: {
    marginVertical: spacing[2],
    borderLeftWidth: 3,
  },
  toolCallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  toolCallParams: {
    marginTop: spacing[2],
  },
  toolCallError: {
    marginTop: spacing[2],
    backgroundColor: colors.error + "10",
    padding: spacing[2],
    borderRadius: 4,
  },
  quickToolsContainer: {
    padding: spacing[4],
    borderTopWidth: 0.5,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.background.secondary,
  },
  quickToolsTitle: {
    marginBottom: spacing[2],
  },
  quickToolsList: {
    flexDirection: "row",
    gap: spacing[2],
  },

  quickToolButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  toolInputCard: {
    margin: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  toolInputTitle: {
    marginBottom: spacing[1],
  },
  toolDescription: {
    marginBottom: spacing[4],
  },
  parameterInput: {
    marginBottom: spacing[3],
  },
  parameterTextInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    padding: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    marginTop: spacing[1],
  },
  toolInputActions: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[4],
  },
  cancelButton: {
    flex: 1,
  },
  executeButton: {
    flex: 1,
  },
  toolButton: {
    height: 44,
    width: 44,
    backgroundColor: colors.neutral[200],
    borderRadius: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    backgroundColor: colors.background.secondary,
    display: "flex",
    height: 100,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  mainRow: {
    padding: spacing[4],
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.background.secondary,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.neutral[200],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -0.5,
    },
    shadowRadius: 0.5,
    shadowOpacity: 0.03,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    borderWidth: 0.5,
    borderColor: colors.neutral[300],
    borderRadius: 22.5,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1.5,
    },
    shadowRadius: 1.5,
    shadowOpacity: 0.03,

    backgroundColor: "white",
  },
  messageInput: {
    flex: 1,
    paddingLeft: spacing[4],
    paddingRight: 56,
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
    borderRadius: 1000,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
    bottom: 0,
    padding: 6,
  },
  sendButtonColor: {
    backgroundColor: colors.primary[500],
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    width: 32,
    height: 32,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonColorDisabled: {
    backgroundColor: colors.neutral[400],
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  quickActionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  // Tool Menu Styles
  toolMenu: {
    backgroundColor: colors.background.secondary,
    // borderBottomColor: colors.neutral[200],
    // borderBottomWidth: .5,
    width: "100%",
    overflow: "hidden", // Important for smooth height animation
  },
  toolMenuScroll: {
    flex: 1,
  },
  toolMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    height: 44,
  },
  toolMenuItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[2],
  },
  toolMenuItemContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  toolMenuItemLast: {
    borderBottomWidth: 0,
  },
  toolMenuItemTitle: {},
  toolMenuItemDisabled: {
    opacity: 0.5,
  },
  // Debug Panel Styles
  debugPanel: {
    margin: spacing[3],
    padding: spacing[4],
  },
  debugPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  debugScrollView: {
    maxHeight: 300,
  },
  debugResultText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 2,
  },
  debugCommandsTitle: {
    marginTop: 8,
  },
  // Menu Section Styles
  menuSection: {
    marginBottom: spacing[3],
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Tides Section Styles
  tidesSection: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  tidesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  tidesError: {
    marginBottom: spacing[3],
    textAlign: "center",
  },
  tidesLoading: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  tidesEmpty: {
    alignItems: "center",
    paddingVertical: spacing[6],
  },
  tidesEmptyText: {
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  tidesScrollView: {
    flexGrow: 0,
  },
  tidesScrollContent: {
    paddingRight: spacing[4],
  },

  // Tide Card Styles
  tideCard: {
    width: 280,
    marginRight: spacing[3],
  },
  tideCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[2],
  },
  tideCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing[2],
  },
  tideCardTitle: {
    marginLeft: spacing[2],
    flex: 1,
  },
  tideCardStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  tideCardStatusText: {
    marginLeft: spacing[1],
    textTransform: "capitalize",
  },
  tideCardDescription: {
    marginBottom: spacing[3],
  },
  tideCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tideCardMeta: {
    flex: 1,
  },
  tideCardStats: {
    alignItems: "flex-end",
  },
});
