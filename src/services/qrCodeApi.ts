import { API_BASE_URL } from './api';

export interface QRCodeCustomDetails {
  name1?: string;
  name2?: string;
  eventDate: string;
  eventTime: string;
  location: string;
  contact: string;
}

export interface QRCodeData {
  _id: string;
  booking: string;
  qrToken: string;
  status: 'active' | 'inactive' | 'expired';
  expiresAt: string | null;
  scanCount: number;
  isApproved: boolean;
  customDetails: QRCodeCustomDetails;
  selectedBackgroundImage: string;
  generatedAt: string;
  qrCode?: string; // QR code image data URL
  qrCodeImage?: string; // Alternative name for QR code image
  qrUrl?: string; // URL to view QR code details
}

export interface QRCodeSettings {
  displaySettings: {
    showCustomerInfo: boolean;
    showContactInfo: boolean;
    showEventTime: boolean;
    showEventDate: boolean;
    showLocation: boolean;
    showServices: boolean;
    showSpecialRequests: boolean;
    showPrice: boolean;
  };
  qrCodeStyle: {
    size: number;
    errorCorrectionLevel: string;
    margin: number;
  };
  backgroundImages: Array<{
    _id: string;
    name: string;
    filename: string;
    path: string;
    url?: string; // Backend provides this with full URL
    isDefault: boolean;
    isActive: boolean;
    font: {
      family: string;
      color: string;
      size: number;
    };
  }>;
  allowedOccasions: Array<{
    occasion: {
      _id: string;
    };
    allowedCategories: string[];
    isEnabled: boolean;
  }>;
}

