import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../Text";
import { colors, spacing } from "../../design-system/tokens";
import type { ChatMessage } from "../../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
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

const styles = StyleSheet.create({
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
});