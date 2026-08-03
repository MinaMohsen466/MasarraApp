/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_URL } from '../config/api.config';
import { clearAvailabilityCache } from './availabilityCache';
import { clearQRCodeCache } from './qrCodeCache';

export const API_BASE_URL = API_URL;

// Time slots cache for faster time selection
export const timeSlotsCache = new Map<
  string,
  { data: any[]; timestamp: number }
>();

// Kept equal to AVAILABILITY_CACHE_TTL: the calendar and the slot list describe
// the same availability, so they must not expire on different clocks.
export const TIME_SLOTS_CACHE_TTL = 2 * 60 * 1000;

/**
 * Drop cached time slots for one service across every date. Called after a
 * booking is created — the slot the user just took must not keep showing as
 * available for the rest of the TTL.
 */
export const clearTimeSlotsForService = (serviceId: string) => {
  const prefix = `timeslots-${serviceId}-`;
  Array.from(timeSlotsCache.keys())
    .filter(key => key.startsWith(prefix))
    .forEach(key => timeSlotsCache.delete(key));
};

/**
 * Clear all local memory caches (called on user logout).
 * Every in-memory cache in the app belongs here — the QR-code cache holds the
 * signed-in user's own booking passes, so leaving it behind would carry them
 * into the next session on a shared device.
 */
export const clearApiCaches = () => {
  timeSlotsCache.clear();
  clearAvailabilityCache();
  clearQRCodeCache();
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
