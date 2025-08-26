import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import {
  Clock,
  Waves,
  Target,
  PauseCircle,
  CheckCircle,
  Calendar,
  CalendarDays,
  Layers,
} from "lucide-react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { colors, spacing, borderRadius } from "../../design-system/tokens";
import type { Tide } from "../../types";

interface TideCardProps {
  tide: Tide;
  onPress?: () => void;
  showHierarchy?: boolean;
  compact?: boolean;
}

export const TideCard: React.FC<TideCardProps> = ({
  tide,
  onPress,
  showHierarchy = false,
}) => {
  const getFlowTypeIcon = (flowType: string) => {
    switch (flowType) {
      case "daily":
        return Clock;
      case "weekly":
        return Calendar;
      case "monthly":
        return CalendarDays;
      case "project":
        return Target;
      case "seasonal":
        return Layers;
      default:
        return Waves;
    }
  };

  const getHierarchyInfo = () => {
    if (!showHierarchy) return null;

    const info: string[] = [];

    if (tide.auto_created) {
      info.push("Auto-created");
    }

    if (tide.parent_tide_id) {
      info.push("Child tide");
    }

    if (tide.children && tide.children.length > 0) {
      info.push(
        `${tide.children.length} child${
          tide.children.length === 1 ? "" : "ren"
        }`
      );
    }

    if (tide.date_start && tide.date_end) {
      const start = new Date(tide.date_start);
      const end = new Date(tide.date_end);
      if (start.toDateString() === end.toDateString()) {
        info.push(start.toLocaleDateString());
      } else {
        info.push(
          `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
        );
      }
    } else if (tide.date_start) {
      info.push(new Date(tide.date_start).toLocaleDateString());
    }

    return info.length > 0 ? info.join(" • ") : null;
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

  const formatDateRange = () => {
    if (tide.date_start && tide.date_end) {
      const start = new Date(tide.date_start);
      const end = new Date(tide.date_end);
      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString();
      } else {
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
    } else if (tide.date_start) {
      return new Date(tide.date_start).toLocaleDateString();
    }
    return null;
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

        {showHierarchy && getHierarchyInfo() && (
          <View style={styles.hierarchyInfo}>
            <Text variant="caption" style={styles.hierarchyText}>
              {getHierarchyInfo()}
            </Text>
          </View>
        )}

        <View style={styles.tideCardFooter}>
          <View style={styles.tideCardMeta}>
            <Text variant="caption" color="tertiary">
              {tide.flow_type}
              {formatDateRange() && ` • ${formatDateRange()}`}
              {!formatDateRange() &&
                ` • Created ${formatDate(tide.created_at)}`}
              {tide.auto_created && " • Auto"}
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
  hierarchyInfo: {
    marginBottom: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[300],
  },
  hierarchyText: {
    color: colors.primary[700],
    fontSize: 11,
    fontWeight: "500",
  },
});
