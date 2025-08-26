// BLUE

import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { spacing } from "../tokens";

export interface ContainerProps extends ViewProps {
  padding?: keyof typeof spacing;
  paddingHorizontal?: keyof typeof spacing;
  paddingVertical?: keyof typeof spacing;
  maxWidth?: number;
  centered?: boolean;
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = React.memo(({
  children,
  padding,
  paddingHorizontal,
  paddingVertical,
  maxWidth,
  centered = false,
  style,
  ...props
}) => {
  const containerStyle = {
    ...(padding && { padding: spacing[padding] }),
    ...(paddingHorizontal && { paddingHorizontal: spacing[paddingHorizontal] }),
    ...(paddingVertical && { paddingVertical: spacing[paddingVertical] }),
    ...(maxWidth && { maxWidth }),
    ...(centered && { alignSelf: "center" as const }),
  };

  return (
    <View style={[styles.base, containerStyle, style]} {...props}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    width: "100%",
  },
});
