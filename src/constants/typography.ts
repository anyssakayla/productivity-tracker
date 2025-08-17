import { Platform } from 'react-native';

const systemFont = Platform.select({
  ios: '-apple-system',
  android: 'Roboto',
  default: 'System',
});

export const Typography = {
  fontFamily: {
    regular: systemFont,
    medium: systemFont,
    semibold: systemFont,
    bold: systemFont,
  },
  
  fontSize: {
    // Text sizes
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 36,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
  
  // Predefined text styles
  heading: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
  
  body: {
    large: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    regular: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
  },
  
  label: {
    large: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    regular: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    small: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
    },
  },
  
  button: {
    large: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    regular: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    small: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
  },
};