/**
 * Cin7 Brand Theme Configuration for Shopify Polaris
 *
 * This theme applies Cin7's brand identity to Polaris components.
 *
 * Brand Colors:
 * - Hept Blue: Primary brand color representing sophistication
 * - Transit Yellow: Secondary brand color representing energy
 *
 * Color Palette Documentation:
 * Based on Cin7's brand guidelines (brand.cin7.com)
 */

export const cin7Colors = {
  // Primary Brand Colors
  heptBlue: {
    main: '#0033A0',        // Primary brand blue
    dark: '#002266',        // Darker variant
    light: '#1A4DB8',       // Lighter variant
    lighter: '#E6EBF5',     // Very light blue for backgrounds
  },

  transitYellow: {
    main: '#FFC845',        // Primary brand yellow
    dark: '#FFBB00',        // Darker variant
    light: '#FFD670',       // Lighter variant
    lighter: '#FFF9E6',     // Very light yellow for backgrounds
  },

  // Neutral Colors
  gray: {
    900: '#1A1A1A',         // Darkest gray for text
    800: '#2E2E2E',         // Dark gray
    700: '#424242',         // Medium-dark gray
    600: '#757575',         // Medium gray
    500: '#9E9E9E',         // Mid-gray
    400: '#BDBDBD',         // Light-medium gray
    300: '#D9D9D9',         // Light gray
    200: '#EEEEEE',         // Very light gray
    100: '#F5F5F5',         // Ultra light gray for backgrounds
    50: '#FAFAFA',          // Lightest gray
  },

  // Semantic Colors
  semantic: {
    success: {
      main: '#00A854',      // Success green
      light: '#E6F7EF',     // Light success background
      dark: '#008040',      // Dark success
    },
    warning: {
      main: '#FF9800',      // Warning orange
      light: '#FFF3E0',     // Light warning background
      dark: '#E67C00',      // Dark warning
    },
    error: {
      main: '#D32F2F',      // Error red
      light: '#FFEBEE',     // Light error background
      dark: '#B71C1C',      // Dark error
    },
    info: {
      main: '#0288D1',      // Info blue
      light: '#E1F5FE',     // Light info background
      dark: '#01579B',      // Dark info
    },
  },

  // Text Colors
  text: {
    primary: '#1A1A1A',     // Primary text
    secondary: '#757575',   // Secondary text
    disabled: '#BDBDBD',    // Disabled text
    inverse: '#FFFFFF',     // White text
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',     // White background
    secondary: '#F5F5F5',   // Light gray background
    tertiary: '#FAFAFA',    // Ultra light background
  },

  // Border Colors
  border: {
    default: '#D9D9D9',     // Default border
    light: '#EEEEEE',       // Light border
    dark: '#BDBDBD',        // Dark border
  },
} as const;

/**
 * Polaris Theme Configuration with Cin7 Branding
 */
