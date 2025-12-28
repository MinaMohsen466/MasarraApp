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
        // If we got full settings with background images, return it
        if (
          fullSettings.backgroundImages &&
          fullSettings.backgroundImages.length > 0
        ) {
          return fullSettings;
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
    } catch (publicError) {
    }
    // Return minimal settings
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
      backgroundImages: [],
      allowedOccasions: [],
    };
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

  // Get the first service from booking
  const service = booking?.services?.[0];
  if (!service) {
    return false;
  }

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

  // If still no service data, return false
  if (!serviceData) {
    return false;
  }

  // Get occasions from service
  const serviceOccasions = serviceData.occasions || [];

  if (!serviceOccasions.length) {
    return false;
  }

  // If we have settings with allowedOccasions, use them (from full API call)
  if (settings?.allowedOccasions && settings.allowedOccasions.length > 0) {
    // Get enabled allowed occasions
    const enabledAllowedOccasionIds = settings.allowedOccasions
      .filter(ao => ao.isEnabled)
      .map(ao => ao.occasion._id);
    // Check if ANY of the service's occasions match the enabled allowed ones
    const hasAllowedOccasion = serviceOccasions.some((svc: any) => {
      const serviceOccasionId = svc.occasion?._id || svc.occasion;
      return (
        serviceOccasionId &&
        enabledAllowedOccasionIds.includes(String(serviceOccasionId))
      );
    });

    if (hasAllowedOccasion) {
      // QR code allowed
    } else {
    }

    return hasAllowedOccasion;
  }

  // Fallback: if no settings available, allow QR code creation
  // Backend will validate properly when actually generating
  return true;
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
