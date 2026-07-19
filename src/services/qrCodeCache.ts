/**
 * Simple in-memory cache for QR Code API results.
 * Prevents redundant network calls when navigating back to MyEvents or OrderHistory.
 */

import { QRCodeData } from './qrCodeApi';

interface CacheEntry {
  data: QRCodeData | null;
  timestamp: number;
}

const qrCodeCache = new Map<string, CacheEntry>();

// Cache duration: 3 minutes
const CACHE_DURATION = 3 * 60 * 1000;

/**
 * Get a cached QR code result for a booking, or null if not cached / expired.
 */
export const getCachedQRCode = (bookingId: string): QRCodeData | null | undefined => {
  const entry = qrCodeCache.get(bookingId);
  if (!entry) return undefined; // undefined = not cached
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    qrCodeCache.delete(bookingId);
    return undefined; // expired
  }
  return entry.data; // null = cached "no QR code"
};

/**
 * Store a QR code result in cache.
 */
export const setCachedQRCode = (bookingId: string, data: QRCodeData | null): void => {
  qrCodeCache.set(bookingId, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Invalidate cache for a specific booking (e.g., after QR code is created/updated).
 */
export const invalidateQRCodeCache = (bookingId: string): void => {
  qrCodeCache.delete(bookingId);
};

/**
 * Clear the entire QR code cache.
 */
export const clearQRCodeCache = (): void => {
  qrCodeCache.clear();
};
