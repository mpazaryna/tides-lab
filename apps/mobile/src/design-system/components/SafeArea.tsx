// BLUE

import React from "react";
import { StyleSheet, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../tokens";

export interface SafeAreaProps extends ViewProps {
  backgroundColor?: string;
  edges?: Array<"top" | "right" | "bottom" | "left">;
  children: React.ReactNode;
}

export const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  backgroundColor = colors.background.primary,
  edges = ["top", "right", "bottom", "left"],
  style,
  ...props
}) => {
  return (
    <SafeAreaView
      style={[styles.base, { backgroundColor }, style]}
      edges={edges}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
