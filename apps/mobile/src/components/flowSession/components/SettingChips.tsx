import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, colors, spacing } from "../../../design-system";

interface SettingChipsProps<T> {
  options: readonly T[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  renderLabel: (value: T) => string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export function SettingChips<T>({
  options,
  selectedValue,
  onValueChange,
  renderLabel,
  variant = "primary",
  disabled = false,
}: SettingChipsProps<T>) {
  const getChipStyles = (isSelected: boolean) => [
    styles.chip,
    variant === "primary" ? styles.chipPrimary : styles.chipSecondary,
    isSelected && 
      (variant === "primary" ? styles.chipActivePrimary : styles.chipActiveSecondary),
    disabled && styles.chipDisabled,
  ];

  const getTextColor = (isSelected: boolean) => {
    if (disabled) return "disabled";
    if (isSelected) return "white";
    return "secondary";
  };

  const getTextWeight = (isSelected: boolean) => {
    return isSelected ? "medium" : "normal";
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = option === selectedValue;
        return (
          <TouchableOpacity
            key={index}
            style={getChipStyles(isSelected)}
            onPress={() => !disabled && onValueChange(option)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              variant="bodySmall"
              color={getTextColor(isSelected)}
              weight={getTextWeight(isSelected)}
            >
              {renderLabel(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 50,
    alignItems: "center",
  },
  chipPrimary: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  chipSecondary: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  chipActivePrimary: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipActiveSecondary: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  chipDisabled: {
    opacity: 0.5,
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[100],
  },
});