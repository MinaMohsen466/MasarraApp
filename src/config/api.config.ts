import { Platform } from 'react-native';

/**
 * API Configuration
 * Change LOCAL_IP to your computer's IP address
 * - For Android Emulator: Use 10.0.2.2
 * - For iOS Simulator: Use localhost or 127.0.0.1
 * - For Real Device: Use your computer's local IP (e.g., 192.168.1.127)
 */

// 🔧 Production Server Configuration
export const PRODUCTION_URL = 'https://masarrakw.com';
export const LOCAL_IP = '192.168.1.190'; // For local development only

// Set to true to use local server in development, false to always use AWS
const USE_LOCAL_IN_DEV = false;

/**
 * Get the appropriate base URL based on platform
 * - Production: Uses masarrakw.com
 * - Development (Android Emulator): Uses 10.0.2.2:3000
 * - Development (Real Device): Uses local IP
 */
export const getBaseUrl = (): string => {
  // Always use production server if USE_LOCAL_IN_DEV is false
  if (!USE_LOCAL_IN_DEV) {
    return PRODUCTION_URL;
  }

  // In production/release mode, always use the production server
  if (!__DEV__) {
    return PRODUCTION_URL;
  }

  // In development mode only (if USE_LOCAL_IN_DEV is true):
  // Android Emulator uses 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // iOS Simulator and real devices in dev mode use local IP
  return `http://${LOCAL_IP}:3000`;
};

// Base URLs for API
export const API_BASE_URL = getBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const ADMIN_URL = `${API_BASE_URL}/admin`;

/**
 * Get the appropriate web client URL based on environment
 */
export const getWebUrl = (): string => {
  // Always use production server if USE_LOCAL_IN_DEV is false
  if (!USE_LOCAL_IN_DEV) {
    return PRODUCTION_URL;
  }

  // In production/release mode, always use the production server
  if (!__DEV__) {
    return PRODUCTION_URL;
  }

  // In development mode (if USE_LOCAL_IN_DEV is true):
  return `http://${LOCAL_IP}:5173`;
};

/**
 * Helper function to get full image URL
 * @param imagePath - The image path from the database (can be full URL, /public/ path, or just filename)
 * @param bustCache - If true, adds timestamp to URL to bypass cache (useful for profile pictures)
 * @returns Full URL to the image
 */
export const getImageUrl = (
  imagePath: string,
  bustCache: boolean = false,
): string => {
  if (!imagePath) return '';

  let url = '';
  let existingParams = '';

  // Extract existing query parameters (like ?updated=timestamp from AuthContext)
  const paramIndex = imagePath.indexOf('?');
  let basePath = imagePath;
  if (paramIndex !== -1) {
    basePath = imagePath.substring(0, paramIndex);
    existingParams = imagePath.substring(paramIndex);
  }

  // If it's already a full URL, use as is
  if (basePath.startsWith('http://') || basePath.startsWith('https://')) {
    return imagePath; // Keep full URL with its parameters intact
  }
  // If it starts with /public/, use it as is
  else if (basePath.startsWith('/public/')) {
    url = `${API_URL}${basePath}`;
  }
  // If it starts with public/ (without leading slash), add the slash
  else if (basePath.startsWith('public/')) {
    url = `${API_URL}/${basePath}`;
  }
  // Otherwise, assume it's just a filename and add /public/ prefix
  else {
    url = `${API_URL}/public/${basePath}`;
  }

  // Append existing parameters first (like ?updated=timestamp from AuthContext)
  url = url + existingParams;

  // Add timestamp to bust cache if requested (useful for profile pictures that may be updated)
  if (bustCache) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}t=${Date.now()}`;
  }

  return url;
};

/**
 * Rewrites an image URL to the ~500px thumbnail stored beside it (written by
 * uploadBuffer in server/utils/s3.js, and by scripts/backfillThumbnails.js for
 * anything uploaded before that existed).
 *
 * Worth it because the full variants are sized for detail views, not cards: a
 * vendor profile picture measured 317KB / ~1.5s on production for a tile drawn
 * at ~90px.
 *
 * Any image whose thumbnail is still missing answers 403, so every caller needs
 * an onError fallback to the full URL — that fallback costs an extra round trip,
 * which is why the backfill script should be run before shipping this.
 */
export const toThumbUrl = (url: string): string => {
  if (!url) return url;
  // Split the query string off first: getImageUrl can append ?updated=… for
  // profile pictures, and matching the extension against the whole string
  // would then never hit.
  const queryIndex = url.indexOf('?');
  const base = queryIndex === -1 ? url : url.substring(0, queryIndex);
  const params = queryIndex === -1 ? '' : url.substring(queryIndex);
  if (!base.endsWith('.webp')) return url;
  return `${base.replace(/\.webp$/, '-thumb.webp')}${params}`;
};

/** Convenience wrapper: resolve a stored path straight to its thumbnail. */
export const getThumbUrl = (imagePath: string): string =>
  toThumbUrl(getImageUrl(imagePath));
