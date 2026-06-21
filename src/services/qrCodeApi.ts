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
  updateTimestamp?: number; // Timestamp of when QR was updated/loaded locally
}

export interface QRCodeSettings {
  isEnabled?: boolean;
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
          isEnabled: fullSettings.isEnabled,
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
          isEnabled: false,
        };
      }
    }
  } catch (publicError) {}
  // Return null if we couldn't get settings - this will prevent false positives
  return null;
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
  guestLimit?: number,
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

    // Add guestLimit if available
    if (typeof guestLimit !== 'undefined') {
      payload.guestLimit = guestLimit;
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
  _token?: string,
): Promise<boolean> => {
  if (!booking) {
    return false;
  }
  if (!settings || !settings.isEnabled) {
    return false;
  }

  // Helper to compare ObjectIds as strings
  const matchesId = (id1: any, id2: any) => {
    const str1 =
      typeof id1 === 'object'
        ? id1?._id?.toString() || id1?.toString()
        : id1?.toString();
    const str2 =
      typeof id2 === 'object'
        ? id2?._id?.toString() || id2?.toString()
        : id2?.toString();
    return str1 === str2;
  };

  // Helper to check if a specific occasion/category pair is allowed
  const isOccasionCategoryAllowed = (occasionId: any, categoryId: any) => {
    if (!settings.allowedOccasions) return false;

    const allowedOccasion = settings.allowedOccasions.find(
      (ao: any) =>
        matchesId(ao.occasion?._id || ao.occasion, occasionId) && ao.isEnabled,
    );

    if (!allowedOccasion) return false;

    // If occasion object is populated, we can check its defined categories
    // If not populated (just ID), we assume it has categories and rely on allowedCategories list
    const occasionObj =
      typeof allowedOccasion.occasion === 'object'
        ? allowedOccasion.occasion
        : null;
    const availableCategories = (occasionObj as any)?.categories || [];
    const allowedCategoryIds = allowedOccasion.allowedCategories || [];

    // Case 1: Occasion has no categories defined in system -> Always allowed if occasion is enabled
    if (occasionObj && availableCategories.length === 0) return true;

    // Case 2: Occasion has categories, but none are selected in settings -> None allowed
    if (allowedCategoryIds.length === 0) return false;

    // Case 3: Specific categories are allowed
    if (!categoryId) return false; // If service has no category, but restrictions exist -> Block

    return allowedCategoryIds.some((id: any) => matchesId(id, categoryId));
  };

  // 1. Check booking's main occasion
  // Only allow based on main occasion if that occasion has NO categories defined
  if (booking.occasion) {
    const occasionId =
      typeof booking.occasion === 'object'
        ? booking.occasion._id
        : booking.occasion;
    const allowedOccasion = settings.allowedOccasions?.find(
      (ao: any) =>
        matchesId(ao.occasion?._id || ao.occasion, occasionId) && ao.isEnabled,
    );

    if (allowedOccasion) {
      const occasionObj =
        typeof allowedOccasion.occasion === 'object'
          ? allowedOccasion.occasion
          : null;
      const availableCategories = (occasionObj as any)?.categories || [];
      if (occasionObj && availableCategories.length === 0) return true;
    }
  }

  // 2. Check all services (direct)
  const services = booking?.services || [];
  if (services.length > 0) {
    for (const svc of services) {
      const serviceData = svc.service;
      if (
        serviceData &&
        typeof serviceData === 'object' &&
        serviceData.occasions
      ) {
        for (const occ of serviceData.occasions) {
          if (isOccasionCategoryAllowed(occ.occasion, occ.categoryId)) {
            return true;
          }
        }
      }
    }
  }

  // 3. Check all services (in packages)
  const packages = booking?.packages || [];
  if (packages.length > 0) {
    for (const pkg of packages) {
      const pkgData = pkg.package;
      // Check package occasion if it has no categories
      if (pkgData && pkgData.occasion) {
        const allowedOccasion = settings.allowedOccasions?.find(
          (ao: any) =>
            matchesId(ao.occasion?._id || ao.occasion, pkgData.occasion) &&
            ao.isEnabled,
        );
        if (allowedOccasion) {
          const occasionObj =
            typeof allowedOccasion.occasion === 'object'
              ? allowedOccasion.occasion
              : null;
          const availableCategories = (occasionObj as any)?.categories || [];
          if (occasionObj && availableCategories.length === 0) return true;
        }
      }

      if (pkg.servicesIncluded && pkg.servicesIncluded.length > 0) {
        for (const inc of pkg.servicesIncluded) {
          const incService = inc.service;
          if (
            incService &&
            typeof incService === 'object' &&
            incService.occasions
          ) {
            for (const occ of incService.occasions) {
              if (isOccasionCategoryAllowed(occ.occasion, occ.categoryId)) {
                return true;
              }
            }
          }
        }
      }
    }
  }

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

export const getUserQRCodes = async (
  token: string,
): Promise<{ success: boolean; qrCodes: QRCodeData[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr-codes/my-codes`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, qrCodes: [] };
    }

    return await response.json();
  } catch (error) {
    return { success: false, qrCodes: [] };
  }
};
