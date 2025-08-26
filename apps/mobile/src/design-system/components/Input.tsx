// BLUE

import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "../tokens";
import { Text } from "./Text";
import { getInterFont } from "../../utils/fonts";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.memo(React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  size = "md",
  variant = "outlined",
  leftIcon,
  rightIcon,
  style,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const getVariantStyle = (): ViewStyle => {
    const hasError = !!error;
    const borderColor = hasError
      ? colors.error
      : isFocused
      ? colors.primary[500]
      : colors.neutral[200];

    switch (variant) {
      case "default":
        return {
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          borderRadius: 0,
        };
      case "filled":
        return {
          backgroundColor: colors.neutral[100],
          borderWidth: 1,
          borderColor: isFocused ? colors.primary[500] : "#ffffff",
          borderRadius: borderRadius.base,
        };
      case "outlined":
        return {
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor,
          borderRadius: borderRadius.base,
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
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[4],
          minHeight: 52,
        };
      default:
        return {};
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, variantStyle, sizeStyle]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            ...(leftIcon ? [styles.inputWithLeftIcon] : []),
            ...(rightIcon ? [styles.inputWithRightIcon] : []),
            style,
          ]}
          placeholderTextColor={colors.neutral[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {(error || helperText) && (
        <Text
          variant="caption"
          color={error ? colors.error : "tertiary"}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}));

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: spacing[1],
    ...typography.textStyles.footnote,
    color: colors.text.secondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: getInterFont('regular'),
    color: colors.text.primary,
    padding: 0, // Remove default padding
  },
  inputWithLeftIcon: {
    marginLeft: spacing[2],
  },
  inputWithRightIcon: {
    marginRight: spacing[2],
  },
  leftIcon: {
    marginLeft: spacing[1],
  },
  rightIcon: {
    marginRight: spacing[1],
  },
  helperText: {
    marginTop: spacing[1],
  },
});
