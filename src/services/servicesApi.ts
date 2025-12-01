import { Platform } from 'react-native';
import { API_URL, API_BASE_URL as BASE_URL, getImageUrl } from '../config/api.config';

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
