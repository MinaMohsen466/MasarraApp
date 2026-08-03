/**
 * Month-level date-availability cache for the booking calendar.
 *
 * These entries used to live inside DatePickerModal with no expiry at all, so a
 * day another customer had just booked kept rendering as free until the app was
 * restarted. They now expire on the same window as the time-slot cache, and they
 * live outside the component so `clearApiCaches` can drop them on logout without
 * a service module having to import a screen.
 */

export interface DayAvailability {
  available: boolean;
  slots: number;
}

export type MonthAvailability = Map<string, DayAvailability>;

interface CacheEntry {
  data: MonthAvailability;
  timestamp: number;
}

const availabilityCache = new Map<string, CacheEntry>();

// Availability is contended data that other customers change under us — keep
// this in step with TIME_SLOTS_CACHE_TTL in apiUtils so the calendar and the
// slot list can't disagree about the same day.
export const AVAILABILITY_CACHE_TTL = 2 * 60 * 1000;

/**
 * Cached availability for a month key, or undefined if absent/expired.
 */
export const getCachedAvailability = (
  key: string,
): MonthAvailability | undefined => {
  const entry = availabilityCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > AVAILABILITY_CACHE_TTL) {
    availabilityCache.delete(key);
    return undefined;
  }
  return entry.data;
};

export const setCachedAvailability = (
  key: string,
  data: MonthAvailability,
): void => {
  availabilityCache.set(key, { data, timestamp: Date.now() });
};

/**
 * Drop every cached month for one service+vendor — called right after a booking
 * is created, since the day the user just took is no longer as free as cached.
 */
export const clearAvailabilityForService = (
  serviceId: string,
  vendorId: string,
): void => {
  const prefix = `${serviceId}-${vendorId}`;
  Array.from(availabilityCache.keys())
    .filter(key => key.startsWith(prefix))
    .forEach(key => availabilityCache.delete(key));
};

export const clearAvailabilityCache = (): void => {
  availabilityCache.clear();
};
