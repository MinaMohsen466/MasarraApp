import { Platform } from 'react-native';
import { API_BASE_URL as BASE_URL, API_URL, getImageUrl as getImageUrlFromConfig } from '../config/api.config';

export const API_BASE_URL = API_URL;

// Service cache for avoiding repeated requests
const serviceCache = new Map<string, { data: any; timestamp: number }>();

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

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'vendor';
}

export interface SignupResponse {
  message: string;
  userId: string;
  requiresVerification: boolean;
}

export interface LoginData {
  email: string;
  password: string;
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
 * Login user
 */
export const login = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // If server indicates verification required, throw an Error with extra properties
        if (response.status === 403 && errorData?.requiresVerification) {
          const e: any = new Error(errorData.error || 'Email not verified');
          e.requiresVerification = true;
          e.userId = errorData.userId;
          throw e;
        }
        throw new Error(errorData.error || 'Login failed');
    }

    const responseData: LoginResponse = await response.json();
    return responseData;
  } catch (error) {
    // If this is a verification-required error we avoid logging to console
    if ((error as any)?.requiresVerification) {
      throw error;
    }
    throw error;
  }
};

/**
 * Signup user
 */
export const signup = async (data: SignupData): Promise<SignupResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Signup failed');
    }

    const responseData: SignupResponse = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (token: string, updates: Partial<User>): Promise<{ user: User; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Profile update failed');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile with image
 */
export const updateUserProfileWithImage = async (
  token: string, 
  name: string, 
  phone: string, 
  imageUri?: string
): Promise<{ user: User; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);

    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Profile update failed');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Password change failed');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch addresses for the authenticated user
 */
export const fetchAddresses = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch addresses');
    }

    const responseData = await response.json();
    // server returns { success: true, data: [...] }
    return responseData.data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new address for the authenticated user
 */
export const createAddress = async (token: string, address: { name: string; street: string; houseNumber?: string; floorNumber?: string; city: string; isDefault?: boolean }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create address');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing address
 */
export const updateAddress = async (
  token: string,
  addressId: string,
  address: { name: string; street: string; houseNumber?: string; floorNumber?: string; city: string; isDefault?: boolean }
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update address');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an address
 */
export const deleteAddress = async (token: string, addressId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete address');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (token: string, addressId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to set default address');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Booking availability types and functions
 */
export interface BookingTimeSlot {
  start: string;
  end: string;
}

export interface CustomInput {
  label: string;
  value: string;
  _id?: string;
}

export interface ServiceInfo {
  _id: string;
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  image?: string;
}

export interface VendorInfo {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface BookingService {
  service: string | ServiceInfo;
  vendor: string | VendorInfo;
  price: number;
  quantity: number;
  status: string;
  confirmedAt?: string;
  notes?: string;
  customInputs?: CustomInput[];
  _id: string;
}

export interface Booking {
  _id: string;
  customer: string;
  eventDate: string;
  eventTime: BookingTimeSlot;
  location: string;
  services: BookingService[];
  packages: any[];
  totalPrice: number;
  coupon?: {
    code: string;
    discountAmount: number;
    originalPrice: number;
    deductFrom: string;
    deductionSplit?: {
      adminPercentage: number;
      vendorPercentage: number;
    };
  };
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  guestLimit?: number;
  guests?: any[];
  createdAt: string;
  __v: number;
}

/**
 * Fetch all bookings (for availability checking)
 */
export const fetchBookings = async (token?: string): Promise<Booking[]> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }

    const data: Booking[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch user bookings (for customer order history)
 */
export const getUserBookings = async (token: string): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user bookings: ${response.statusText}`);
    }

    const data: Booking[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Check availability for a specific service/vendor on a date
 */
export const checkDateAvailability = async (
  serviceId: string,
  vendorId: string,
  date: Date,
  token?: string
): Promise<{ available: boolean; bookingsCount: number; slots: number }> => {
  try {
    // Cache service details لتجنب طلبات متكررة
    const cacheKey = `service-${serviceId}`;
    let service: any;
    
    // تحقق من الـ cache أولاً
    const cachedService = serviceCache.get(cacheKey);
    if (cachedService && Date.now() - cachedService.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      service = cachedService.data;
    } else {
      // Fetch service details مع timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const serviceResponse = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!serviceResponse.ok) {
          throw new Error('Failed to fetch service details');
        }
        service = await serviceResponse.json();
        
        // حفظ في الـ cache
        serviceCache.set(cacheKey, {
          data: service,
          timestamp: Date.now()
        });
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    
    // Extract configuration from service
    const workingHours = service.workingHours || { start: '09:00', end: '17:00' };
    const timeSlotDuration = service.timeSlotDuration || 60; // in minutes
    const maxBookingsPerSlot = service.maxBookingsPerSlot || 1;
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
    
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
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
        `${BASE_URL}/api/bookings/available-timeslots?serviceId=${serviceId}&date=${dateStr}`,
        {
          signal: controller.signal,
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Fallback: assume all slots available
        return {
          available: true,
          bookingsCount: 0,
          slots: totalSlotsPerDay
        };
      }

      const availabilityData = await response.json();

      // Use allSlots array from the API response
      const allSlots = availabilityData.allSlots || availabilityData.availableSlots || [];
      
      // Count available slots
      const availableSlots = allSlots.filter((slot: any) => slot.isAvailable !== false).length;
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
  } catch (error) {
    return { available: true, bookingsCount: 0, slots: 10 }; // Default to available on error
  }
};

/**
 * Check time slot availability for a specific date
 */
export const checkTimeSlotAvailability = async (
  serviceId: string,
  vendorId: string,
  date: Date,
  token?: string
): Promise<{ 
  timeSlot: string; 
  available: boolean; 
  bookingsCount: number;
  isAvailable?: boolean;
  availableSpots?: number;
  totalSpots?: number;
}[]> => {
  try {
    // Use the backend API to get available time slots
    // Format date as YYYY-MM-DD using UTC date values to ensure consistency
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const response = await fetch(
      `${BASE_URL}/api/bookings/available-timeslots?serviceId=${serviceId}&date=${dateStr}`,
      {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Failed to fetch available time slots');
    }

    const data = await response.json();
    
    // Transform the backend response to match the expected format
    // Use allSlots to get both available and unavailable slots
    const slots = (data.allSlots || data.availableSlots || []).map((slot: any) => {
      // Format time from UTC Date objects to Kuwait time (UTC+3)
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      
      // Format as "HH:MM - HH:MM" in Kuwait time
      // We get UTC hours and add 3 to convert to Kuwait time (UTC+3)
      const formatTime = (date: Date) => {
        const utcHours = date.getUTCHours();
        const kuwaitHours = (utcHours + 3) % 24; // Add 3 hours for Kuwait timezone
        const hours = kuwaitHours.toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      const timeSlotStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      
      const slotData = {
        timeSlot: timeSlotStr,
        available: slot.isAvailable === true,
        bookingsCount: slot.totalSpots - (slot.availableSpots || 0),
        isAvailable: slot.isAvailable,
        availableSpots: slot.availableSpots,
        totalSpots: slot.totalSpots
      };
      
      return slotData;
    });

    return slots;
  } catch (error) {
    return [];
  }
};

/**
 * Submit contact request
 */
export interface ContactRequestData {
  title: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

export const submitContactRequest = async (data: ContactRequestData, token?: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
