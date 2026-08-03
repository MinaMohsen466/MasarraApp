import { API_URL } from './../config/api.config';

// Base URL for API requests
const baseUrl = API_URL;

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
  const response = await fetch(`${baseUrl}/vendors`);

  if (!response.ok) {
    throw new Error(`Failed to fetch vendors: ${response.statusText}`);
  }

  const data = await response.json();
  // API may return a wrapper object { vendors, total, pages, currentPage }
  // Normalize to return an array of vendors as expected by the hook.
  if (data && Array.isArray(data.vendors)) {
    return data.vendors as Vendor[];
  }
  if (Array.isArray(data)) {
    return data as Vendor[];
  }
  return [] as Vendor[];
};
