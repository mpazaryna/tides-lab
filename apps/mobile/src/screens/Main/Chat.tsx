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
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from '@react-navigation/native';
import { ArrowUp, Settings as SettingsIcon } from "lucide-react-native";

import { LoggingService } from "../../services/LoggingService";
import { NotificationService } from "../../services/NotificationService";
import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { useServerEnvironment } from "../../context/ServerEnvironmentContext";
import { agentService } from "../../services/agentService";
import { Card, colors, spacing, Text, Stack } from "../../design-system";
import { ShortcutBar, type Shortcut } from "../../components/chat";
import { TestingPanel } from "../../components/debug";
import ConnectionMonitor from "../../components/agents/ConnectionMonitor";
import type { ChatMessage, MCPToolCall } from "../../types/chat";
import { MainStackParamList } from "../../navigation/types";

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
        return "white";
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

        <Text variant="bodySmall" color="tertiary" style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
};

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = "Agent is thinking..."
}) => (
  <Card variant="outlined" padding={3} style={styles.loadingCard}>
    <View style={styles.loadingContent}>
      <View style={styles.loadingDots}>
        <View style={[styles.loadingDot, styles.loadingDot1]} />
        <View style={[styles.loadingDot, styles.loadingDot2]} />
        <View style={[styles.loadingDot, styles.loadingDot3]} />
      </View>
      <Text variant="bodySmall" color="secondary" style={styles.loadingText}>
        {message}
      </Text>
    </View>
  </Card>
);

interface ToolCallIndicatorProps {
  toolCall: MCPToolCall;
}

const ToolCallIndicator: React.FC<ToolCallIndicatorProps> = ({ toolCall }) => {
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
        return "✅";
      case "failed":
        return "❌";
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

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => (
  <Card variant="outlined" padding={3} style={styles.errorCard}>
    <Text variant="body" color="error" weight="medium">
      Connection Error
    </Text>
    <Text variant="bodySmall" color="error" style={styles.errorText}>
      {error}
    </Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text variant="bodySmall" color="primary">
          Retry Connection
        </Text>
      </TouchableOpacity>
    )}
  </Card>
);

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;

