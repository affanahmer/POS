import { Platform } from 'react-native';

// Typography system for GarmentPOS app
export const typography = {
  // Font families
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Text styles
  textStyles: {
    // Headers
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 20,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 1.4,
    },

    // Body text
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },

    // Caption and small text
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500',
      lineHeight: 1.2,
      textTransform: 'uppercase',
    },

    // Button text
    button: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 1.2,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.2,
    },
  },
};
