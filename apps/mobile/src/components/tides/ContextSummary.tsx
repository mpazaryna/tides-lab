import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Clock,
  Zap,
  Target,
  TrendingUp,
  Play,
  Calendar,
  CalendarDays,
  Layers,
} from "lucide-react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { Stack } from "../Stack";
import { useMCP } from "../../context/MCPContext";
import { loggingService } from "../../services/loggingService";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../design-system/tokens";

type ContextType = "daily" | "weekly" | "monthly" | "project";

interface ContextSummaryData {
  context: string;
  tide_id?: string;
  tide_name?: string;
  flow_count: number;
  total_minutes: number;
  available: boolean;
}

interface ContextSummaryProps {
  contextType: ContextType;
  date?: string;
  onStartFlow?: () => void;
  showActions?: boolean;
}

export const ContextSummary: React.FC<ContextSummaryProps> = React.memo(
  ({ contextType, date, onStartFlow, showActions = true }) => {
    const { listTideContexts, getTodaysSummary } = useMCP();
    const [contextData, setContextData] = useState<ContextSummaryData[]>([]);
    const [summaryData, setSummaryData] = useState<{
      total_flow_sessions?: number;
      total_minutes?: number;
    }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getContextIcon = (type: ContextType) => {
      switch (type) {
        case "daily":
          return Clock;
        case "weekly":
          return Calendar;
        case "monthly":
          return CalendarDays;
        case "project":
          return Target;
        default:
          return Layers;
      }
    };

    const getContextColor = (type: ContextType) => {
      switch (type) {
        case "daily":
          return colors.primary[500];
        case "weekly":
          return colors.secondary[500];
        case "monthly":
          return colors.info;
        case "project":
          return colors.warning;
        default:
          return colors.neutral[500];
      }
    };

    const fetchContextData = useCallback(async () => {
      if (!date) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch context list and today's summary in parallel
        const [contextsResult, summaryResult] = await Promise.all([
          listTideContexts(date),
          getTodaysSummary(date),
        ]);

        if (contextsResult.success && contextsResult.contexts) {
          setContextData(contextsResult.contexts);
        }

        if (summaryResult.success) {
          setSummaryData({
            total_flow_sessions: summaryResult.total_flow_sessions,
            total_minutes: summaryResult.total_minutes,
          });
        }

        loggingService.info("ContextSummary", "Context data fetched", {
          contextType,
          date,
          contextCount: contextsResult.contexts?.length || 0,
          totalSessions: summaryResult.total_flow_sessions,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        loggingService.error("ContextSummary", "Failed to fetch context data", {
          error: err,
          contextType,
          date,
        });
      } finally {
        setLoading(false);
      }
    }, [listTideContexts, getTodaysSummary, date, contextType]);

    useEffect(() => {
      fetchContextData();
    }, [fetchContextData]);

    const getCurrentContextData = () => {
      return contextData.find((ctx) => ctx.context === contextType);
    };

    const formatMinutes = (minutes: number) => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    };

    const ContextIcon = getContextIcon(contextType);
    const contextColor = getContextColor(contextType);
    const currentContext = getCurrentContextData();

    if (loading) {
      return (
        <Card variant="outlined" style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text variant="body" style={styles.loadingText}>
              Loading context summary...
            </Text>
          </View>
        </Card>
      );
    }

    if (error) {
      return (
        <Card variant="outlined" style={styles.container}>
          <View style={styles.errorContainer}>
            <Text variant="body" color="error" style={styles.errorText}>
              Failed to load context summary
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchContextData}
            >
              <Text variant="caption" color="primary">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      );
    }

    return (
      <Card variant="elevated" style={styles.container}>
        <Stack>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View
                style={[styles.contextIcon, { backgroundColor: contextColor + "20" }]}
              >
                <ContextIcon size={20} color={contextColor} />
              </View>
              <Text variant="h4" style={styles.title}>
                {contextType.charAt(0).toUpperCase() + contextType.slice(1)} Summary
              </Text>
            </View>
            <Text variant="caption" style={styles.dateText}>
              {new Date(date || new Date()).toLocaleDateString()}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Current Context Stats */}
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={16} color={colors.primary[500]} />
              </View>
              <Text variant="h3" style={styles.statValue}>
                {currentContext?.flow_count || 0}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Flow Sessions
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Clock size={16} color={colors.secondary[500]} />
              </View>
              <Text variant="h3" style={styles.statValue}>
                {currentContext ? formatMinutes(currentContext.total_minutes) : "0m"}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Focus Time
              </Text>
            </View>

            {/* Total Daily Stats */}
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={16} color={colors.success} />
              </View>
              <Text variant="h3" style={styles.statValue}>
                {summaryData.total_flow_sessions || 0}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Total Sessions
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Zap size={16} color={colors.warning} />
              </View>
              <Text variant="h3" style={styles.statValue}>
                {summaryData.total_minutes ? formatMinutes(summaryData.total_minutes) : "0m"}
              </Text>
              <Text variant="caption" style={styles.statLabel}>
                Total Time
              </Text>
            </View>
          </View>

          {/* Context Status */}
          <View style={styles.statusSection}>
            <Text variant="body" style={styles.statusTitle}>
              Context Status
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: currentContext?.available
                      ? colors.success
                      : colors.neutral[300],
                  },
                ]}
              />
              <Text variant="caption" style={styles.statusText}>
                {currentContext?.available
                  ? `${contextType} tide available`
                  : `No ${contextType} tide created`}
              </Text>
              {currentContext?.tide_name && (
                <Text variant="caption" style={styles.tideName}>
                  • {currentContext.tide_name}
                </Text>
              )}
            </View>
          </View>

          {/* Action Button */}
          {showActions && onStartFlow && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: contextColor }]}
              onPress={onStartFlow}
            >
              <Play size={16} color={colors.neutral[50]} />
              <Text variant="body" style={styles.actionButtonText}>
                Start Hierarchical Flow
              </Text>
            </TouchableOpacity>
          )}

          {/* Context Breakdown */}
          {contextData.length > 1 && (
            <View style={styles.breakdownSection}>
              <Text variant="body" style={styles.breakdownTitle}>
                All Contexts Today
              </Text>
              {contextData.map((ctx) => (
                <View key={ctx.context} style={styles.breakdownRow}>
                  <View style={styles.breakdownContext}>
                    <View
                      style={[
                        styles.breakdownDot,
                        { backgroundColor: getContextColor(ctx.context as ContextType) },
                      ]}
                    />
                    <Text variant="caption" style={styles.breakdownLabel}>
                      {ctx.context}
                    </Text>
                  </View>
                  <Text variant="caption" style={styles.breakdownValue}>
                    {ctx.flow_count} sessions • {formatMinutes(ctx.total_minutes)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Stack>
      </Card>
    );
  }
);

ContextSummary.displayName = "ContextSummary";

const styles = StyleSheet.create({
  container: {
    margin: spacing[4],
    padding: spacing[4],
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
  },
  loadingText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: spacing[6],
  },
  errorText: {
    marginBottom: spacing[3],
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  contextIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  title: {
    color: colors.neutral[900],
    fontWeight: typography.fontWeight.semibold,
  },
  dateText: {
    color: colors.neutral[500],
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing[2],
    marginBottom: spacing[4],
  },
  statCard: {
    width: "50%",
    paddingHorizontal: spacing[2],
    marginBottom: spacing[3],
    alignItems: "center",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  statValue: {
    color: colors.neutral[900],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    color: colors.neutral[600],
    textAlign: "center",
  },

  statusSection: {
    marginBottom: spacing[4],
  },
  statusTitle: {
    color: colors.neutral[800],
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[2],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  statusText: {
    color: colors.neutral[600],
    flex: 1,
  },
  tideName: {
    color: colors.neutral[500],
    fontStyle: "italic",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderRadius: spacing[4],
    marginBottom: spacing[4],
  },
  actionButtonText: {
    color: colors.neutral[50],
    marginLeft: spacing[2],
    fontWeight: typography.fontWeight.medium,
  },

  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing[4],
  },
  breakdownTitle: {
    color: colors.neutral[800],
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[3],
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  breakdownContext: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing[2],
  },
  breakdownLabel: {
    color: colors.neutral[700],
    textTransform: "capitalize",
  },
  breakdownValue: {
    color: colors.neutral[500],
  },
});