export const cin7PolarisTheme = {
  colors: {
    // Surface colors
    surface: cin7Colors.background.primary,
    surfaceHovered: cin7Colors.gray[50],
    surfacePressed: cin7Colors.gray[100],
    surfaceSearchField: cin7Colors.gray[100],
    surfaceSearchFieldDark: cin7Colors.gray[200],

    // Background colors
    backdrop: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.25)',

    // Border colors
    border: cin7Colors.border.default,
    borderHovered: cin7Colors.border.dark,
    borderDisabled: cin7Colors.border.light,
    borderDepressed: cin7Colors.gray[400],
    borderShadow: 'rgba(0, 0, 0, 0.08)',
    borderSubdued: cin7Colors.border.light,

    // Primary action colors (using Hept Blue)
    primary: cin7Colors.heptBlue.main,
    primaryHovered: cin7Colors.heptBlue.dark,
    primaryPressed: cin7Colors.heptBlue.dark,
    primaryDepressed: cin7Colors.heptBlue.dark,

    // Text colors
    text: cin7Colors.text.primary,
    textSubdued: cin7Colors.text.secondary,
    textDisabled: cin7Colors.text.disabled,
    textOnPrimary: cin7Colors.text.inverse,

    // Interactive colors
    interactive: cin7Colors.heptBlue.main,
    interactiveHovered: cin7Colors.heptBlue.dark,
    interactivePressed: cin7Colors.heptBlue.dark,

    // Focused state
    focused: cin7Colors.heptBlue.main,

    // Icon colors
    icon: cin7Colors.gray[700],
    iconSubdued: cin7Colors.gray[500],
    iconDisabled: cin7Colors.gray[400],
    iconOnPrimary: cin7Colors.text.inverse,

    // Critical/Error colors
    critical: cin7Colors.semantic.error.main,
    criticalHovered: cin7Colors.semantic.error.dark,
    criticalPressed: cin7Colors.semantic.error.dark,
    criticalDepressed: cin7Colors.semantic.error.dark,
    criticalSurface: cin7Colors.semantic.error.light,

    // Success colors
    success: cin7Colors.semantic.success.main,
    successSurface: cin7Colors.semantic.success.light,

    // Warning colors
    warning: cin7Colors.semantic.warning.main,
    warningSurface: cin7Colors.semantic.warning.light,

    // Highlight colors (using Transit Yellow for accents)
    highlight: cin7Colors.transitYellow.lighter,
    highlightHovered: cin7Colors.transitYellow.light,

    // Decorative colors
    decorative1: cin7Colors.heptBlue.light,
    decorative2: cin7Colors.transitYellow.main,
    decorative3: cin7Colors.semantic.info.main,
    decorative4: cin7Colors.semantic.success.main,
  },

  // Typography
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: {
      base: '14px',
      small: '12px',
      medium: '14px',
      large: '16px',
      extraLarge: '20px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      base: 1.5,
      tight: 1.25,
      relaxed: 1.75,
    },
  },

  // Spacing
  spacing: {
    extraTight: '4px',
    tight: '8px',
    base: '16px',
    loose: '20px',
    extraLoose: '32px',
  },

  // Border radius
  borderRadius: {
    base: '4px',
    large: '8px',
    full: '9999px',
  },

  // Shadows
  shadow: {
    card: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    popover: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    modal: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  },
};

/**
 * Export individual color values for use in custom components
 */
export const cin7BrandColors = {
  primary: cin7Colors.heptBlue.main,
  secondary: cin7Colors.transitYellow.main,
  success: cin7Colors.semantic.success.main,
  warning: cin7Colors.semantic.warning.main,
  error: cin7Colors.semantic.error.main,
  info: cin7Colors.semantic.info.main,
};

/**
 * CSS Custom Properties for use in stylesheets
 * Import this object and apply to :root or use directly in styled components
 */
export const cin7CSSVariables = {
  '--cin7-hept-blue': cin7Colors.heptBlue.main,
  '--cin7-hept-blue-dark': cin7Colors.heptBlue.dark,
  '--cin7-hept-blue-light': cin7Colors.heptBlue.light,
  '--cin7-hept-blue-lighter': cin7Colors.heptBlue.lighter,

  '--cin7-transit-yellow': cin7Colors.transitYellow.main,
  '--cin7-transit-yellow-dark': cin7Colors.transitYellow.dark,
  '--cin7-transit-yellow-light': cin7Colors.transitYellow.light,
  '--cin7-transit-yellow-lighter': cin7Colors.transitYellow.lighter,

  '--cin7-success': cin7Colors.semantic.success.main,
  '--cin7-success-light': cin7Colors.semantic.success.light,
  '--cin7-warning': cin7Colors.semantic.warning.main,
  '--cin7-warning-light': cin7Colors.semantic.warning.light,
  '--cin7-error': cin7Colors.semantic.error.main,
  '--cin7-error-light': cin7Colors.semantic.error.light,

  '--cin7-text-primary': cin7Colors.text.primary,
  '--cin7-text-secondary': cin7Colors.text.secondary,
  '--cin7-text-disabled': cin7Colors.text.disabled,

  '--cin7-bg-primary': cin7Colors.background.primary,
  '--cin7-bg-secondary': cin7Colors.background.secondary,
  '--cin7-bg-tertiary': cin7Colors.background.tertiary,

  '--cin7-border-default': cin7Colors.border.default,
  '--cin7-border-light': cin7Colors.border.light,
  '--cin7-border-dark': cin7Colors.border.dark,
};

export default cin7PolarisTheme;
