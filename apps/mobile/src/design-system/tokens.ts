import { getInterFont, getRobotoMonoFont } from '../utils/fonts';

export const colors = {
  // Primary - Brand Blue
  primary: {
    50: "#f5f7fa",
    100: "#e6ebf2",
    200: "#cbd6e3",
    300: "#a5b7cc",
    400: "#7993af",
    500: "#385070", // Brand
    600: "#314663",
    700: "#283a54",
    800: "#202f43",
    900: "#182433",
  },

  // Secondary - Accent Slate
  secondary: {
    50: "#f6f7f8",
    100: "#e4e8eb",
    200: "#c9d0d5",
    300: "#a4aeb7",
    400: "#7e8b97",
    500: "#5c6e7c",
    600: "#4f5f6a",
    700: "#414f58",
    800: "#333f46",
    900: "#272f35",
  },

  // Neutral - Dark Text
  neutral: {
    50: "#f9fafb", // Background 1
    100: "#f4f5f6",
    200: "#e5e7eb",
    300: "#d2d5da",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2933",
    900: "#111618", // Primary text
  },

  // Semantic
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Background
  background: {
    primary: "#F9FAFB", // Background 1
    secondary: "#FFFFFF", // Background 2
    tertiary: "#f4f5f6",
  },

  // Text
  text: {
    primary: "#111618",
    secondary: "#374151",
    tertiary: "#6b7280",
    inverse: "#FFFFFF",
  },

  // States
  state: {
    rising: "#3b82f6",
    peak: "#ef4444",
    ebbing: "#f59e0b",
    rest: "#10b981",
  },
};


export const typography = {
  fontFamily: {
    primary: getInterFont('regular'),
    mono: getRobotoMonoFont('regular'),
  },

  fontSize: {
    largeTitle: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    headline: 17,
    body: 17,
    callout: 16,
    subhead: 15,
    footnote: 13,
    caption1: 12,
    caption2: 11,
    // Additional sizes for Text component compatibility
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },

  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    // Additional weights for Text component compatibility
    normal: "400" as const,
    bold: "700" as const,
  },

  lineHeight: {
    largeTitle: 41,
    title1: 34,
    title2: 28,
    title3: 25,
    headline: 22,
    body: 22,
    callout: 21,
    subhead: 20,
    footnote: 18,
    caption1: 16,
    caption2: 13,
    // Additional line heights for Text component compatibility
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    inter: (fontSize: number) => Number((fontSize * -0.02).toFixed(2)),
  },

  textStyles: {
    largeTitle: {
      fontFamily: getInterFont('regular'),
      fontSize: 34,
      fontWeight: "400" as const,
      lineHeight: 41,
      letterSpacing: -0.68, // -2% of 34
    },
    title1: {
      fontFamily: getInterFont('semiBold'),
      fontSize: 28,
      fontWeight: "600" as const,
      lineHeight: 34,
      letterSpacing: -0.56,
    },
    title2: {
      fontFamily: getInterFont('regular'),
      fontSize: 22,
      fontWeight: "400" as const,
      lineHeight: 28,
      letterSpacing: -0.44,
    },
    title3: {
      fontFamily: getInterFont('regular'),
      fontSize: 20,
      fontWeight: "400" as const,
      lineHeight: 25,
      letterSpacing: -0.4,
    },
    headline: {
      fontFamily: getInterFont('semiBold'),
      fontSize: 17,
      fontWeight: "600" as const,
      lineHeight: 22,
      letterSpacing: -0.34,
    },
    body: {
      fontFamily: getInterFont('regular'),
      fontSize: 17,
      fontWeight: "400" as const,
      lineHeight: 22,
      letterSpacing: -0.34,
    },
    callout: {
      fontFamily: getInterFont('regular'),
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 21,
      letterSpacing: -0.32,
    },
    subhead: {
      fontFamily: getInterFont('regular'),
      fontSize: 15,
      fontWeight: "400" as const,
      lineHeight: 20,
      letterSpacing: -0.3,
    },
    footnote: {
      fontFamily: getInterFont('regular'),
      fontSize: 13,
      fontWeight: "400" as const,
      lineHeight: 18,
      letterSpacing: -0.26,
    },
    caption1: {
      fontFamily: getInterFont('regular'),
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      letterSpacing: -0.24,
    },
    caption2: {
      fontFamily: getInterFont('regular'),
      fontSize: 11,
      fontWeight: "400" as const,
      lineHeight: 13,
      letterSpacing: -0.22,
    },
  },

  monoTextStyles: {
    monoXs: {
      fontFamily: getRobotoMonoFont('regular'),
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    monoSm: {
      fontFamily: getRobotoMonoFont('regular'),
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
    monoBase: {
      fontFamily: getRobotoMonoFont('regular'),
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    monoLg: {
      fontFamily: getRobotoMonoFont('regular'),
      fontSize: 18,
      fontWeight: "400" as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const zIndex = {
  base: 1,
  overlay: 10,
  modal: 20,
  toast: 30,
  tooltip: 40,
};
