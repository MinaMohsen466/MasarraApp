import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api.config';

// Base URL for API requests
const baseUrl = API_BASE_URL;

export interface VendorProfile {
  rating: number;
  totalReviews: number;
  businessName?: string;
  businessName_ar?: string;
  description?: string;
  description_ar?: string;
  profilePicture?: string;
  location?: string;
  location_ar?: string;
}

export interface Vendor {
  _id: string;
  name: string;
  email: string;
  vendorProfile: VendorProfile;
  createdAt: string;
  image?: string; // Optional for future backend image support
  profilePicture?: string; // Vendor profile picture from server
}

/**
 * Fetch all vendors from the API
 */
export const fetchVendors = async (): Promise<Vendor[]> => {
  try {
    const response = await fetch(`${baseUrl}/api/vendors`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vendors: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get default vendor image URL
 * Returns a placeholder image until backend provides vendor images
 */
export const getDefaultVendorImage = (): string => {
  // Using a simple colored placeholder that matches the app theme
  return 'https://via.placeholder.com/150/00a19c/FFFFFF?text=Vendor';
};

/**
 * Get vendor image URL (prioritizes vendor.image if available, else default)
 */
export const getVendorImageUrl = (vendor: Vendor): string => {
  if (vendor.image) {
    return `${baseUrl}/public/${vendor.image}`;
  }
  return getDefaultVendorImage();
};
