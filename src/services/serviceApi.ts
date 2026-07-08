/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, parseJsonResponse, serviceCache, timeSlotsCache } from './apiUtils';
import { getImageUrl as getImageUrlFromConfig } from '../config/api.config';

export interface SiteSettings {
  _id: string;
  siteTitle: string;
  footerText: string;
  headerLogo: string;
  footerLogo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  updatedAt: string;
  __v: number;
  footerTextAr?: string;
  bannerEnabled?: boolean;
  bannerText?: string;
  bannerTextAr?: string;
  activeCoupons?: Array<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  }>;
}

export interface Occasion {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categories: string[];
  isActive: boolean;
  image: string;
  services: string[];
  createdAt: string;
  __v: number;
}

export interface ContactRequestData {
  title: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

/**
 * Fetch site settings including logos and titles
 */
export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/site`);

    if (!response.ok) {
      throw new Error(`Failed to fetch site settings: ${response.statusText}`);
    }

    const data: SiteSettings = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch all occasions
 */
export const fetchOccasions = async (): Promise<Occasion[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/occasions`);

    if (!response.ok) {
      throw new Error(`Failed to fetch occasions: ${response.statusText}`);
    }

    const data: Occasion[] = await response.json();
    return data.filter(occasion => occasion.isActive); // Only return active occasions
  } catch (error) {
    throw error;
  }
};

/**
 * Get full URL for an image path
 */
export const getImageUrl = getImageUrlFromConfig;

/**
 * Fetch all active packages
 */
export const fetchPackages = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/packages`);

    if (!response.ok) {
      throw new Error(`Failed to fetch packages: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.filter(p => p.isActive !== false) : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch services for a specific vendor
 */
