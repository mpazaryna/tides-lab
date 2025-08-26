import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LoggingService } from "../../services/LoggingService";
import { NotificationService } from "../../services/NotificationService";
import { useMCP } from "../../context/MCPContext";
import { useChat } from "../../context/ChatContext";
import { agentService } from "../../services/agentService";
import {
  Button,
  Card,
  colors,
  spacing,
  Text,
  Stack,
} from "../../design-system";
import type {
  ChatMessage,
  MCPToolCall,
  AvailableMCPTool,
} from "../../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
}) => {
  const getBubbleStyle = () => {
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

interface ToolCallDisplayProps {
  toolCall: MCPToolCall;
}

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

interface QuickToolsProps {
  tools: AvailableMCPTool[];
  onToolSelect: (toolName: string) => void;
  isLoading: boolean;
}

const QuickTools: React.FC<QuickToolsProps> = ({
  tools,
  onToolSelect,
  isLoading,
}) => {
  const popularTools = tools.slice(0, 4); // Show first 4 tools as quick access

  return (
    <View style={styles.quickToolsContainer}>
      <Text
        variant="bodySmall"
        color="secondary"
        style={styles.quickToolsTitle}
      >
        Quick Tools:
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.quickToolsList}>
          {popularTools.map((tool) => (
            <TouchableOpacity
              key={tool.name}
              style={styles.quickToolButton}
              onPress={() => onToolSelect(tool.name)}
              disabled={isLoading}
            >
              <Text variant="bodySmall" color="primary" weight="medium">
                {tool.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default function Chat() {
  const { getCurrentServerUrl } = useMCP();
  const {
    messages,
    isLoading,
    error,
    agentStatus,
    connectionStatus,
    pendingToolCalls,
    sendMessage,
    sendToolMessage,
    executeMCPTool,
    getAvailableTools,
    sendAgentMessage,
    clearMessages,
    checkConnections,
  } = useChat();

  const [inputMessage, setInputMessage] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AvailableMCPTool | null>(
    null
  );
  const [toolParameters, setToolParameters] = useState<Record<string, string>>(
    {}
  );
  const [agentInitialized, setAgentInitialized] = useState(false);

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
        // Regular message
        await sendMessage(message);
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
  }, [inputMessage, sendMessage, sendAgentMessage, executeMCPTool]);

  const handleToolSelect = useCallback(
    (toolName: string) => {
      const tool = getAvailableTools().find((t) => t.name === toolName);
      if (tool) {
        setSelectedTool(tool);
        setShowTools(true);

        // Initialize parameters with empty values
        const params: Record<string, string> = {};
        tool.parameters.forEach((param) => {
          params[param.name] = "";
        });
        setToolParameters(params);
      }
    },
    [getAvailableTools]
  );

  const handleExecuteTool = useCallback(async () => {
    if (!selectedTool) return;

    // Validate required parameters
    const missingRequired = selectedTool.parameters
      .filter((param) => param.required && !toolParameters[param.name]?.trim())
      .map((param) => param.name);

    if (missingRequired.length > 0) {
      Alert.alert(
        "Missing Parameters",
        `Please provide values for: ${missingRequired.join(", ")}`
      );
      return;
    }

    // Convert parameters to appropriate types
    const processedParams: Record<string, any> = {};
    selectedTool.parameters.forEach((param) => {
      const value = toolParameters[param.name];
      if (value) {
        processedParams[param.name] =
          param.type === "number" ? Number(value) : value;
      }
    });

    try {
      await sendToolMessage(selectedTool.name, processedParams);
      setShowTools(false);
      setSelectedTool(null);
      setToolParameters({});

      LoggingService.info(
        "Chat",
        "Tool executed via UI",
        { toolName: selectedTool.name, parameters: processedParams },
        "CHAT_UI_005"
      );
    } catch (toolError) {
      LoggingService.error(
        "Chat",
        "Failed to execute tool via UI",
        { error: toolError, toolName: selectedTool.name },
        "CHAT_UI_006"
      );
      NotificationService.error("Failed to execute tool", "Error");
    }
  }, [selectedTool, toolParameters, sendToolMessage]);

  const handleAgentInsights = useCallback(async () => {
    if (!agentInitialized) {
      NotificationService.error("Agent service not initialized", "Error");
      return;
    }

    try {
      const insights = await agentService.getInsights();
      // The agent message will be handled by the context
      LoggingService.info(
        "Chat",
        "Agent insights requested",
        { messageId: insights.id },
        "CHAT_UI_007"
      );
    } catch (insightError) {
      LoggingService.error(
        "Chat",
        "Failed to get agent insights",
        { error: insightError },
        "CHAT_UI_008"
      );
      NotificationService.error("Failed to get insights from agent", "Error");
    }
  }, [agentInitialized]);

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

  const availableTools = getAvailableTools();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3" weight="medium">
            Chat Assistant
          </Text>
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.statusDot,
                connectionStatus.mcp
                  ? styles.connectedDot
                  : styles.disconnectedDot,
              ]}
            />
            <Text variant="bodySmall" color="secondary">
              MCP: {connectionStatus.mcp ? "Connected" : "Disconnected"}
            </Text>
            <View
              style={[
                styles.statusDot,
                agentInitialized ? styles.connectedDot : styles.disconnectedDot,
              ]}
            />
            <Text variant="bodySmall" color="secondary">
              Agent: {agentInitialized ? "Ready" : "Initializing"}
            </Text>
          </View>
        </View>

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

        {/* Agent Status */}
        {agentStatus !== "idle" && (
          <Card variant="outlined" padding={2} style={styles.agentStatusCard}>
            <Text variant="bodySmall" color="secondary">
              Agent is {agentStatus}...
            </Text>
          </Card>
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

          {/* Pending Tool Calls */}
          {pendingToolCalls.map((toolCall) => (
            <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
          ))}
        </ScrollView>

        {/* Quick Tools */}
        {!showTools && availableTools.length > 0 && (
          <QuickTools
            tools={availableTools}
            onToolSelect={handleToolSelect}
            isLoading={isLoading}
          />
        )}

        {/* Tool Parameter Input */}
        {showTools && selectedTool && (
          <Card variant="outlined" padding={4} style={styles.toolInputCard}>
            <Text variant="body" weight="medium" style={styles.toolInputTitle}>
              Execute {selectedTool.name}
            </Text>
            <Text
              variant="bodySmall"
              color="secondary"
              style={styles.toolDescription}
            >
              {selectedTool.description}
            </Text>

            {selectedTool.parameters.map((param) => (
              <View key={param.name} style={styles.parameterInput}>
                <Text variant="bodySmall" weight="medium">
                  {param.name} {param.required && "*"}
                </Text>
                <Text variant="bodySmall" color="tertiary">
                  {param.description}
                </Text>
                <TextInput
                  style={styles.parameterTextInput}
                  placeholder={`Enter ${param.name}`}
                  placeholderTextColor={colors.text.tertiary}
                  value={toolParameters[param.name] || ""}
                  onChangeText={(text) =>
                    setToolParameters((prev) => ({
                      ...prev,
                      [param.name]: text,
                    }))
                  }
                />
              </View>
            ))}

            <View style={styles.toolInputActions}>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  setShowTools(false);
                  setSelectedTool(null);
                  setToolParameters({});
                }}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={handleExecuteTool}
                loading={isLoading}
                style={styles.executeButton}
              >
                Execute
              </Button>
            </View>
          </Card>
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.messageInput}
              placeholder="Type a message or command..."
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
              <Text variant="bodySmall" color="white" weight="medium">
                Send
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setShowTools(!showTools)}
              disabled={isLoading}
            >
              <Text variant="bodySmall" color="primary">
                🔧 Tools
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleAgentInsights}
              disabled={!agentInitialized || isLoading}
            >
              <Text variant="bodySmall" color="primary">
                💡 Insights
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                Alert.alert(
                  "Clear Messages",
                  "Are you sure you want to clear all messages?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: clearMessages,
                    },
                  ]
                );
              }}
            >
              <Text variant="bodySmall" color="secondary">
                🗑 Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardContainer: {
    flex: 1,
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
    padding: spacing[4],
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
    maxWidth: "80%",
    padding: spacing[3],
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.neutral[100],
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
  toolName: {
    marginBottom: spacing[1],
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
    borderTopWidth: 1,
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
  inputContainer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.background.secondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[3],
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  sendButtonDisabled: {
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
});
