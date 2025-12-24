/**
 * Color Palette for Masarra App
 * Centralized color definitions for consistent theming
 */

export const colors = {
  // Primary Colors
  primary: '#00a19c', // Teal (main brand color)
  primaryLight: '#B8D4D3', // Light teal (backgrounds)
  primaryDark: '#1F4644', // Dark teal (emphasis)

  // Background Colors
  background: '#cedfd7', // Light green background (same as home)
  backgroundLight: '#cedfd7', // Light green background (same as home)
  backgroundHome: '#cedfd7', // Light green background for home
  backgroundCard: '#deece8ff', // Very light background for cards
  overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay

  // Text Colors
  textPrimary: '#2C5F5D', // Primary text color (teal)
  textSecondary: '#666666', // Secondary text color (gray)
  textLight: '#999999', // Light text color
  textDark: '#000000', // Dark text color
  textWhite: '#FFFFFF', // White text

  // Border Colors
  border: 'rgba(44, 95, 93, 0.15)', // Light border
  borderMedium: 'rgba(44, 95, 93, 0.2)', // Medium border
  borderDark: 'rgba(44, 95, 93, 0.3)', // Dark border

  // Status Colors
  success: '#4CAF50', // Success green
  error: '#F44336', // Error red
  warning: '#FF9800', // Warning orange
  info: '#2196F3', // Info blue

  // Shadow Colors
  shadow: '#000000', // Shadow color
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.3)',

  // Transparent
  transparent: 'transparent',
};

/**
 * Color Utilities
 */
export const colorUtils = {
  /**
   * Add opacity to a hex color
   * @param hex - Hex color string (e.g., '#2C5F5D')
   * @param opacity - Opacity value between 0 and 1
   * @returns RGBA color string
   */
  addOpacity: (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
};

export default colors;
