import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text } from "../Text";
import { colors, spacing, typography } from "../../design-system/tokens";
import type { ChatMessage } from "../../types/chat";
import { getInterFont } from "../../utils/fonts";

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
        return colors.textColor;
      case "system":
        return colors.titleColor;
      default:
        return colors.titleColor;
    }
  };

  const formatToolResult = (result: any) => {
    if (typeof result === "string") return result;
    if (typeof result === "object") {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  const renderFormattedText = (text: string) => {
    // Clean the text first - remove "Assistant:" prefix and trim whitespace
    let cleanText = text
      .replace(/^Assistant:\s*/i, "") // Remove "Assistant:" at the start
      .replace(/^assistant:\s*/i, "") // Remove "assistant:" at the start
      .trim(); // Remove leading/trailing whitespace

    // Split text by **bold** patterns
    const parts = cleanText.split(/(\*\*.*?\*\*)/g);

    return (
      <Text variant="body" style={[{ color: getTextColor() }]}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            // Remove ** and render as bold (nested Text for inline styling)
            const boldText = part.slice(2, -2);
            return (
              <Text key={index} style={[styles.boldText, { color: getTextColor() }]}>
                {boldText}
              </Text>
            );
          }
          // Regular text - just return the string, no wrapper
          return part;
        })}
      </Text>
    );
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

        {/* {message.metadata?.agentResponse && (
          <Text variant="bodySmall" color="tertiary" style={styles.agentHeader}>
            Tides Agent
          </Text>
        )} */}

        {message.type === "tool_result" && message.metadata?.toolResult ? (
          <Text variant="body" style={[{ color: getTextColor() }]}>
            {formatToolResult(message.metadata.toolResult)}
          </Text>
        ) : (
          renderFormattedText(message.content)
        )}
        {message.type === "user" && (
          <Image
            source={require("../../../assets/graphics/chatstrike.png")}
            style={styles.chatStrike}
          />
        )}
        {message.metadata?.error && (
          <Text variant="bodySmall" color="error" style={styles.errorText}>
            ⚠️ Error occurred
          </Text>
        )}
      </View>
      {/* <Text variant="bodySmall" color="tertiary" style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString()}
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: spacing[3],
    alignItems: "flex-start",
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "100%",
  },
  chatStrike: {
    position: "absolute",
    right: -5,
    bottom: 0,
    zIndex: 1,
  },
  userBubble: {
    backgroundColor: colors.containerBorderSoft,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 7.5,
    borderRadius: 18,
    marginRight: 5,
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
    paddingRight: 10,
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
  boldText: {
    fontFamily: getInterFont("semiBold"),
    fontWeight: typography.fontWeight.semibold,
  },
});
