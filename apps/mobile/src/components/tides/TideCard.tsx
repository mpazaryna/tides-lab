import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import {
  Clock,
  Waves,
  Target,
  PauseCircle,
  CheckCircle,
} from "lucide-react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { colors, spacing } from "../../design-system/tokens";
import type { Tide } from "../../types";

interface TideCardProps {
  tide: Tide;
  onPress?: () => void;
}

export const TideCard: React.FC<TideCardProps> = ({ tide, onPress }) => {
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

const styles = StyleSheet.create({
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