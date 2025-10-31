/**
 * Legacy Cin7 Brand Colors
 * Note: This file is deprecated. Please use /config/cin7-polaris-theme.ts instead.
 */

// Cin7 Brand Colors (Legacy)
export const cin7Colors = {
  // Primary brand colors
  primary: '#0066CC',        // Cin7 Blue (Legacy - use cin7-polaris-theme.ts instead)
  primaryDark: '#004999',    // Darker blue for hover states
  primaryLight: '#3385D6',   // Lighter blue for backgrounds

  // Secondary colors
  secondary: '#00A651',      // Cin7 Green (success)
  warning: '#FF9800',        // Orange for warnings
  error: '#D32F2F',          // Red for errors
  info: '#2196F3',           // Info blue

  // Neutral colors
  neutral: '#6B7280',        // Gray for neutral badges

  // Background colors
  surface: '#FFFFFF',
  surfaceSubdued: '#F9FAFB',
  background: '#F3F4F6',
};

// Polaris theme name (use built-in themes)
// For custom theming, use CSS custom properties in cin7-polaris-theme.ts
export const cin7Theme = 'light';

export default cin7Theme;
