import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, RefreshControl } from "react-native";
import { Text } from "../../components/Text";
import { SafeArea } from "../../components/SafeArea";
import { Container } from "../../components/Container";
import { ContextSwitcher } from "../../components/tides/ContextSwitcher";
import { ContextSummary } from "../../components/tides/ContextSummary";
import { HierarchicalTidesList } from "../../components/tides/HierarchicalTidesList";
import { DateNavigator } from "../../components/tides/DateNavigator";
import { useMCP } from "../../context/MCPContext";
import { useTidesManagement } from "../../hooks/useTidesManagement";
import { colors, spacing } from "../../design-system/tokens";
import { loggingService } from "../../services/loggingService";
import type { MainStackScreenProps } from "../../navigation/types";

type TidesListProps = MainStackScreenProps<"TidesList">;

export default function TidesList({ navigation }: TidesListProps) {
  const { isConnected } = useMCP();
  const { activeTides, refreshTides } = useTidesManagement(isConnected);
  const [refreshing, setRefreshing] = useState(false);

  // Local context state - no MCP calls needed
  const [currentContext, setCurrentContext] = useState<
    "daily" | "weekly" | "monthly" | "project"
  >("daily");
  const [currentDate, setCurrentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshTides();
    } catch (error) {
      loggingService.error("TidesList", "Failed to refresh data", { error });
    } finally {
      setRefreshing(false);
    }
  }, [refreshTides]);

  const handleTideSelect = useCallback(
    (tide: any) => {
      loggingService.info("TidesList", "Tide selected", {
        tideId: tide.id,
        tideName: tide.name,
      });
      navigation.navigate("TideDetails", { tideId: tide.id });
    },
    [navigation]
  );

  const handleContextChange = useCallback(
    (newContext: "daily" | "weekly" | "monthly" | "project") => {
      setCurrentContext(newContext);
      loggingService.info("TidesList", "Context switched locally", {
        from: currentContext,
        to: newContext,
      });
    },
    [currentContext]
  );

  const handleDateChange = useCallback(
    (newDate: string) => {
      setCurrentDate(newDate);
    },
    [setCurrentDate]
  );

  return (
    <SafeArea>
      <Container style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" style={styles.title}>
            Your Tides
          </Text>
          <Text variant="body" color="secondary">
            Hierarchical workflow management
          </Text>
        </View>

        {/* Context Switcher */}
        <View style={styles.contextSection}>
          <ContextSwitcher
            currentContext={currentContext}
            onContextChange={handleContextChange}
            compact={true}
          />
        </View>

        {/* Date Navigator */}
        <View style={styles.dateSection}>
          <DateNavigator
            currentDate={currentDate}
            contextType={currentContext === "project" ? "daily" : currentContext}
            onDateChange={handleDateChange}
          />
        </View>

        {/* Context Summary */}
        <View style={styles.summarySection}>
          <ContextSummary
            contextType={currentContext}
            date={currentDate}
          />
        </View>

        {/* Hierarchical Tides List */}
        <View style={styles.tidesSection}>
          <HierarchicalTidesList
            tides={activeTides}
            onTideSelect={handleTideSelect}
            showDateRanges={true}
          />
        </View>
      </Container>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  contextSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  dateSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  summarySection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  tidesSection: {
    flex: 1,
    paddingHorizontal: 0, // HierarchicalTidesList has its own margin
  },
});