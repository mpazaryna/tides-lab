import { Platform } from 'react-native';

type FontFamily = 'inter' | 'robotoMono';
type FontWeight = 
  | 'thin'           // 100
  | 'extraLight'     // 200
  | 'light'          // 300
  | 'regular'        // 400
  | 'medium'         // 500
  | 'semiBold'       // 600
  | 'bold'           // 700
  | 'extraBold'      // 800
  | 'black';         // 900

interface FontOptions {
  family?: FontFamily;
  weight?: FontWeight;
  italic?: boolean;
}

/**
 * Get the correct font family name for the current platform
 * iOS uses PostScript names, Android uses file names
 */
export function getFontFamily(options: FontOptions = {}): string {
  const {
    family = 'inter',
    weight = 'regular',
    italic = false,
  } = options;

  if (Platform.OS === 'ios') {
    return getIOSFontFamily(family, weight, italic);
  } else {
    return getAndroidFontFamily(family, weight, italic);
  }
}

function getIOSFontFamily(
  family: FontFamily,
  weight: FontWeight,
  italic: boolean
): string {
  if (family === 'robotoMono') {
    const weightMap: Record<FontWeight, string> = {
      thin: 'Thin',
      extraLight: 'ExtraLight',
      light: 'Light',
      regular: 'Regular',
      medium: 'Medium',
      semiBold: 'SemiBold',
      bold: 'Bold',
      extraBold: 'Bold', // RobotoMono doesn't have ExtraBold, use Bold
      black: 'Bold',     // RobotoMono doesn't have Black, use Bold
    };

    const weightName = weightMap[weight];
    const italicSuffix = italic ? 'Italic' : '';
    return `RobotoMono-${weightName}${italicSuffix}`;
  }

  // Inter font family
  const weightMap: Record<FontWeight, string> = {
    thin: 'Thin',
    extraLight: 'ExtraLight',
    light: 'Light',
    regular: 'Regular',
    medium: 'Medium',
    semiBold: 'SemiBold',
    bold: 'Bold',
    extraBold: 'ExtraBold',
    black: 'Black',
  };

  const weightName = weightMap[weight];
  
  // Inter uses a different naming convention for iOS
  if (italic) {
    return `Inter-${weightName}Italic`;
  }
  return `Inter-${weightName}`;
}

function getAndroidFontFamily(
  family: FontFamily,
  weight: FontWeight,
  italic: boolean
): string {
  if (family === 'robotoMono') {
    const weightMap: Record<FontWeight, string> = {
      thin: 'Thin',
      extraLight: 'ExtraLight',
      light: 'Light',
      regular: 'Regular',
      medium: 'Medium',
      semiBold: 'SemiBold',
      bold: 'Bold',
      extraBold: 'Bold', // RobotoMono doesn't have ExtraBold
      black: 'Bold',     // RobotoMono doesn't have Black
    };

    const weightName = weightMap[weight];
    const italicSuffix = italic ? 'Italic' : '';
    return `RobotoMono-${weightName}${italicSuffix}`;
  }

  // Inter font family - Android uses file names
  const weightMap: Record<FontWeight, string> = {
    thin: 'Thin',
    extraLight: 'ExtraLight',
    light: 'Light',
    regular: 'Regular',
    medium: 'Medium',
    semiBold: 'SemiBold',
    bold: 'Bold',
    extraBold: 'ExtraBold',
    black: 'Black',
  };

  const weightName = weightMap[weight];
  const italicSuffix = italic ? 'Italic' : '';
  
  // Android uses the actual file names which include _18pt
  return `Inter_18pt-${weightName}${italicSuffix}`;
}

/**
 * Convert numeric font weight to weight name
 */
export function numericToFontWeight(weight: string | number): FontWeight {
  const numWeight = typeof weight === 'string' ? parseInt(weight, 10) : weight;
  
  switch (numWeight) {
    case 100: return 'thin';
    case 200: return 'extraLight';
    case 300: return 'light';
    case 400: return 'regular';
    case 500: return 'medium';
    case 600: return 'semiBold';
    case 700: return 'bold';
    case 800: return 'extraBold';
    case 900: return 'black';
    default: return 'regular';
  }
}

/**
 * Helper to get Inter font with specific weight
 */
export function getInterFont(weight: FontWeight = 'regular', italic = false): string {
  return getFontFamily({ family: 'inter', weight, italic });
}

/**
 * Helper to get Roboto Mono font with specific weight
 */
export function getRobotoMonoFont(weight: FontWeight = 'regular', italic = false): string {
  return getFontFamily({ family: 'robotoMono', weight, italic });
}