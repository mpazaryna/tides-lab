import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, colors, spacing } from "../../../design-system";

interface SessionTimerProps {
  formattedTime: string;
  targetDuration: number; // minutes
  progress: number; // percentage 0-100
  showProgress?: boolean;
}

export function SessionTimer({
  formattedTime,
  targetDuration,
  progress,
  showProgress = true,
}: SessionTimerProps) {
  return (
    <View style={styles.container}>
      <Text variant="h2" weight="bold" color="primary">
        {formattedTime}
      </Text>
      <Text variant="bodySmall" color="secondary">
        Target: {targetDuration} minutes
      </Text>

      {showProgress && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(Math.max(progress, 0), 100)}%` },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  progressBarContainer: {
    width: "100%",
    marginTop: spacing[2],
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: 4,
    minWidth: 2, // Ensure some visual feedback even at 0%
  },
});