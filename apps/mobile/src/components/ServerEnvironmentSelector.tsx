// Server Environment Selector Component

import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useServerEnvironment } from "../context/ServerEnvironmentContext";
import type {
  ServerEnvironmentId,
  ServerEnvironment,
} from "../context/ServerEnvironmentTypes";
import { Card, Text, colors, spacing } from "../design-system";
import { getRobotoMonoFont } from "../utils/fonts";

interface ServerEnvironmentSelectorProps {
  onEnvironmentSelected?: (environment: ServerEnvironment) => void;
  showCurrentUrl?: boolean;
  showFeatures?: boolean;
  compact?: boolean;
}

export const ServerEnvironmentSelector: React.FC<ServerEnvironmentSelectorProps> =
  React.memo(
    ({
      onEnvironmentSelected,
      showCurrentUrl = true,
      showFeatures = false,
      compact = false,
    }) => {
      const {
        currentEnvironment,
        environments,
        isLoading,
        switchEnvironment,
        getCurrentEnvironment,
        getCurrentServerUrl,
      } = useServerEnvironment();

      const [localLoading, setLocalLoading] =
        useState<ServerEnvironmentId | null>(null);

      const handleEnvironmentSwitch = useCallback(
        async (environmentId: ServerEnvironmentId) => {
          if (currentEnvironment === environmentId) return;

          setLocalLoading(environmentId);
          try {
            await switchEnvironment(environmentId);
            const newEnvironment = environments[environmentId];
            onEnvironmentSelected?.(newEnvironment);
          } catch (error) {
            // Error handling is done in the context
            console.error("Failed to switch environment:", error);
          } finally {
            setLocalLoading(null);
          }
        },
        [
          currentEnvironment,
          switchEnvironment,
          environments,
          onEnvironmentSelected,
        ]
      );

      const renderEnvironmentOption = useCallback(
        (
          environmentId: ServerEnvironmentId,
          environment: ServerEnvironment
        ) => {
          const isSelected = currentEnvironment === environmentId;
          const isLoadingThis = localLoading === environmentId;

          return (
            <TouchableOpacity
              key={environmentId}
              style={[
                styles.environmentOption,
                isSelected && styles.environmentOptionSelected,
              ]}
              onPress={() => handleEnvironmentSwitch(environmentId)}
              disabled={isSelected || isLoadingThis || isLoading}
            >
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={styles.environmentContent}>
                <View style={styles.environmentHeader}>
                  <Text
                    variant="body"
                    weight="medium"
                    color={isSelected ? "primary" : "primary"}
                  >
                    {environment.name}
                  </Text>
                  {environment.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text variant="bodySmall" color="white" weight="medium">
                        Default
                      </Text>
                    </View>
                  )}
                </View>

                {!compact && (
                  <Text
                    variant="bodySmall"
                    color="secondary"
                    style={styles.environmentDescription}
                  >
                    {environment.description}
                  </Text>
                )}

                <Text
                  variant="bodySmall"
                  color="tertiary"
                  style={styles.environmentUrl}
                >
                  {environment.url}
                </Text>

                <View style={styles.environmentMeta}>
                  <View
                    style={[
                      styles.environmentBadge,
                      {
                        backgroundColor: getEnvironmentColor(
                          environment.environment
                        ),
                      },
                    ]}
                  >
                    <Text variant="bodySmall" color="white" weight="medium">
                      {environment.environment}
                    </Text>
                  </View>

                  {showFeatures &&
                    !compact &&
                    environment.features.length > 0 && (
                      <View style={styles.featuresContainer}>
                        {environment.features
                          .slice(0, 2)
                          .map((feature, index) => (
                            <View key={index} style={styles.featureBadge}>
                              <Text variant="bodySmall" color="secondary">
                                {feature}
                              </Text>
                            </View>
                          ))}
                        {environment.features.length > 2 && (
                          <Text variant="bodySmall" color="tertiary">
                            +{environment.features.length - 2} more
                          </Text>
                        )}
                      </View>
                    )}
                </View>

                {isLoadingThis && (
                  <View style={styles.loadingIndicator}>
                    <Text variant="bodySmall" color="primary">
                      Switching...
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        },
        [
          currentEnvironment,
          localLoading,
          isLoading,
          handleEnvironmentSwitch,
          showFeatures,
          compact,
        ]
      );

      const getEnvironmentColor = (environment: string): string => {
        switch (environment) {
          case "production":
            return colors.success;
          case "staging":
            return colors.warning;
          case "development":
            return colors.info;
          case "mason-development":
            return colors.primary[500];
          case "custom":
            return colors.neutral[500];
          default:
            return colors.neutral[500];
        }
      };

      return (
        <View style={styles.container}>
          {showCurrentUrl && (
            <Card variant="outlined" padding={3} style={styles.currentUrlCard}>
              <Text variant="bodySmall" color="secondary" weight="medium">
                Current Server:
              </Text>
              <Text
                variant="bodySmall"
                color="primary"
                style={styles.currentUrl}
              >
                {getCurrentServerUrl()}
              </Text>
              <Text variant="bodySmall" color="tertiary">
                {getCurrentEnvironment().name} •{" "}
                {getCurrentEnvironment().environment}
              </Text>
            </Card>
          )}

          <View style={styles.environmentsList}>
            <Text variant="body" weight="medium" style={styles.sectionTitle}>
              Select Environment:
            </Text>

            <ScrollView
              style={styles.environmentsScrollView}
              showsVerticalScrollIndicator={false}
            >
              {Object.entries(environments).map(
                ([environmentId, environment]) =>
                  renderEnvironmentOption(
                    environmentId as ServerEnvironmentId,
                    environment
                  )
              )}
            </ScrollView>
          </View>
        </View>
      );
    }
  );

ServerEnvironmentSelector.displayName = "ServerEnvironmentSelector";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  currentUrlCard: {
    marginBottom: spacing[4],
  },
  currentUrl: {
    fontFamily: getRobotoMonoFont('regular'),
    marginTop: spacing[1],
  },
  environmentsList: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  environmentsScrollView: {
    flex: 1,
  },
  environmentOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  environmentOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  radioContainer: {
    marginRight: spacing[3],
    paddingTop: spacing[1],
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  environmentContent: {
    flex: 1,
  },
  environmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  defaultBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    backgroundColor: colors.success,
    borderRadius: 8,
  },
  environmentDescription: {
    marginBottom: spacing[1],
    lineHeight: 18,
  },
  environmentUrl: {
    fontFamily: getRobotoMonoFont('regular'),
    marginBottom: spacing[2],
  },
  environmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[1],
  },
  environmentBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: 8,
  },
  featuresContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[1],
    marginLeft: spacing[2],
  },
  featureBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
  },
  loadingIndicator: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
});