export const getQRCodeSettings = async (
  token: string,
): Promise<QRCodeSettings | null> => {
  try {
    // First, try to get the full settings with token (same as client web)
    // This gives us displaySettings and allowedOccasions
    try {
      const settingsEndpoint = `${API_BASE_URL}/qr-codes/settings`;
      const settingsResponse = await fetch(settingsEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (settingsResponse.ok) {
        const fullSettings = await settingsResponse.json();
        // Return full settings - even if no background images, we need allowedOccasions!
        if (fullSettings) {
          return {
            displaySettings: fullSettings.displaySettings || {
              showCustomerInfo: false,
              showContactInfo: true,
              showEventTime: true,
              showEventDate: true,
              showLocation: true,
              showServices: true,
              showSpecialRequests: false,
              showPrice: false,
            },
            qrCodeStyle: fullSettings.qrCodeStyle || {
              size: 300,
              errorCorrectionLevel: 'M',
              margin: 4,
            },
            backgroundImages: fullSettings.backgroundImages || [],
            allowedOccasions: fullSettings.allowedOccasions || [],
          };
        }
      }
    } catch (settingsError) {
      // Silent error handling
    }

    // If full settings failed, try public endpoint for background images
    try {
      const endpoint = `${API_BASE_URL}/qr-codes/public/background-images`;
      const publicResponse = await fetch(endpoint, {
        method: 'GET',
      });
      if (publicResponse.ok) {
        const backgroundImages = await publicResponse.json();
        if (backgroundImages?.length > 0) {
          // Return settings with background images
          // Note: allowedOccasions will be empty - QR buttons won't show without proper settings
          return {
            displaySettings: {
              showCustomerInfo: false,
              showContactInfo: true,
              showEventTime: true,
              showEventDate: true,
              showLocation: true,
              showServices: true,
              showSpecialRequests: false,
              showPrice: false,
            },
            qrCodeStyle: {
              size: 300,
              errorCorrectionLevel: 'M',
              margin: 4,
            },
            backgroundImages: Array.isArray(backgroundImages)
              ? backgroundImages
              : [],
            allowedOccasions: [],
          };
        }
      }
    } catch (publicError) {}
    // Return null if we couldn't get settings - this will prevent false positives
    return null;
  } catch (error) {
    return null;
  }
};

export const getQRCodeByBooking = async (
  token: string,
  bookingId: string,
): Promise<QRCodeData | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/qr-codes/booking/${bookingId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};

export const generateQRCode = async (
  token: string,
  bookingId: string,
  customDetails: QRCodeCustomDetails,
  backgroundImageId: string,
  serviceId?: string,
): Promise<any> => {
  try {
    const payload: any = {
      customDetails,
      selectedBackgroundImageId: backgroundImageId,
    };

    // Add service ID if available (helps with validation)
    if (serviceId) {
      payload.serviceId = serviceId;
    }
    const response = await fetch(
      `${API_BASE_URL}/qr-codes/generate/${bookingId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || 'Failed to generate QR code',
      );
    }

    const result = await response.json();
    // Ensure the result has all necessary fields
    if (!result.qrCode && !result.qrCodeImage) {
    }

    return result;
  } catch (error) {
    throw error;
  }
};

export const fetchServiceDetails = async (
  serviceId: string,
  token: string,
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
};

export const canCreateQRCode = async (
  booking: any,
  settings: QRCodeSettings | null,
  token?: string,
): Promise<boolean> => {
  if (!booking) {
    return false;
  }

  // Check all services in the booking - at least ONE must have allowed occasions
  const services = booking?.services || [];
  if (!services.length) {
    return false;
  }

  // Helper to check if occasion/category is allowed (matching web logic)
  const isOccasionCategoryAllowed = (occasionId: any, categoryId: any): boolean => {
    if (!settings?.allowedOccasions) return false;

    const allowedOccasion = settings.allowedOccasions.find((ao: any) => {
      const aoOccasionId = typeof ao.occasion === 'object' 
        ? ao.occasion?._id 
        : ao.occasion;
      const paramOccasionId = typeof occasionId === 'object' 
        ? occasionId?._id 
        : occasionId;
      return String(aoOccasionId) === String(paramOccasionId) && ao.isEnabled;
    });

    if (!allowedOccasion) return false;

    const allowedCategoryIds = allowedOccasion.allowedCategories || [];

    // If no categories are restricted in settings, it's allowed
    if (allowedCategoryIds.length === 0) return true;

    // If categories are restricted, categoryId must match one of them
    if (!categoryId) return false;

    return allowedCategoryIds.some((id: any) => 
      String(id) === String(categoryId)
    );
  };

  // Check each service to see if ANY has allowed occasions (same logic as web)
  for (const service of services) {
    // Get the service data
    let serviceData =
      typeof service.service === 'string' ? null : service.service;
    const serviceId =
      typeof service.service === 'string'
        ? service.service
        : service.service?._id;

    // If service is not populated and we have a token, try to fetch full details
    if ((!serviceData || !serviceData.occasions) && serviceId && token) {
      serviceData = await fetchServiceDetails(serviceId, token);
    }

    // If no service data, skip this service
    if (!serviceData) {
      continue;
    }

    // Get occasions from service
    const serviceOccasions = serviceData.occasions || [];

    if (!serviceOccasions.length) {
      continue;
    }

    // Check if ANY of this service's occasions is allowed
    for (const svc of serviceOccasions) {
      const serviceOccasionId = typeof svc.occasion === 'object' 
        ? svc.occasion?._id 
        : svc.occasion;
      const categoryId = svc.categoryId;

      if (isOccasionCategoryAllowed(serviceOccasionId, categoryId)) {
        // Found at least one service with allowed occasion/category - allow QR code
        return true;
      }
    }
  }

  // No allowed services found
  return false;
};

export const getDefaultBackgroundImage = (settings: QRCodeSettings) => {
  return (
    settings?.backgroundImages?.find(img => img.isDefault && img.isActive) ||
    settings?.backgroundImages?.[0]
  );
};

export const getQRImageUrl = (qrToken: string): string => {
  // Generate QR code image URL using the token
  return `${API_BASE_URL}/qr-codes/${qrToken}`;
};

export const getBackgroundImageUrl = (imagePath: string): string => {
  // Backend provides direct S3 URLs in path field
  if (!imagePath) {
    return '';
  }
  return imagePath;
};
