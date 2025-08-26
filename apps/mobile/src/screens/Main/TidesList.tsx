// BLUE

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { MainStackScreenProps } from "../../navigation/types";
import { Routes } from "../../navigation/types";
import { NotificationService } from "../../services/NotificationService";
import { useAuth } from "../../context/AuthContext";
import { useMCP } from "../../context/MCPContext";
import {
  Button,
  Card,
  colors,
  Container,
  spacing,
  Text,
} from "../../design-system";
import type { Tide, EnergyLevel } from "../../types";

export default function TidesList() {
  const navigation =
    useNavigation<MainStackScreenProps<"TidesList">["navigation"]>();
  const { user } = useAuth();
  const {
    isConnected,
    loading,
    tides,
    createTide,
    startTideFlow,
    addEnergyToTide,
  } = useMCP();

  const [newTideName, setNewTideName] = useState("");
  const [newTideDescription, setNewTideDescription] = useState("");
  const [newTideFlowType, setNewTideFlowType] = useState<
    "daily" | "weekly" | "project" | "seasonal"
  >("project");

  // Flow session management
  const [activeFlowSession, setActiveFlowSession] = useState<string | null>(
    null
  );
  const [flowStartTime, setFlowStartTime] = useState<Date | null>(null);
  const [showFlowControls, setShowFlowControls] = useState<{
    [key: string]: boolean;
  }>({});

  const handleCreateTide = async () => {
    if (!newTideName.trim()) {
      NotificationService.error("Please enter a tide name", "Error");
      return;
    }

    try {
      await createTide(
        newTideName.trim(),
        newTideDescription.trim() || undefined,
        newTideFlowType
      );
      setNewTideName("");
      setNewTideDescription("");
      setNewTideFlowType("project");
      NotificationService.success("Tide created successfully!", "Success");
    } catch (err) {
      NotificationService.error("Failed to create tide", "Error");
    }
  };

  const handleStartFlow = async (tide: Tide) => {
    try {
      const response = await startTideFlow(
        tide.id,
        "moderate",
        25,
        "high",
        `Flow session for ${tide.name}`
      );

      if (response.success) {
        setActiveFlowSession(tide.id);
        setFlowStartTime(new Date());
        NotificationService.success(
          `Started ${tide.flow_type} flow session for "${tide.name}"`,
          "Flow Started"
        );
      }
    } catch (err) {
      NotificationService.error("Failed to start flow session", "Error");
    }
  };

  const handleQuickEnergy = async (tide: Tide, level: EnergyLevel) => {
    try {
      await addEnergyToTide(tide.id, level, `Quick energy update: ${level}`);
      NotificationService.success(
        `Energy level "${level}" recorded for ${tide.name}`,
        "Energy Updated"
      );
    } catch (err) {
      NotificationService.error("Failed to update energy level", "Error");
    }
  };

  const toggleFlowControls = (tideId: string) => {
    setShowFlowControls((prev) => ({
      ...prev,
      [tideId]: !prev[tideId],
    }));
  };

  const formatFlowType = (flowType: string) => {
    return flowType.charAt(0).toUpperCase() + flowType.slice(1);
  };

  const getFlowTypeColor = (flowType: string) => {
    switch (flowType) {
      case "daily":
        return colors.success;
      case "weekly":
        return colors.warning;
      case "project":
        return colors.primary[500];
      case "seasonal":
        return colors.info;
      default:
        return colors.neutral[500];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Container padding={5} style={styles.content}>
          <Text variant="h2" align="center" style={styles.titleStyle}>
            Welcome to Tides!
          </Text>

          {user && (
            <Text variant="h4" align="center" style={styles.welcomeTextStyle}>
              Hello, {user.email?.split("@")[0] || user.email}!
            </Text>
          )}

          {/* Connection Status */}
          <Card variant="outlined" padding={4} style={styles.statusCardStyle}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.connectedDot : styles.disconnectedDot,
                ]}
              />
              <Text variant="body" weight="medium">
                {isConnected ? "Connected to MCP Server" : "Disconnected"}
              </Text>
            </View>
          </Card>

          {/* Chat Assistant Access */}
          <Card variant="elevated" padding={4} style={styles.chatCardStyle}>
            <Text variant="h4" weight="medium" style={styles.chatTitleStyle}>
              💬 Chat Assistant
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={styles.chatDescriptionStyle}
            >
              Interact with MCP tools and the TideProductivityAgent through
              natural language conversations.
            </Text>
            <Button
              variant="primary"
              size="md"
              onPress={() => navigation.navigate(Routes.main.chat)}
              style={styles.chatButton}
            >
              Open Chat
            </Button>
          </Card>

          {isConnected && (
            <View style={styles.toolsSection}>
              <Text variant="h4" align="center" style={styles.toolsTitleStyle}>
                Your Tides ({tides.length})
              </Text>

              <Card
                variant="outlined"
                padding={4}
                style={styles.createTideCardStyle}
              >
                <Text
                  variant="body"
                  weight="medium"
                  style={styles.createTideTitleStyle}
                >
                  Create New Tide
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tide name"
                  placeholderTextColor={colors.text.tertiary}
                  value={newTideName}
                  onChangeText={setNewTideName}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.text.tertiary}
                  value={newTideDescription}
                  onChangeText={setNewTideDescription}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.flowTypeContainer}>
                  <Text
                    variant="bodySmall"
                    weight="medium"
                    style={styles.flowTypeLabel}
                  >
                    Flow Type:
                  </Text>
                  <View style={styles.flowTypeOptions}>
                    {(["daily", "weekly", "project", "seasonal"] as const).map(
                      (type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.flowTypeChip,
                            newTideFlowType === type &&
                              styles.flowTypeChipActive,
                          ]}
                          onPress={() => setNewTideFlowType(type)}
                        >
                          <Text
                            variant="bodySmall"
                            color={
                              newTideFlowType === type ? "white" : "secondary"
                            }
                            weight={
                              newTideFlowType === type ? "medium" : "normal"
                            }
                          >
                            {formatFlowType(type)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
                <Button
                  variant="secondary"
                  size="md"
                  onPress={handleCreateTide}
                  loading={loading}
                  fullWidth
                  disabled={!newTideName.trim()}
                >
                  Create Tide
                </Button>
              </Card>

              {tides.length > 0 ? (
                <View style={styles.tidesContainer}>
                  <Text
                    variant="body"
                    weight="semibold"
                    style={styles.tidesListTitleStyle}
                  >
                    Your Tides:
                  </Text>
                  {tides.map((tide) => (
                    <Card
                      key={tide.id}
                      variant="outlined"
                      padding={4}
                      style={[
                        styles.tideCardStyle,
                        { borderLeftColor: getFlowTypeColor(tide.flow_type) },
                      ]}
                    >
                      <View style={styles.tideHeader}>
                        <View style={styles.tideInfo}>
                          <Text variant="body" weight="medium">
                            {tide.name}
                          </Text>
                          <Text
                            variant="mono"
                            color="tertiary"
                            style={styles.tideIdStyle}
                          >
                            ID: {tide.id}
                          </Text>
                          <View style={styles.tideMetaRow}>
                            <View
                              style={[
                                styles.flowTypeBadge,
                                {
                                  backgroundColor: getFlowTypeColor(
                                    tide.flow_type
                                  ),
                                },
                              ]}
                            >
                              <Text
                                variant="bodySmall"
                                color="white"
                                weight="medium"
                              >
                                {formatFlowType(tide.flow_type)}
                              </Text>
                            </View>
                            <Text variant="bodySmall" color="secondary">
                              {tide.status}
                            </Text>
                          </View>
                          {tide.flow_count !== undefined && (
                            <Text variant="bodySmall" color="tertiary">
                              {tide.flow_count} sessions • Last:{" "}
                              {tide.last_flow
                                ? new Date(tide.last_flow).toLocaleDateString()
                                : "Never"}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.flowMenuButton}
                          onPress={() => toggleFlowControls(tide.id)}
                        >
                          <Text variant="bodySmall" color="primary">
                            {showFlowControls[tide.id] ? "▲" : "▼"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {tide.description && (
                        <Text
                          variant="bodySmall"
                          color="tertiary"
                          style={styles.tideDescriptionStyle}
                        >
                          {tide.description}
                        </Text>
                      )}

                      {showFlowControls[tide.id] && (
                        <View style={styles.flowControls}>
                          <View style={styles.flowButtonRow}>
                            <Button
                              variant="primary"
                              size="sm"
                              onPress={() => handleStartFlow(tide)}
                              style={styles.flowButton}
                              disabled={activeFlowSession === tide.id}
                            >
                              {activeFlowSession === tide.id
                                ? "Flow Active"
                                : "Start Flow"}
                            </Button>
                            <View style={styles.energyButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.energyChip,
                                  { backgroundColor: colors.success },
                                ]}
                                onPress={() => handleQuickEnergy(tide, "high")}
                              >
                                <Text
                                  variant="bodySmall"
                                  color="white"
                                  weight="medium"
                                >
                                  High
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.energyChip,
                                  { backgroundColor: colors.warning },
                                ]}
                                onPress={() =>
                                  handleQuickEnergy(tide, "medium")
                                }
                              >
                                <Text
                                  variant="bodySmall"
                                  color="white"
                                  weight="medium"
                                >
                                  Med
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.energyChip,
                                  { backgroundColor: colors.error },
                                ]}
                                onPress={() => handleQuickEnergy(tide, "low")}
                              >
                                <Text
                                  variant="bodySmall"
                                  color="white"
                                  weight="medium"
                                >
                                  Low
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {activeFlowSession === tide.id && flowStartTime && (
                            <View style={styles.activeFlowIndicator}>
                              <Text
                                variant="bodySmall"
                                color="success"
                                weight="medium"
                              >
                                ⚡ Flow session active since{" "}
                                {flowStartTime.toLocaleTimeString()}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      <Text
                        variant="mono"
                        color="tertiary"
                        style={styles.tideDateStyle}
                      >
                        Created:{" "}
                        {new Date(tide.created_at).toLocaleDateString()}
                      </Text>
                    </Card>
                  ))}
                </View>
              ) : (
                <Card
                  variant="outlined"
                  padding={4}
                  style={styles.emptyStateCardStyle}
                >
                  <Text variant="body" color="secondary" align="center">
                    No tides yet. Create your first one above!
                  </Text>
                </Card>
              )}
            </View>
          )}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[2],
  },
  connectedDot: {
    backgroundColor: colors.success,
  },
  disconnectedDot: {
    backgroundColor: colors.error,
  },
  toolsSection: {
    marginTop: spacing[4],
  },
  tidesContainer: {
    marginTop: spacing[4],
  },
  titleStyle: {
    marginBottom: spacing[6],
  },
  welcomeTextStyle: {
    marginBottom: spacing[6],
    color: colors.text.secondary,
  },
  statusCardStyle: {
    marginBottom: spacing[4],
  },
  chatCardStyle: {
    marginBottom: spacing[6],
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  chatTitleStyle: {
    marginBottom: spacing[2],
    color: colors.primary[600],
  },
  chatDescriptionStyle: {
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  chatButton: {
    marginTop: spacing[2],
  },
  toolsTitleStyle: {
    marginBottom: spacing[3],
  },
  createTideCardStyle: {
    marginBottom: spacing[4],
  },
  createTideTitleStyle: {
    marginBottom: spacing[3],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    padding: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing[3],
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  tidesListTitleStyle: {
    marginBottom: spacing[3],
  },
  tideCardStyle: {
    marginBottom: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  tideStatusStyle: {
    marginTop: spacing[1],
  },
  tideDescriptionStyle: {
    marginTop: spacing[1],
    fontStyle: "italic",
  },
  tideDateStyle: {
    marginTop: spacing[2],
    fontSize: 12,
  },
  emptyStateCardStyle: {
    marginTop: spacing[4],
  },
  flowTypeContainer: {
    marginBottom: spacing[3],
  },
  flowTypeLabel: {
    marginBottom: spacing[2],
  },
  flowTypeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  flowTypeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  flowTypeChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[2],
  },
  tideInfo: {
    flex: 1,
  },
  tideIdStyle: {
    fontSize: 11,
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
  tideMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[1],
    gap: spacing[2],
  },
  flowTypeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: 12,
  },
  flowMenuButton: {
    padding: spacing[1],
  },
  flowControls: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  flowButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  flowButton: {
    flex: 1,
    marginRight: spacing[2],
  },
  energyButtons: {
    flexDirection: "row",
    gap: spacing[1],
  },
  energyChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  activeFlowIndicator: {
    padding: spacing[2],
    backgroundColor: colors.success + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success + "40",
  },
});
