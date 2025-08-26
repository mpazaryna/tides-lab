import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text } from "../Text";
import { Card } from "../Card";
import { Stack } from "../Stack";
import { loggingService } from "../../services/loggingService";
import { useTimeContext, TimeContextType } from "../../context/TimeContext";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../design-system/tokens";

interface ContextOption {
  type: TimeContextType;
  label: string;
  description: string;
  icon: string;
}

const CONTEXT_OPTIONS: ContextOption[] = [
  {
    type: "daily",
    label: "Daily",
    description: "Today's focus",
    icon: "📅",
  },
  {
    type: "weekly",
    label: "Weekly",
    description: "This week's work",
    icon: "📊",
  },
  {
    type: "monthly",
    label: "Monthly",
    description: "Month overview",
    icon: "🗓️",
  },
  {
    type: "project",
    label: "Project",
    description: "Long-term goals",
    icon: "🎯",
  },
];

interface ContextSwitcherProps {
  compact?: boolean;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = React.memo(
  ({ compact = false }) => {
    const { currentContext, setCurrentContext } = useTimeContext();

    const handleContextSwitch = useCallback(
      (contextType: TimeContextType) => {
        if (contextType === currentContext) return;

        loggingService.info("ContextSwitcher", "Switching global time context", {
          from: currentContext,
          to: contextType,
        });

        setCurrentContext(contextType);
      },
      [currentContext, setCurrentContext]
    );

    if (compact) {
      return (
        <View style={styles.compactContainer}>
          {CONTEXT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.compactOption,
                option.type === currentContext && styles.compactOptionActive,
              ]}
              onPress={() => handleContextSwitch(option.type)}
            >
              <Text variant="body" style={styles.compactIcon}>
                {option.icon}
              </Text>
              <Text
                variant="caption"
                style={[
                  styles.compactLabel,
                  option.type === currentContext &&
                    styles.compactLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <Card variant="elevated" style={styles.container}>
        <Stack>
          <Text variant="h3" style={styles.title}>
            Context
          </Text>
          <Stack>
            {CONTEXT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.option,
                  option.type === currentContext && styles.optionActive,
                ]}
                onPress={() => handleContextSwitch(option.type)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <Text variant="h2" style={styles.icon}>
                      {option.icon}
                    </Text>
                  </View>
                  <View style={styles.optionText}>
                    <Text
                      variant="body"
                      style={[
                        styles.optionLabel,
                        option.type === currentContext &&
                          styles.optionLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.optionDescription,
                        option.type === currentContext &&
                          styles.optionDescriptionActive,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
                {option.type === currentContext && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </Stack>
        </Stack>
      </Card>
    );
  }
);

ContextSwitcher.displayName = "ContextSwitcher";

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
  title: {
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },

  // Full size options
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[3],
    borderRadius: spacing[4],
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  icon: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    color: colors.neutral[800],
    fontWeight: typography.fontWeight.medium,
  },
  optionLabelActive: {
    color: colors.primary[700],
  },
  optionDescription: {
    color: colors.neutral[600],
    marginTop: 2,
  },
  optionDescriptionActive: {
    color: colors.primary[600],
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },

  // Compact options
  compactContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  compactOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: spacing[4],
    minHeight: 60,
  },
  compactOptionActive: {
    backgroundColor: colors.primary[500],
  },
  compactIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  compactLabel: {
    color: colors.neutral[700],
    fontWeight: typography.fontWeight.medium,
    fontSize: 12,
    textAlign: "center",
  },
  compactLabelActive: {
    color: colors.neutral[50],
  },
});
