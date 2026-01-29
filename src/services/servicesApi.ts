import { Platform } from 'react-native';
import {
  API_URL,
  API_BASE_URL as BASE_URL,
  getImageUrl,
} from '../config/api.config';

// Use the centralized API_URL
const API_BASE_URL = API_URL;

export interface PolicyDescription {
  text: string;
  textAr: string;
  _id: string;
}

export interface Policy {
  policy: {
    _id: string;
    name: string;
    nameAr: string;
    image?: string;
    descriptions: PolicyDescription[];
    isActive: boolean;
  };
  _id: string;
}

export interface Service {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  discountPercentage?: number;
  isOnSale?: boolean;
  bookingType?: 'limited' | 'unlimited';
  images: string[];
  vendor: {
    _id: string;
    name: string;
  };
  occasions: Array<{
    occasion: {
      _id: string;
      name: string;
    };
  }>;
  rating: number;
  totalReviews: number;
  isFeatured: boolean;
  customInputs?: any[];
  policies?: Policy[];
  timeSlotDuration?: number;
  workingHours?: {
    start: string;
    end: string;
  };
  workingDays?: number[];
  availabilityStatus?: 'available_now' | 'pending_confirmation';
  maxBookingsPerSlot?: number; // -1 means unlimited bookings per slot
  deliveryFee?: number; // Delivery fee from database
}


/**
 * Fetch all services
 */
export const fetchServices = async (): Promise<Service[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Debug: Log discount info for Birthday Party Catering
    const birthdayCatering = data.find(
      (s: any) => s.name === 'Birthday Party Catering',
    );
    if (birthdayCatering) {
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get full image URL for service image
 */
export const getServiceImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Use the centralized getImageUrl function
  return getImageUrl(imagePath);
};

/**
 * Paginated services response from server
 */
export interface PaginatedServicesResponse {
  services: Service[];
  total: number;
  pages: number;
  currentPage: number;
}

/**
 * Filters for fetching services
 */
export interface ServiceFilters {
  page?: number;
  limit?: number;
  occasionId?: string;
  categoryId?: string;
  search?: string;
  isOnSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Fetch services with pagination and filters
 */
export const fetchServicesWithPagination = async (
  filters: ServiceFilters = {},
): Promise<PaginatedServicesResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.occasionId) params.append('occasionId', filters.occasionId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.search) params.append('search', filters.search);
    if (filters.isOnSale) params.append('isOnSale', 'true');
    if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    params.append('isActive', 'true');

    const response = await fetch(`${API_BASE_URL}/services?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
