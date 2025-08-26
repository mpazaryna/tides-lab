// BLUE

import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { Text } from "./Text";
import { colors, spacing, borderRadius, shadows, typography } from "../tokens";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = React.memo(({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyle = (): ViewStyle => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case "primary":
        return {
          backgroundColor: isDisabled
            ? colors.neutral[300]
            : colors.primary[500],
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: isDisabled
            ? colors.neutral[200]
            : colors.secondary[500],
          borderWidth: 0,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: isDisabled ? colors.neutral[300] : colors.primary[500],
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      case "danger":
        return {
          backgroundColor: isDisabled ? colors.neutral[300] : colors.error,
          borderWidth: 0,
        };
      default:
        return {};
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          minHeight: 36,
        };
      case "md":
        return {
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          minHeight: 44,
        };
      case "lg":
        return {
          paddingHorizontal: spacing[6],
          paddingVertical: spacing[4],
          minHeight: 52,
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    const isDisabled = disabled || loading;

    if (isDisabled) {
      return colors.neutral[500];
    }

    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        return colors.text.inverse;
      case "outline":
      case "ghost":
        return colors.primary[500];
      default:
        return colors.text.primary;
    }
  };

  const getTextVariant = () => {
    switch (size) {
      case "sm":
        return "bodySmall";
      case "md":
        return "body";
      case "lg":
        return "body";
      default:
        return "body";
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          variant={getTextVariant() as any}
          color={textColor}
          style={styles.text}
          align="center"
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...shadows.sm,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...typography.textStyles.headline,
  },
});
