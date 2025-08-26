// BLUE

import React, { useMemo } from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { spacing } from "../tokens";

export interface StackProps extends ViewProps {
  direction?: "row" | "column";
  spacing?: keyof typeof spacing;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  children: React.ReactNode;
}

export const Stack: React.FC<StackProps> = React.memo(({
  children,
  direction = "column",
  spacing: spacingProp = 0,
  align = "stretch",
  justify = "start",
  wrap = false,
  style,
  ...props
}) => {
  const stackStyle = useMemo(() => {
    const getAlignItems = () => {
      switch (align) {
        case "start":
          return "flex-start";
        case "center":
          return "center";
        case "end":
          return "flex-end";
        case "stretch":
          return "stretch";
        default:
          return "stretch";
      }
    };

    const getJustifyContent = () => {
      switch (justify) {
        case "start":
          return "flex-start";
        case "center":
          return "center";
        case "end":
          return "flex-end";
        case "between":
          return "space-between";
        case "around":
          return "space-around";
        case "evenly":
          return "space-evenly";
        default:
          return "flex-start";
      }
    };

    return {
      flexDirection: direction,
      alignItems: getAlignItems(),
      justifyContent: getJustifyContent(),
      flexWrap: wrap ? ("wrap" as const) : ("nowrap" as const),
    };
  }, [direction, align, justify, wrap]);

  const childrenWithSpacing = useMemo(() => 
    React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const isLast = index === React.Children.count(children) - 1;
      if (isLast || spacingProp === 0) return child;

      const marginStyle =
        direction === "row"
          ? { marginRight: spacing[spacingProp] }
          : { marginBottom: spacing[spacingProp] };

      return React.cloneElement(child as any, {
        style: [(child.props as any)?.style, marginStyle],
      });
    }), [children, direction, spacingProp]);

  return (
    <View style={[styles.base, stackStyle, style]} {...props}>
      {childrenWithSpacing}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    // Base styles if needed
  },
});
