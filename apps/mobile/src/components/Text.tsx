// BLUE

import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from "react-native";
import { colors, typography } from "../design-system/tokens";
import {
  getInterFont,
  getRobotoMonoFont,
  numericToFontWeight,
} from "../utils/fonts";

export interface TextProps extends RNTextProps {
  variant?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "header"
    | "body"
    | "bodySmall"
    | "caption"
    | "captionSmall"
    | "mono";
  color?: keyof typeof colors.text | string;
  weight?: keyof typeof typography.fontWeight;
  align?: "left" | "center" | "right";
  backgroundColor?: string | null;
}

export const Text: React.FC<TextProps> = React.memo(
  ({
    children,
    variant = "body",
    color = "primary",
    weight,
    align = "left",
    backgroundColor = null,
    style,
    ...props
  }) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "h1":
          return {
            fontSize: typography.fontSize["4xl"],
            fontFamily: getInterFont("bold"),
            fontWeight: typography.fontWeight.bold,
            lineHeight:
              typography.fontSize["4xl"] * typography.lineHeight.tight,
          };
        case "h2":
          return {
            fontSize: typography.fontSize["3xl"],
            fontFamily: getInterFont("bold"),
            fontWeight: typography.fontWeight.bold,
            lineHeight:
              typography.fontSize["3xl"] * typography.lineHeight.tight,
          };
        case "h3":
          return {
            fontSize: typography.fontSize["2xl"],
            fontFamily: getInterFont("semiBold"),
            fontWeight: typography.fontWeight.semibold,
            lineHeight:
              typography.fontSize["2xl"] * typography.lineHeight.tight,
          };
        case "h4":
          return {
            fontSize: typography.fontSize.xl,
            fontFamily: getInterFont("semiBold"),
            fontWeight: typography.fontWeight.semibold,
            lineHeight: typography.fontSize.xl * typography.lineHeight.pro,
          };
            case "header":
          return {
            fontSize: typography.fontSize.base,
            fontFamily: getInterFont("semiBold"),
            fontWeight: typography.fontWeight.semibold,
            lineHeight: typography.fontSize.base * typography.lineHeight.pro,
          };
        case "body":
          return {
            fontSize: typography.fontSize.base,
            fontFamily: getInterFont("regular"),
            fontWeight: typography.fontWeight.normal,
            lineHeight: typography.fontSize.base * typography.lineHeight.pro,
          };
        case "bodySmall":
          return {
            fontSize: typography.fontSize.sm,
            fontFamily: getInterFont("regular"),
            fontWeight: typography.fontWeight.normal,
            lineHeight: typography.fontSize.sm * typography.lineHeight.pro,
          };
        case "caption":
          return {
            fontSize: typography.fontSize.xs,
            fontFamily: getInterFont("regular"),
            fontWeight: typography.fontWeight.normal,
            lineHeight: typography.fontSize.xs * typography.lineHeight.pro,
          };

        case "captionSmall":
          return {
            fontSize: 11.5,
            fontFamily: getInterFont("regular"),
            fontWeight: typography.fontWeight.normal,
            lineHeight: 11.5,
          };
        case "mono":
          return {
            fontSize: typography.fontSize.sm,
            fontFamily: getRobotoMonoFont("regular"),
            fontWeight: typography.fontWeight.normal,
            lineHeight: typography.fontSize.sm * typography.lineHeight.pro,
          };
        default:
          return {};
      }
    };

    const getTextColor = () => {
      if (color in colors.text) {
        return colors.text[color as keyof typeof colors.text];
      }
      return color;
    };

    const variantStyle = getVariantStyle();
    const textColor = getTextColor();

    // Get the correct font family based on weight override
    const getFontFamily = () => {
      if (variant === "mono") {
        // For mono variant, use the weight if provided
        const monoWeight = weight
          ? numericToFontWeight(typography.fontWeight[weight])
          : "regular";
        return getRobotoMonoFont(monoWeight);
      }

      // For other variants, use Inter with the appropriate weight
      if (weight) {
        const fontWeight = numericToFontWeight(typography.fontWeight[weight]);
        return getInterFont(fontWeight);
      }

      // Use the variant's default font family
      return variantStyle.fontFamily || typography.fontFamily.primary;
    };

    return (
      <RNText
        style={[
          styles.base,
          variantStyle as any,
          {
            backgroundColor: backgroundColor || undefined,
            color: textColor,
            fontFamily: getFontFamily(),
            fontWeight: (weight
              ? typography.fontWeight[weight]
              : variantStyle.fontWeight) as any,
            textAlign: align,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </RNText>
    );
  }
);

const styles = StyleSheet.create({
  base: {
    // Font family is set dynamically based on variant and weight
  },
});
