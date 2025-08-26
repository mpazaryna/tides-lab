import React, { useState } from "react";
import { TextInput, TextInputProps, View, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../design-system/tokens";
import { Text } from "./Text";
import { getInterFont } from "../utils/fonts";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export const Input = React.memo(
  React.forwardRef<TextInput, InputProps>(
    ({ label, error, rightIcon, style, ...props }, ref) => {
      const [focused, setFocused] = useState(false);

      return (
        <View>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={[styles.container, {
            borderColor: error ? colors.error : focused ? colors.primary[500] : colors.neutral[200]
          }]}>
            <TextInput
              ref={ref}
              style={[styles.input, rightIcon ? { marginRight: spacing[2] } : undefined, style]}
              placeholderTextColor={colors.neutral[400]}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              {...props}
            />
            {rightIcon}
          </View>
          {error && <Text variant="caption" color={colors.error} style={styles.error}>{error}</Text>}
        </View>
      );
    }
  )
);

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing[1],
    ...typography.textStyles.footnote,
    color: colors.text.tertiary,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    borderRadius: 11.25,
    borderWidth: 0.5,
    backgroundColor: "white",
    paddingHorizontal: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: getInterFont("regular"),
    color: colors.text.primary,
  },
  error: {
    marginTop: spacing[1],
  },
});
