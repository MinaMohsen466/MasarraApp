import { API_URL, getImageUrl } from '../config/api.config';

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

export interface CustomInputOption {
  label: string;
  labelAr?: string;
  price?: number;
  value?: string | number;
  valueAr?: string | number;
}

export interface CustomInput {
  _id?: string;
  type: string;
  label: string;
  labelAr?: string;
  placeholder?: string;
  placeholderAr?: string;
  required?: boolean;
  options?: CustomInputOption[];
  validation?: {
    min?: number;
    max?: number;
  };
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
  customInputs?: CustomInput[];
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
  hidePrice?: boolean; // Hide pricing flag
}

/**
 * Fetch all services
 */
export const fetchServices = async (): Promise<Service[]> => {
  const response = await fetch(`${API_BASE_URL}/services`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: Service[] = await response.json();

  // Debug: Log discount info for Birthday Party Catering
  const birthdayCatering = data.find(
    (s: Service) => s.name === 'Birthday Party Catering',
  );
  if (birthdayCatering) {
  }

  return data;
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
 * Fetch a single service by ID
 */
export const fetchServiceById = async (id: string): Promise<Service> => {
  const response = await fetch(`${API_BASE_URL}/services/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};
