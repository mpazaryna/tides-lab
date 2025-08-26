// BLUE

import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, shadows } from "../design-system/tokens";

export interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "elevated";
  padding?: keyof typeof spacing;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = React.memo(({
  children,
  variant = "default",
  padding = 4,
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.neutral[200],
          ...shadows.sm,
        };
      case "outlined":
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.neutral[300],
        };
      case "elevated":
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 0,
          ...shadows.md,
        };
      default:
        return {};
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <View
      style={[styles.base, variantStyle, { padding: spacing[padding] }, style]}
      {...props}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.base,
  },
});
