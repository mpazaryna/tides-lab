import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
} from "lucide-react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { Stack } from "../Stack";
import { colors, spacing, borderRadius } from "../../design-system/tokens";

type DateNavigatorProps = {
  currentDate: string; // ISO date string (YYYY-MM-DD)
  onDateChange: (date: string) => void;
  contextType?: "daily" | "weekly" | "monthly";
  showToday?: boolean;
  loading?: boolean;
};

export const DateNavigator: React.FC<DateNavigatorProps> = React.memo(
  ({
    currentDate,
    onDateChange,
    contextType = "daily",
    showToday = true,
    loading = false,
  }) => {
    const [selectedDate, setSelectedDate] = useState(
      () => new Date(currentDate)
    );

    // Helper functions for date calculations
    const getDateBoundaries = (date: Date, type: string) => {
      const d = new Date(date);

      switch (type) {
        case "daily":
          return {
            start: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
            end: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
            label: d.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          };

        case "weekly":
          const startOfWeek = new Date(d);
          startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

          return {
            start: startOfWeek,
            end: endOfWeek,
            label: `Week of ${startOfWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })} - ${endOfWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`,
          };

        case "monthly":
          const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
          const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

          return {
            start: startOfMonth,
            end: endOfMonth,
            label: d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            }),
          };

        default:
          return {
            start: d,
            end: d,
            label: d.toLocaleDateString(),
          };
      }
    };

    const navigateDate = useCallback(
      (direction: "prev" | "next") => {
        const newDate = new Date(selectedDate);

        switch (contextType) {
          case "daily":
            newDate.setDate(
              selectedDate.getDate() + (direction === "next" ? 1 : -1)
            );
            break;
          case "weekly":
            newDate.setDate(
              selectedDate.getDate() + (direction === "next" ? 7 : -7)
            );
            break;
          case "monthly":
            newDate.setMonth(
              selectedDate.getMonth() + (direction === "next" ? 1 : -1)
            );
            break;
        }

        setSelectedDate(newDate);
        onDateChange(newDate.toISOString().split("T")[0]);
      },
      [selectedDate, contextType, onDateChange]
    );

    const goToToday = useCallback(() => {
      const today = new Date();
      setSelectedDate(today);
      onDateChange(today.toISOString().split("T")[0]);
    }, [onDateChange]);

    const isToday = () => {
      const today = new Date();
      const { start, end } = getDateBoundaries(selectedDate, contextType);
      return today >= start && today <= end;
    };

    const boundaries = getDateBoundaries(selectedDate, contextType);

    const todayActive = isToday();

    return (
      <Card variant="outlined" style={styles.container}>
        <Stack>
          {/* Header with context type */}
          <View style={styles.header}>
            <View style={styles.contextBadge}>
              <Calendar size={14} color={colors.primary[600]} />
              <Text variant="caption" style={styles.contextText}>
                {contextType.charAt(0).toUpperCase() + contextType.slice(1)}{" "}
                View
              </Text>
            </View>
            {loading && (
              <RefreshCw
                size={16}
                color={colors.primary[500]}
                style={styles.loadingIcon}
              />
            )}
          </View>

          {/* Navigation controls */}
          <View style={styles.navigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateDate("prev")}
              disabled={loading}
            >
              <ChevronLeft size={20} color={colors.primary[500]} />
            </TouchableOpacity>

            <View style={styles.dateDisplay}>
              <Text variant="body" style={styles.dateLabel}>
                {boundaries.label}
              </Text>
              {contextType !== "daily" && (
                <Text variant="caption" style={styles.dateRange}>
                  {boundaries.start.toLocaleDateString()} -{" "}
                  {boundaries.end.toLocaleDateString()}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateDate("next")}
              disabled={loading}
            >
              <ChevronRight size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>

          {/* Today button and quick actions */}
          <View style={styles.actions}>
            {showToday && (
              <TouchableOpacity
                style={[
                  styles.todayButton,
                  todayActive && styles.todayButtonActive,
                ]}
                onPress={goToToday}
                disabled={todayActive || loading}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.todayText,
                    todayActive && styles.todayTextActive,
                  ]}
                >
                  {todayActive ? "Today" : "Go to Today"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Quick context indicators */}
            <View style={styles.quickStats}>
              {boundaries.start && boundaries.end && (
                <Text variant="caption" style={styles.durationText}>
                  {Math.ceil(
                    (boundaries.end.getTime() - boundaries.start.getTime()) /
                      (1000 * 60 * 60 * 24) +
                      1
                  )}{" "}
                  day
                  {Math.ceil(
                    (boundaries.end.getTime() - boundaries.start.getTime()) /
                      (1000 * 60 * 60 * 24) +
                      1
                  ) === 1
                    ? ""
                    : "s"}
                </Text>
              )}
            </View>
          </View>

          {/* Accessibility helpers */}
          <View style={styles.accessibilityHints}>
            <Text variant="caption" style={styles.hintText}>
              Swipe or use arrows to navigate {contextType} periods
            </Text>
          </View>
        </Stack>
      </Card>
    );
  }
);

DateNavigator.displayName = "DateNavigator";

const styles = StyleSheet.create({
  container: {
    margin: spacing[3],
    marginBottom: spacing[3],
    padding: spacing[3],
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contextBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: spacing[3],
  },
  contextText: {
    color: colors.primary[700],
    marginLeft: spacing[2],
    fontWeight: "600",
  },
  loadingIcon: {
    opacity: 0.7,
  },

  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  dateDisplay: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing[3],
  },
  dateLabel: {
    color: colors.neutral[900],
    fontWeight: "600",
    textAlign: "center",
  },
  dateRange: {
    color: colors.neutral[600],
    marginTop: spacing[2],
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[100],
    borderRadius: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  todayButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  todayText: {
    color: colors.neutral[700],
    fontWeight: "500",
  },
  todayTextActive: {
    color: colors.neutral[50],
  },
  quickStats: {
    alignItems: "flex-end",
  },
  durationText: {
    color: colors.neutral[500],
    fontSize: 11,
  },

  accessibilityHints: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing[3],
  },
  hintText: {
    color: colors.neutral[500],
    textAlign: "center",
    fontStyle: "italic",
  },
});
