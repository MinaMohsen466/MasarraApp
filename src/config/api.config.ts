import { Platform } from 'react-native';

/**
 * API Configuration
 * Change LOCAL_IP to your computer's IP address
 * - For Android Emulator: Use 10.0.2.2
 * - For iOS Simulator: Use localhost or 127.0.0.1
 * - For Real Device: Use your computer's local IP (e.g., 192.168.1.127)
 */

// 🔧 CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
export const LOCAL_IP = '192.168.1.127'; // Real device IP

/**
 * Get the appropriate base URL based on platform
 * Android Emulator uses 10.0.2.2
 * Real devices use the local network IP
 */
export const getBaseUrl = (): string => {
  // Only use 10.0.2.2 for Android in debug mode (not for APK release)
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:3000';
  }
  // For real devices and APK builds, use LOCAL_IP
  return `http://${LOCAL_IP}:3000`;
};

// Base URLs for API
export const API_BASE_URL = getBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const ADMIN_URL = `${API_BASE_URL}/admin`;

/**
 * Helper function to get full image URL
 * @param imagePath - The image path from the database (can be full URL, /public/ path, or just filename)
 * @returns Full URL to the image
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /public/, use it as is
  if (imagePath.startsWith('/public/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If it starts with public/ (without leading slash), add the slash
  if (imagePath.startsWith('public/')) {
    return `${API_BASE_URL}/${imagePath}`;
  }
  
  // Otherwise, assume it's just a filename and add /public/ prefix
  return `${API_BASE_URL}/public/${imagePath}`;
};
