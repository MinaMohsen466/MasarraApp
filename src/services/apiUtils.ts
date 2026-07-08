/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  API_URL,
} from '../config/api.config';

export const API_BASE_URL = API_URL;

// Service cache for avoiding repeated requests
export const serviceCache = new Map<string, { data: any; timestamp: number }>();
// Time slots cache for faster time selection
export const timeSlotsCache = new Map<string, { data: any[]; timestamp: number }>();

/**
 * Clear all local memory caches (called on user logout)
 */
export const clearApiCaches = () => {
  serviceCache.clear();
  timeSlotsCache.clear();
};

/**
 * Helper function to safely parse JSON responses
 * Handles cases where server returns non-JSON text
 */
export const parseJsonResponse = async (response: Response): Promise<any> => {
  const responseText = await response.text();

  if (!responseText || responseText.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    // If parsing fails, return the text as error message
    throw new Error(responseText || 'Invalid response from server');
  }
};

export interface User {
  id: string;
  _id?: string; // MongoDB _id field
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'vendor' | 'customer';
  profilePicture?: string;
  adminPermissions?: {
    canManageUsers?: boolean;
    canViewAnalytics?: boolean;
    canViewCommissions?: boolean;
    canManageServices?: boolean;
    canManageOccasions?: boolean;
    canManagePackages?: boolean;
    canManageSettings?: boolean;
  };
}
