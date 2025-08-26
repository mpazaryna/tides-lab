import React, { useEffect, memo } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Card, colors, spacing, Text } from "../design-system";
import type { Tide } from "../services/mcpService";
import {
  useFlowTimer,
  useFlowSession,
  useFlowSettings,
  SettingChips,
  SessionTimer,
  INTENSITY_OPTIONS,
  DURATION_OPTIONS,
  type FlowIntensity,
  type FlowDuration,
} from "./flowSession/index";

interface FlowSessionProps {
  tide: Tide;
  onSessionEnd?: () => void;
}

const FlowSessionComponent = ({ tide, onSessionEnd }: FlowSessionProps) => {
  const { settings, setIntensity, setDuration } = useFlowSettings();
  const { sessionState, startSession, endSession, updateElapsedTime, isLoading } = useFlowSession({
    tide,
    onSessionEnd,
  });

  const { formattedTime, progress, elapsedTime } = useFlowTimer({
    isActive: sessionState.isActive,
    startTime: sessionState.startTime,
    duration: sessionState.settings.duration,
    onAutoEnd: endSession,
  });

  // Sync timer with session state
  useEffect(() => {
    if (sessionState.isActive) {
      updateElapsedTime(elapsedTime);
    }
  }, [elapsedTime, sessionState.isActive, updateElapsedTime]);

  const handleStartSession = async () => {
    await startSession(settings);
  };

  const formatIntensityLabel = (intensity: FlowIntensity): string => {
    return intensity.charAt(0).toUpperCase() + intensity.slice(1);
  };

  const formatDurationLabel = (duration: FlowDuration): string => {
    return `${duration}m`;
  };

  if (sessionState.isActive) {
    return (
      <Card variant="elevated" padding={4} style={styles.activeSession}>
        <View style={styles.sessionHeader}>
          <Text variant="h4" color="primary">
            🌊 Active Flow Session
          </Text>
          <Text variant="bodySmall" color="secondary">
            {tide.name} • {sessionState.settings.intensity} intensity
          </Text>
        </View>

        <SessionTimer
          formattedTime={formattedTime}
          targetDuration={sessionState.settings.duration}
          progress={progress}
          showProgress={true}
        />

        <View style={styles.sessionActions}>
          <Button
            variant="danger"
            size="md"
            onPress={endSession}
            disabled={isLoading}
            style={styles.endButton}
          >
            {isLoading ? "Ending..." : "End Session"}
          </Button>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding={4} style={styles.setupSession}>
      <Text variant="h4" style={styles.setupTitle}>
        Start Flow Session
      </Text>

      <View style={styles.settingsSection}>
        <Text variant="body" weight="medium" style={styles.settingLabel}>
          Intensity:
        </Text>
        <SettingChips
          options={INTENSITY_OPTIONS}
          selectedValue={settings.intensity}
          onValueChange={setIntensity}
          renderLabel={formatIntensityLabel}
          variant="primary"
          disabled={isLoading}
        />
      </View>

      <View style={styles.settingsSection}>
        <Text variant="body" weight="medium" style={styles.settingLabel}>
          Duration (minutes):
        </Text>
        <SettingChips
          options={DURATION_OPTIONS}
          selectedValue={settings.duration}
          onValueChange={setDuration}
          renderLabel={formatDurationLabel}
          variant="secondary"
          disabled={isLoading}
        />
      </View>

      <Button
        variant="primary"
        size="lg"
        onPress={handleStartSession}
        disabled={isLoading}
        style={styles.startButton}
        fullWidth
      >
        {isLoading 
          ? "Starting..." 
          : `Start ${settings.intensity} Flow Session (${settings.duration}m)`
        }
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  activeSession: {
    borderWidth: 2,
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  setupSession: {
    marginVertical: spacing[2],
  },
  sessionHeader: {
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sessionActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  endButton: {
    minWidth: 120,
  },
  setupTitle: {
    textAlign: "center",
    marginBottom: spacing[4],
  },
  settingsSection: {
    marginBottom: spacing[4],
  },
  settingLabel: {
    marginBottom: spacing[2],
  },
  startButton: {
    marginTop: spacing[2],
  },
});

// Export memoized component for performance
export const FlowSession = memo(FlowSessionComponent);