export const fetchVendorServices = async (vendorId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/vendor/${vendorId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch vendor services: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch single service details
 */
export const fetchServiceDetails = async (serviceId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch service details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch single vendor details
 */
export const fetchVendorDetails = async (vendorId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch vendor details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch services by occasion ID
 */
export const fetchOccasionServices = async (occasionId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/occasion/${occasionId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch occasion services: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Check availability for a specific service/vendor on a date
 */
export const checkDateAvailability = async (
  serviceId: string,
  _vendorId: string,
  date: Date,
  token?: string,
): Promise<{ available: boolean; bookingsCount: number; slots: number }> => {
  try {
    // Cache service details لتجنب طلبات متكررة
    const cacheKey = `service-${serviceId}`;
    let service: any;

    // تحقق من الـ cache أولاً
    const cachedService = serviceCache.get(cacheKey);
    if (cachedService && Date.now() - cachedService.timestamp < 5 * 60 * 1000) {
      // 5 minutes cache
      service = cachedService.data;
    } else {
      // Fetch service details مع timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const serviceResponse = await fetch(
          `${API_BASE_URL}/services/${serviceId}`,
          {
            signal: controller.signal,
          },
        );
        clearTimeout(timeoutId);

        if (!serviceResponse.ok) {
          throw new Error('Failed to fetch service details');
        }
        service = await serviceResponse.json();

        // حفظ في الـ cache
        serviceCache.set(cacheKey, {
          data: service,
          timestamp: Date.now(),
        });
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    // Extract configuration from service
    const workingHours = service.workingHours || {
      start: '09:00',
      end: '17:00',
    };
    const timeSlotDuration = service.timeSlotDuration || 60; // in minutes
    const workingDays = service.workingDays || [1, 2, 3, 4, 5]; // Mon-Fri by default

    // Check if the selected date is a working day
    const dayOfWeek = date.getUTCDay();
    if (!workingDays.includes(dayOfWeek)) {
      // Not a working day
      return { available: false, bookingsCount: 0, slots: 0 };
    }

    // Calculate total slots based on working hours and time slot duration
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    const totalMinutes =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);
    const totalSlotsPerDay = Math.floor(totalMinutes / timeSlotDuration);
    // Fetch bookings from backend API for this specific date and service
    // Format date as YYYY-MM-DD using UTC to ensure consistency
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // مع timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/available-timeslots?serviceId=${serviceId}&date=${dateStr}`,
        {
          signal: controller.signal,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            : {
                'Content-Type': 'application/json',
              },
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Fallback: assume all slots available
        return {
          available: true,
          bookingsCount: 0,
          slots: totalSlotsPerDay,
        };
      }

      const availabilityData = await response.json();

      // Use allSlots array from the API response
      const allSlots =
        availabilityData.allSlots || availabilityData.availableSlots || [];

      // Count available slots
      const availableSlots = allSlots.filter(
        (slot: any) => slot.isAvailable !== false,
      ).length;
      const bookedSlots = allSlots.length - availableSlots;

      return {
        available: availableSlots > 0,
        bookingsCount: bookedSlots,
        slots: availableSlots,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { available: true, bookingsCount: 0, slots: totalSlotsPerDay };
      }
      clearTimeout(timeoutId);
      throw error;
    }
  } catch {
    return { available: true, bookingsCount: 0, slots: 10 }; // Default to available on error
  }
};

/**
 * Check time slot availability for a specific date
 */
export const checkTimeSlotAvailability = async (
  serviceId: string,
  _vendorId: string,
  date: Date,
  token?: string,
): Promise<
  {
    timeSlot: string;
    available: boolean;
    bookingsCount: number;
    isAvailable?: boolean;
    availableSpots?: number;
    totalSpots?: number;
  }[]
> => {
  try {
    // Use the backend API to get available time slots
    // Format date as YYYY-MM-DD using UTC date values to ensure consistency
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Check cache first
    const cacheKey = `timeslots-${serviceId}-${dateStr}`;
    const cachedData = timeSlotsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 2 * 60 * 1000) {
      // 2 minutes cache
      return cachedData.data;
    }

    // Add timeout for faster response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `${API_BASE_URL}/bookings/available-timeslots?serviceId=${serviceId}&date=${dateStr}`,
      {
        signal: controller.signal,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          : {
              'Content-Type': 'application/json',
            },
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch available time slots');
    }

    const data = await response.json();

    // Transform the backend response to match the expected format
    // Use allSlots to get both available and unavailable slots
    const slots = (data.allSlots || data.availableSlots || []).map(
      (slot: any) => {
        // Format time from UTC Date objects to Kuwait time (UTC+3)
        const startTime = new Date(slot.start);
        const endTime = new Date(slot.end);

        // Format as "HH:MM - HH:MM" in Kuwait time
        // We get UTC hours and add 3 to convert to Kuwait time (UTC+3)
        const formatTime = (d: Date) => {
          const utcHours = d.getUTCHours();
          const kuwaitHours = (utcHours + 3) % 24; // Add 3 hours for Kuwait timezone
          const hours = kuwaitHours.toString().padStart(2, '0');
          const minutes = d.getUTCMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        };

        const timeSlotStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;

        const slotData = {
          timeSlot: timeSlotStr,
          available: slot.isAvailable === true,
          bookingsCount: slot.totalSpots - (slot.availableSpots || 0),
          isAvailable: slot.isAvailable,
          availableSpots: slot.availableSpots,
          totalSpots: slot.totalSpots,
        };

        return slotData;
      },
    );

    // Cache the result
    timeSlotsCache.set(cacheKey, {
      data: slots,
      timestamp: Date.now(),
    });

    return slots;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Time slots request timed out');
    }
    return [];
  }
};

/**
 * Check availability for multiple dates at once (batch request)
 */
export const checkBatchDateAvailability = async (
  serviceId: string,
  vendorId: string,
  dates: Date[],
  token?: string,
): Promise<
  Map<string, { available: boolean; bookingsCount: number; slots: number }>
> => {
  try {
    const dateStrings = dates.map(date => {
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = date.getUTCDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/batch-availability`,
        {
          method: 'POST',
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            : {
                'Content-Type': 'application/json',
              },
          body: JSON.stringify({
            serviceIds: [serviceId],
            dates: dateStrings,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Batch availability request failed');
      }

      const data = await response.json();
      const availabilityMap = new Map<
        string,
        { available: boolean; bookingsCount: number; slots: number }
      >();

      if (data.availability && data.availability[serviceId]) {
        const serviceAvailability = data.availability[serviceId];
        for (const [dateStr, info] of Object.entries(serviceAvailability)) {
          const availInfo = info as {
            hasSlots: boolean;
            availableSlots: number;
          };
          availabilityMap.set(dateStr, {
            available: availInfo.hasSlots,
            bookingsCount: 0,
            slots: availInfo.availableSlots === -1 ? 99 : availInfo.availableSlots,
          });
        }
      }

      return availabilityMap;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Batch availability failed, falling back to individual requests');
      throw error;
    }
  } catch {
    try {
      const results = await Promise.all(
        dates.map(async date => {
          try {
            const result = await checkDateAvailability(
              serviceId,
              vendorId,
              date,
              token,
            );
            const dateKey = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getUTCDate()
              .toString()
              .padStart(2, '0')}`;
            return { dateKey, ...result };
          } catch {
            const dateKey = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getUTCDate()
              .toString()
              .padStart(2, '0')}`;
            return { dateKey, available: false, bookingsCount: 0, slots: 0 };
          }
        }),
      );

      const availabilityMap = new Map<
        string,
        { available: boolean; bookingsCount: number; slots: number }
      >();
      results.forEach(({ dateKey, available, bookingsCount, slots }) => {
        availabilityMap.set(dateKey, { available, bookingsCount, slots });
      });

      return availabilityMap;
    } catch {
      return new Map();
    }
  }
};

/**
 * Submit contact request
 */
export const submitContactRequest = async (
  data: ContactRequestData,
  token?: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit contact request');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Submit vendor application
 */
export const submitVendorApplication = async (
  name: string,
  email: string,
  phone: string,
  businessLicenseUri: string,
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);

    const filename = businessLicenseUri.split('/').pop() || 'license.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('businessLicense', {
      uri: businessLicenseUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/vendor-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(responseData?.message || 'Failed to submit application');
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};