export default function Chat() {
  const route = useRoute<ChatScreenRouteProp>();
  const { tideId, tideName } = route.params || {};
  
  const { getCurrentServerUrl } = useMCP();
  const {
    messages,
    isLoading,
    error,
    agentStatus,
    pendingToolCalls,
    connectionStatus,
    sendMessage,
    executeMCPTool,
    sendAgentMessage,
    checkConnections,
  } = useChat();

  const [inputMessage, setInputMessage] = useState("");
  const [agentInitialized, setAgentInitialized] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showConnectionMonitor, setShowConnectionMonitor] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    {
      id: 'agent_insights',
      label: 'Get Insights',
      type: 'agent_command',
      command: 'get insights for my recent tides',
      category: 'agent',
      description: 'Ask the agent for productivity insights'
    },
    {
      id: 'mcp_list_tides',
      label: 'List Tides',
      type: 'mcp_direct',
      command: 'tide_list',
      category: 'tide',
      description: 'Show all your tides'
    },
    {
      id: 'mcp_create_tide',
      label: 'Create Tide',
      type: 'mcp_direct',
      command: 'tide_create',
      category: 'tide',
      params: { name: 'New Tide', description: 'Quick tide', flowType: 'daily' },
      description: 'Create a new tide workflow'
    },
    {
      id: 'agent_analyze',
      label: 'Analyze',
      type: 'agent_command', 
      command: 'analyze my current tide patterns',
      category: 'agent',
      description: 'Get analysis of your tide patterns'
    },
    {
      id: 'mcp_get_report',
      label: 'Get Report',
      type: 'mcp_direct',
      command: 'tide_get_report',
      category: 'analytics',
      description: 'Generate tide analytics report'
    }
  ]);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Initialize agent service when component mounts
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const serverUrl = getCurrentServerUrl();
        await agentService.initialize(serverUrl);
        setAgentInitialized(true);

        LoggingService.info(
          "Chat",
          "Agent service initialized",
          { serverUrl },
          "CHAT_UI_001"
        );
      } catch (initError) {
        LoggingService.error(
          "Chat",
          "Failed to initialize agent service",
          { error: initError },
          "CHAT_UI_002"
        );
        NotificationService.error(
          "Failed to initialize agent service",
          "Error"
        );
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

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");

    // Check for debug commands
    if (message === "/debug") {
      setShowDebugPanel(!showDebugPanel);
      return;
    } else if (message === "/monitor") {
      setShowConnectionMonitor(!showConnectionMonitor);
      return;
    }

    LoggingService.info(
      "Chat",
      "Sending user message",
      { messageLength: message.length },
      "CHAT_UI_003"
    );

    try {
      // Check if message starts with agent commands
      if (message.startsWith("/agent ")) {
        const agentQuery = message.substring(7);
        await sendAgentMessage(agentQuery);
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

        await executeMCPTool(toolName, parameters);
      } else {
        // Send to agent by default for intelligent routing
        await sendAgentMessage(message, tideId ? { tideId } : undefined);
      }
    } catch (sendError) {
      LoggingService.error(
        "Chat",
        "Failed to send message",
        { error: sendError, message: message.substring(0, 50) },
        "CHAT_UI_004"
      );
      NotificationService.error("Failed to send message", "Error");
    }
  }, [inputMessage, sendAgentMessage, executeMCPTool, showDebugPanel, showConnectionMonitor, tideId]);

  const handleShortcutPress = useCallback(async (shortcut: Shortcut) => {
    try {
      if (shortcut.type === 'agent_command') {
        await sendAgentMessage(shortcut.command, tideId ? { tideId } : undefined);
      } else {
        // For MCP direct calls, include tideId in params if available
        const params = { ...shortcut.params };
        if (tideId && !params.tideId) {
          params.tideId = tideId;
        }
        await executeMCPTool(shortcut.command, params);
      }
      
      LoggingService.info(
        'Chat',
        'Shortcut executed',
        { shortcutId: shortcut.id, type: shortcut.type },
        'CHAT_SHORTCUT_001'
      );
    } catch (error) {
      LoggingService.error(
        'Chat',
        'Failed to execute shortcut',
        { error, shortcutId: shortcut.id },
        'CHAT_SHORTCUT_002'
      );
      NotificationService.error('Failed to execute shortcut', 'Error');
    }
  }, [sendAgentMessage, executeMCPTool, tideId]);

  const handleConfigurationChange = useCallback((newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    
    LoggingService.info(
      'Chat',
      'Shortcuts configuration updated',
      { shortcutCount: newShortcuts.length },
      'CHAT_CONFIG_001'
    );
  }, []);

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

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Connection Status Bar */}
      <View style={styles.statusBar}>
        <TouchableOpacity
          onPress={() => setShowConnectionMonitor(!showConnectionMonitor)}
          style={styles.connectionButton}
        >
          <View style={[
            styles.connectionDot,
            (connectionStatus.agent && connectionStatus.mcp) ? styles.connectedDot : styles.disconnectedDot
          ]} />
          <Text variant="bodySmall" color="secondary">
            {(connectionStatus.agent && connectionStatus.mcp) ? 'Connected' : 'Disconnected'}
          </Text>
        </TouchableOpacity>
        
        {/* Debug Panel Toggle */}
        <TouchableOpacity
          onPress={() => setShowDebugPanel(!showDebugPanel)}
          style={styles.debugButton}
        >
          <SettingsIcon size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Connection Monitor */}
      {showConnectionMonitor && (
        <View style={styles.connectionMonitorContainer}>
          <ConnectionMonitor
            detailed={true}
            showActions={true}
            onConnectionChange={(isConnected) => {
              LoggingService.info(
                'Chat',
                'Connection status changed',
                { isConnected },
                'CHAT_CONNECTION_001'
              );
            }}
          />
        </View>
      )}

      {/* Debug Panel */}
      {showDebugPanel && (
        <View style={styles.debugPanelContainer}>
          <TestingPanel 
            expandedByDefault={false}
            onTestResultsChange={(results) => {
              LoggingService.info(
                'Chat',
                'Debug test results updated',
                { resultCount: results.length },
                'CHAT_DEBUG_001'
              );
            }}
          />
        </View>
      )}

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          error={error} 
          onRetry={checkConnections}
        />
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="h4" color="secondary" align="center">
              {tideId ? `Chat about ${tideName || 'this tide'}` : 'Welcome to Agent Chat!'}
            </Text>
            <Text
              variant="body"
              color="tertiary"
              align="center"
              style={styles.emptyStateDescription}
            >
              {tideId 
                ? `Ask the agent about this tide, get insights, or execute actions.`
                : `Ask questions, execute tools, or get insights from the Tides Agent.`
              }
            </Text>
            <Stack spacing={2} style={styles.helpCommands}>
              <Text variant="bodySmall" color="secondary">
                Commands you can try:
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • Type a question naturally
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /agent [question] - Ask the agent directly
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /tool [toolName] param=value - Execute a tool
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /debug - Toggle debug panel
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • /monitor - Toggle connection monitor
              </Text>
              <Text variant="bodySmall" color="tertiary">
                • Use shortcuts below for quick access
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

        {/* Loading Indicator */}
        {isLoading && <LoadingIndicator message={`Agent is ${agentStatus}...`} />}

        {/* Pending Tool Calls */}
        {pendingToolCalls.map((toolCall) => (
          <ToolCallIndicator key={toolCall.id} toolCall={toolCall} />
        ))}
      </ScrollView>

      {/* Shortcuts */}
      <ShortcutBar
        shortcuts={shortcuts}
        onShortcutPress={handleShortcutPress}
        showConfiguration={true}
        onConfigurationChange={handleConfigurationChange}
        maxVisible={6}
        showCategories={false}
      />

      {/* Message Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.messageInput}
            placeholder="Ask anything..."
            placeholderTextColor={colors.text.tertiary}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            multiline
            maxLength={1000}
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
    </KeyboardAvoidingView>
  );
}

// ======================== Styles ========================

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.background.secondary,
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  connectedDot: {
    backgroundColor: colors.success,
  },
  disconnectedDot: {
    backgroundColor: colors.error,
  },
  debugButton: {
    padding: spacing[2],
  },
  connectionMonitorContainer: {
    maxHeight: 300,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  debugPanelContainer: {
    maxHeight: 400,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  messagesContainer: {
    flex: 1,
    padding: spacing[4],
  },
  messagesContent: {
    paddingBottom: spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  emptyStateDescription: {
    marginTop: spacing[3],
    marginBottom: spacing[6],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  helpCommands: {
    alignItems: 'center',
  },
  messageContainer: {
    marginVertical: spacing[2],
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing[3],
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderBottomLeftRadius: 4,
  },
  agentBubble: {
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderBottomLeftRadius: 4,
  },
  toolBubble: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success + '40',
    borderWidth: 1,
  },
  systemBubble: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    borderWidth: 1,
  },
  toolName: {
    marginBottom: spacing[1],
    fontWeight: '500',
  },
  agentHeader: {
    marginBottom: spacing[1],
    fontWeight: '500',
  },
  errorText: {
    marginTop: spacing[1],
  },
  timestamp: {
    marginTop: spacing[1],
    fontSize: 11,
  },
  loadingCard: {
    marginVertical: spacing[2],
    backgroundColor: colors.neutral[50],
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginRight: spacing[3],
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginHorizontal: 2,
  },
  loadingDot1: {
    // Animation would be added here
  },
  loadingDot2: {
    // Animation would be added here
  },
  loadingDot3: {
    // Animation would be added here
  },
  loadingText: {
    fontStyle: 'italic',
  },
  toolCallCard: {
    marginVertical: spacing[2],
    borderLeftWidth: 4,
  },
  toolCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  toolCallParams: {
    marginTop: spacing[2],
  },
  toolCallError: {
    marginTop: spacing[2],
    backgroundColor: colors.error + '10',
    padding: spacing[2],
    borderRadius: 4,
  },
  errorCard: {
    margin: spacing[4],
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  retryButton: {
    marginTop: spacing[2],
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.background.secondary,
    padding: spacing[4],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 20,
    overflow: 'hidden',
  },
  messageInput: {
    flex: 1,
    paddingLeft: spacing[4],
    paddingRight: 56,
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.background.secondary,
    margin: 0,
    borderRadius: 1000,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 6,
  },
  sendButtonColor: {
    backgroundColor: colors.primary[500],
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: 32,
    height: 32,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonColorDisabled: {
    backgroundColor: colors.neutral[400],
  },
});