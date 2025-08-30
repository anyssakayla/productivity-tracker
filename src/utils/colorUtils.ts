/**
 * Color utility functions for dynamic theming based on focus colors
 */

/**
 * Converts hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB values to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjusts the brightness of a color
 * @param color - hex color string
 * @param amount - adjustment amount (-100 to 100, negative = darker, positive = lighter)
 */
export function adjustColorBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const factor = amount / 100;
  
  let r, g, b;
  
  if (amount > 0) {
    // Lighten
    r = rgb.r + (255 - rgb.r) * factor;
    g = rgb.g + (255 - rgb.g) * factor;
    b = rgb.b + (255 - rgb.b) * factor;
  } else {
    // Darken
    r = rgb.r * (1 + factor);
    g = rgb.g * (1 + factor);
    b = rgb.b * (1 + factor);
  }
  
  return rgbToHex(r, g, b);
}

/**
 * Generates a subtle gradient from a base color
 * @param baseColor - hex color string
 * @param variation - how much variation in the gradient (default: 15)
 */
export function generateGradientFromColor(baseColor: string, variation: number = 15): {
  start: string;
  end: string;
  solid: string;
} {
  const lighterColor = adjustColorBrightness(baseColor, variation);
  const darkerColor = adjustColorBrightness(baseColor, -variation);
  
  return {
    start: lighterColor,
    end: darkerColor,
    solid: baseColor,
  };
}

/**
 * Gets a contrasting color (white or black) for text on a colored background
 * @param backgroundColor - hex color string
 * @param threshold - luminance threshold (default: 0.5, lower = more sensitive to light colors)
 */
export function getContrastColor(backgroundColor: string, threshold: number = 0.5): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > threshold ? '#000000' : '#ffffff';
}

/**
 * Checks if a color is considered "light" (needs dark text for contrast)
 * @param color - hex color string
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6; // More sensitive threshold for light colors
}

/**
 * Creates a semi-transparent version of a color
 * @param color - hex color string
 * @param opacity - opacity value (0-1)
 */
export function addOpacityToColor(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Generates theme colors from a focus color
 * @param focusColor - the base focus color
 */
export function generateThemeFromFocus(focusColor: string): {
  primary: {
    start: string;
    end: string;
    solid: string;
  };
  accent: string;
  light: string;
  dark: string;
  transparent: string;
  contrastText: string;
  isLight: boolean;
} {
  const gradient = generateGradientFromColor(focusColor, 15);
  
  return {
    primary: gradient,
    accent: adjustColorBrightness(focusColor, -10),
    light: adjustColorBrightness(focusColor, 30),
    dark: adjustColorBrightness(focusColor, -25),
    transparent: addOpacityToColor(focusColor, 0.1),
    contrastText: getContrastColor(focusColor, 0.6),
    isLight: isLightColor(focusColor),
  };
}

/**
 * Converts hex to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL to hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);

  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

/**
 * Generates a complementary color (opposite on color wheel)
 */
export function getComplementaryColor(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  const complementaryHue = (hsl.h + 180) % 360;
  return hslToHex(complementaryHue, hsl.s, hsl.l);
}

/**
 * Generates analogous colors (adjacent on color wheel)
 */
export function getAnalogousColors(hex: string, degrees: number = 30): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex];

  const analogous1 = hslToHex((hsl.h + degrees) % 360, hsl.s, hsl.l);
  const analogous2 = hslToHex((hsl.h - degrees + 360) % 360, hsl.s, hsl.l);

  return [analogous2, hex, analogous1];
}

/**
 * Generates a comprehensive color palette for categories based on focus color
 */
export function generateCategoryPalette(focusColor: string): {
  suggested: string[];
  shades: {
    lighter: string[];
    darker: string[];
  };
  complementary: string;
  analogous: string[];
} {
  const hsl = hexToHsl(focusColor);
  if (!hsl) {
    return {
      suggested: [focusColor],
      shades: { lighter: [], darker: [] },
      complementary: focusColor,
      analogous: [focusColor],
    };
  }

  // Generate lighter shades (tints)
  const lighter = [
    hslToHex(hsl.h, Math.max(hsl.s - 10, 20), Math.min(hsl.l + 15, 85)),
    hslToHex(hsl.h, Math.max(hsl.s - 20, 15), Math.min(hsl.l + 25, 90)),
    hslToHex(hsl.h, Math.max(hsl.s - 30, 10), Math.min(hsl.l + 35, 95)),
  ];

  // Generate darker shades
  const darker = [
    hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.max(hsl.l - 15, 15)),
    hslToHex(hsl.h, Math.min(hsl.s + 20, 100), Math.max(hsl.l - 25, 10)),
  ];

  // Get complementary color (with adjusted saturation/lightness for better harmony)
  const complementary = hslToHex(
    (hsl.h + 180) % 360,
    Math.max(hsl.s - 15, 40),
    hsl.l > 50 ? Math.max(hsl.l - 10, 40) : Math.min(hsl.l + 10, 60)
  );

  // Get analogous colors
  const analogous = getAnalogousColors(focusColor, 25);

  // Create suggested colors (best options for categories)
  const suggested = [
    focusColor, // Original focus color
    lighter[0], // Light tint
    darker[0],  // Dark shade
    complementary, // Complementary
    analogous[0], // Analogous 1
    analogous[2], // Analogous 2
    lighter[1], // Lighter tint
  ];

  return {
    suggested,
    shades: { lighter, darker },
    complementary,
    analogous,
  };
}

/**
 * Gets a readable name for a color relationship
 */
export function getColorRelationshipName(originalColor: string, derivedColor: string): string {
  if (originalColor === derivedColor) return 'original';
  
  const originalHsl = hexToHsl(originalColor);
  const derivedHsl = hexToHsl(derivedColor);
  
  if (!originalHsl || !derivedHsl) return 'custom';

  // Check if it's the same hue (shade/tint)
  const hueDiff = Math.abs(originalHsl.h - derivedHsl.h);
  if (hueDiff < 15 || hueDiff > 345) {
    if (derivedHsl.l > originalHsl.l) return 'lighter shade';
    if (derivedHsl.l < originalHsl.l) return 'darker shade';
    return 'same shade';
  }

  // Check if it's complementary
  const complementaryHue = (originalHsl.h + 180) % 360;
  const complementaryDiff = Math.abs(derivedHsl.h - complementaryHue);
  if (complementaryDiff < 20) return 'complementary';

  // Check if it's analogous
  if (hueDiff < 60) return 'analogous';

  return 'custom';
}

/**
 * Default fallback colors when no focus is selected
 */
export const DEFAULT_THEME_COLORS = {
  primary: {
    start: '#667eea',
    end: '#764ba2',
    solid: '#667eea',
  },
  accent: '#5a6fd8',
  light: '#8fa4f3',
  dark: '#4c5bd8',
  transparent: 'rgba(102, 126, 234, 0.1)',
  contrastText: '#ffffff',
  isLight: false,
};