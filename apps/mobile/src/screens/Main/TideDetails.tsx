import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { ChevronLeft, Activity, Clock, Zap } from "lucide-react-native";

import { MainStackParamList, TideDetailsScreenProps } from "../../navigation/types";
import { useMCP } from "../../context/MCPContext";
import { Text } from "../../components/Text";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { SafeArea } from "../../components/SafeArea";
import { Loading } from "../../components/Loading";
import { colors, spacing } from "../../design-system/tokens";
import { loggingService } from "../../services/loggingService";
import type { Tide, TideReport } from "../../types/models";

type TideDetailsRouteProp = RouteProp<MainStackParamList, "TideDetails">;

export default function TideDetails() {
  const route = useRoute<TideDetailsRouteProp>();
  const navigation = useNavigation<TideDetailsScreenProps["navigation"]>();
  const { tideId } = route.params;
  
  const { isConnected, tides, getTideReport } = useMCP();
  const [tide, setTide] = useState<Tide | null>(null);
  const [report, setReport] = useState<TideReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTideDetails();
  }, [tideId]);

  const loadTideDetails = async () => {
    if (!isConnected) {
      setError("Not connected to MCP server");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find tide from tides
      const foundTide = tides.find((t: Tide) => t.id === tideId);
      if (!foundTide) {
        throw new Error("Tide not found");
      }

      setTide(foundTide);

      // Get tide report for additional details
      const reportResult = await getTideReport(tideId);
      
      if (reportResult.success && reportResult.report) {
        setReport(reportResult.report);
      }

      loggingService.info("TideDetails", "Loaded tide details", { 
        tideId, 
        tideName: foundTide.name 
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load tide details";
      setError(errorMessage);
      loggingService.error("TideDetails", "Failed to load tide details", { 
        tideId, 
        error: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartFlow = () => {
    if (!tide) return;
    
    loggingService.info("TideDetails", "Starting flow session", { 
      tideId: tide.id 
    });
    
    navigation.navigate("FlowSession", { 
      tideId: tide.id 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return colors.success;
      case "completed": return colors.primary[500];
      case "paused": return colors.warning;
      default: return colors.neutral[500];
    }
  };

  if (loading) {
    return (
      <SafeArea>
        <View style={styles.container}>
          <Loading message="Loading tide details..." />
        </View>
      </SafeArea>
    );
  }

  if (error || !tide) {
    return (
      <SafeArea>
        <View style={styles.container}>
          <Card variant="outlined" padding={4}>
            <Text variant="h3" color="error" align="center">
              {error || "Tide not found"}
            </Text>
            <Button
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Go Back
            </Button>
          </Card>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          <Text variant="h2" style={styles.headerTitle}>
            {tide.name}
          </Text>
        </View>

        {/* Tide Overview */}
        <Card variant="elevated" padding={4} style={styles.overviewCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: getStatusColor(tide.status) }
                ]} 
              />
              <Text variant="bodySmall" style={styles.statusText}>
                {tide.status.toUpperCase()}
              </Text>
            </View>
            <Text variant="bodySmall" color="tertiary">
              {tide.flow_type} tide
            </Text>
          </View>

          {tide.description && (
            <Text variant="body" color="secondary" style={styles.description}>
              {tide.description}
            </Text>
          )}

          <View style={styles.statsRow}>
            {tide.energy_level !== undefined && (
              <View style={styles.statItem}>
                <Zap size={16} color={colors.warning} />
                <Text variant="bodySmall" color="secondary">
                  Energy: {tide.energy_level}
                </Text>
              </View>
            )}
            
            {tide.flow_count !== undefined && (
              <View style={styles.statItem}>
                <Activity size={16} color={colors.primary[500]} />
                <Text variant="bodySmall" color="secondary">
                  Flows: {tide.flow_count}
                </Text>
              </View>
            )}

            <View style={styles.statItem}>
              <Clock size={16} color={colors.neutral[500]} />
              <Text variant="bodySmall" color="secondary">
                Created: {formatDate(tide.created_at)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Report Data */}
        {report && (
          <Card variant="outlined" padding={4} style={styles.reportCard}>
            <Text variant="h4" style={styles.sectionTitle}>
              Analytics
            </Text>
            
            <View style={styles.reportStats}>
              <View style={styles.reportStat}>
                <Text variant="h3" color="primary">
                  {report.total_flows}
                </Text>
                <Text variant="bodySmall" color="tertiary">
                  Total Flows
                </Text>
              </View>

              <View style={styles.reportStat}>
                <Text variant="h3" color="primary">
                  {Math.round(report.total_duration / 60)}h
                </Text>
                <Text variant="bodySmall" color="tertiary">
                  Total Duration
                </Text>
              </View>

              <View style={styles.reportStat}>
                <Text variant="h3" color="primary">
                  {Math.round(report.average_duration)}m
                </Text>
                <Text variant="bodySmall" color="tertiary">
                  Avg Duration
                </Text>
              </View>

              <View style={styles.reportStat}>
                <Text variant="h3" color="primary">
                  {report.linked_tasks}
                </Text>
                <Text variant="bodySmall" color="tertiary">
                  Linked Tasks
                </Text>
              </View>
            </View>

            {report.last_flow && (
              <View style={styles.lastFlow}>
                <Text variant="bodySmall" color="tertiary">
                  Last flow: {formatDate(report.last_flow)}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Actions */}
        {tide.status === "active" && (
          <Card variant="outlined" padding={4} style={styles.actionsCard}>
            <Text variant="h4" style={styles.sectionTitle}>
              Actions
            </Text>
            
            <Button
              variant="primary"
              onPress={handleStartFlow}
              style={styles.actionButton}
            >
              Start Flow Session
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  backButton: {
    marginRight: spacing[3],
  },
  headerTitle: {
    flex: 1,
  },
  overviewCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  statusText: {
    fontWeight: "600",
  },
  description: {
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  reportCard: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  reportStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reportStat: {
    alignItems: "center",
    minWidth: "45%",
    marginBottom: spacing[3],
  },
  lastFlow: {
    alignItems: "center",
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  actionsCard: {
    margin: spacing[4],
    marginBottom: spacing[6],
  },
  actionButton: {
    marginTop: spacing[2],
  },
});