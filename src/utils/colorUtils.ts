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