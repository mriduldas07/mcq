/**
 * Color Constants
 * 
 * Centralized color definitions for consistent theming across the application.
 * Uses HSL format to match Tailwind's CSS variable system.
 */

export const colors = {
  // Semantic Colors - Light Mode
  light: {
    // Primary (Blue)
    primary: {
      DEFAULT: '221.2 83.2% 53.3%',
      foreground: '210 40% 98%',
    },
    // Secondary (Gray)
    secondary: {
      DEFAULT: '210 40% 96.1%',
      foreground: '222.2 47.4% 11.2%',
    },
    // Destructive (Red)
    destructive: {
      DEFAULT: '0 84.2% 60.2%',
      foreground: '210 40% 98%',
    },
    // Warning (Orange/Yellow)
    warning: {
      DEFAULT: '38 92% 50%',  // Orange-yellow
      foreground: '0 0% 100%',
    },
    // Info (Blue)
    info: {
      DEFAULT: '199 89% 48%',  // Sky blue
      foreground: '0 0% 100%',
    },
    // Success (Green)
    success: {
      DEFAULT: '142 71% 45%',
      foreground: '0 0% 100%',
    },
    // Muted
    muted: {
      DEFAULT: '210 40% 96.1%',
      foreground: '215.4 16.3% 46.9%',
    },
    // Accent
    accent: {
      DEFAULT: '210 40% 96.1%',
      foreground: '222.2 47.4% 11.2%',
    },
  },

  // Semantic Colors - Dark Mode
  dark: {
    // Primary (Blue)
    primary: {
      DEFAULT: '217 91% 60%',
      foreground: '222 47% 11%',
    },
    // Secondary (Gray)
    secondary: {
      DEFAULT: '222 47% 11%',
      foreground: '210 40% 98%',
    },
    // Destructive (Red)
    destructive: {
      DEFAULT: '0 62.8% 30.6%',
      foreground: '210 40% 98%',
    },
    // Warning (Orange/Yellow)
    warning: {
      DEFAULT: '32 95% 44%',  // Darker orange for dark mode
      foreground: '0 0% 100%',
    },
    // Info (Blue)
    info: {
      DEFAULT: '199 89% 48%',  // Sky blue (same as light)
      foreground: '0 0% 100%',
    },
    // Success (Green)
    success: {
      DEFAULT: '142 71% 45%',
      foreground: '0 0% 100%',
    },
    // Muted
    muted: {
      DEFAULT: '223 47% 11%',
      foreground: '215 20% 65%',
    },
    // Accent
    accent: {
      DEFAULT: '216 34% 17%',
      foreground: '210 40% 98%',
    },
  },

  // Common Shades (for direct usage when needed)
  shades: {
    // Red shades
    red: {
      50: '0 85.7% 97.3%',
      100: '0 93.3% 94.1%',
      200: '0 96.3% 89.4%',
      300: '0 93.5% 81.8%',
      400: '0 90.6% 70.8%',
      500: '0 84.2% 60.2%',  // Base red
      600: '0 72.2% 50.6%',
      700: '0 73.7% 41.8%',
      800: '0 70% 35.3%',
      900: '0 62.8% 30.6%',
    },
    // Orange shades
    orange: {
      50: '33 100% 96.5%',
      100: '34 100% 91.8%',
      200: '32 97.7% 83.1%',
      300: '31 97.2% 72.4%',
      400: '27 96% 61%',
      500: '25 95% 53.1%',  // Base orange
      600: '21 90.2% 48.2%',
      700: '17 88.3% 40.4%',
      800: '15 79.1% 33.7%',
      900: '15 74.6% 27.8%',
    },
    // Yellow shades
    yellow: {
      50: '55 91.7% 95.3%',
      100: '55 96.7% 88%',
      200: '53 98.3% 76.9%',
      300: '50 97.8% 63.5%',
      400: '48 95.8% 53.1%',
      500: '45 93.4% 47.5%',  // Base yellow
      600: '41 96.1% 40.4%',
      700: '35 91.7% 32.9%',
      800: '32 81% 28.8%',
      900: '28 73.3% 23.9%',
    },
    // Green shades
    green: {
      50: '138 76.5% 96.7%',
      100: '141 84.2% 92.5%',
      200: '141 78.9% 85.1%',
      300: '142 76.6% 73.1%',
      400: '142 69.2% 58%',
      500: '142 71% 45.3%',  // Base green
      600: '142 76.2% 36.3%',
      700: '142 72.2% 29.2%',
      800: '143 64.2% 24.1%',
      900: '144 61.2% 20%',
    },
    // Blue shades
    blue: {
      50: '214 100% 96.9%',
      100: '214 94.6% 92.7%',
      200: '213 96.9% 87.3%',
      300: '212 96.4% 78.4%',
      400: '213 94.1% 67.8%',
      500: '217 91.2% 59.8%',  // Base blue
      600: '221 83.2% 53.3%',
      700: '224 76.3% 48%',
      800: '226 71.4% 40.8%',
      900: '224 64.3% 32.9%',
    },
    // Sky blue shades (for info)
    sky: {
      50: '204 100% 97.1%',
      100: '204 93.8% 93.7%',
      200: '201 94.4% 86.1%',
      300: '199 95.5% 73.9%',
      400: '198 93.2% 59.6%',
      500: '199 89% 48.4%',  // Base sky
      600: '200 98% 39.4%',
      700: '201 96.3% 32%',
      800: '201 90% 27.5%',
      900: '202 80.3% 23.9%',
    },
  },
} as const;

export type ColorShade = keyof typeof colors.shades.red;
export type ColorName = keyof typeof colors.shades;
