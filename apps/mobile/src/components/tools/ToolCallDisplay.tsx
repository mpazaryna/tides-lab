import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { colors, spacing } from "../../design-system/tokens";
import type { MCPToolCall } from "../../types/chat";

interface ToolCallDisplayProps {
  toolCall: MCPToolCall;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
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

const styles = StyleSheet.create({
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
});