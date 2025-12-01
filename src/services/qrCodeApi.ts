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
  qrCodeImage?: string;
  qrUrl?: string;
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

export const getQRCodeSettings = async (token: string): Promise<QRCodeSettings | null> => {
  try {
    // Try to fetch full settings from public endpoint (no auth required)
    let settings: QRCodeSettings | null = null;
    
    try {
      const settingsResponse = await fetch(`${API_BASE_URL}/qr-codes/public/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (settingsResponse.ok) {
        settings = await settingsResponse.json();
      }
    } catch (settingsError) {
      // Could not fetch public QR settings
    }

    // If no settings from public endpoint, try admin endpoint with token
    if (!settings || !settings.allowedOccasions?.length) {
      try {
        const settingsResponse = await fetch(`${API_BASE_URL}/qr-codes/settings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (settingsResponse.ok) {
          const adminSettings = await settingsResponse.json();
          settings = adminSettings;
        }
      } catch (adminError) {
        // Could not fetch admin QR settings
      }
    }

    // Ensure we have a complete settings object
    if (!settings) {
      settings = {
        displaySettings: {
          showCustomerInfo: false,
          showContactInfo: true,
          showEventTime: true,
          showEventDate: true,
          showLocation: true,
          showServices: true,
          showSpecialRequests: false,
          showPrice: false
        },
        qrCodeStyle: {
          size: 300,
          errorCorrectionLevel: 'M',
          margin: 4
        },
        backgroundImages: [],
        allowedOccasions: []
      };
    }

    return settings;
  } catch (error) {
    return {
      displaySettings: {
        showCustomerInfo: false,
        showContactInfo: true,
        showEventTime: true,
        showEventDate: true,
        showLocation: true,
        showServices: true,
        showSpecialRequests: false,
        showPrice: false
      },
      qrCodeStyle: {
        size: 300,
        errorCorrectionLevel: 'M',
        margin: 4
      },
      backgroundImages: [],
      allowedOccasions: []
    };
  }
};

export const getQRCodeByBooking = async (token: string, bookingId: string): Promise<QRCodeData | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/qr-codes/booking/${bookingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) return null;
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    return null;
  }
};

export const generateQRCode = async (
  token: string, 
  bookingId: string, 
  customDetails: QRCodeCustomDetails, 
  backgroundImageId: string,
  serviceId?: string
): Promise<any> => {
  try {
    const payload: any = {
      customDetails,
      selectedBackgroundImageId: backgroundImageId
    };

    // Add service ID if available (helps with validation)
    if (serviceId) {
      payload.serviceId = serviceId;
    }

    const response = await fetch(`${API_BASE_URL}/qr-codes/generate/${bookingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to generate QR code');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchServiceDetails = async (serviceId: string, token: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
};

export const canCreateQRCode = async (booking: any, settings: QRCodeSettings, token?: string): Promise<boolean> => {
  // Check if QR code feature is enabled
  if (!settings) {
    return false;
  }

  // Get the first service from booking
  const service = booking?.services?.[0];
  if (!service) {
    return false;
  }

  // Get allowed occasions from settings
  const allowedOccasions = settings.allowedOccasions || [];
  
  if (!allowedOccasions.length) {
    return false;
  }

  // Get the service data
  let serviceData = typeof service.service === 'string' ? null : service.service;
  
  // If service is not populated, try to fetch full details
  if (!serviceData || !serviceData.occasions) {
    if (token) {
      const serviceId = typeof service.service === 'string' ? service.service : service.service?._id;
      if (serviceId) {
        serviceData = await fetchServiceDetails(serviceId, token);
      }
    }
  }

  // If still no service data, try to allow based on other info
  if (!serviceData) {
    return true; // Let server handle validation
  }

  // Get occasions from service
  const serviceOccasions = serviceData.occasions || [];
  
  if (!serviceOccasions.length) {
    return false;
  }

  // Check if ANY of the service's occasions are in the allowed occasions
  // The logic is: the service must have at least ONE occasion that matches an allowed occasion
  const hasAllowedOccasion = serviceOccasions.some((svc: any) => {
    const serviceOccasionId = svc.occasion?._id || svc.occasion;
    if (!serviceOccasionId) {
      return false;
    }

    // Check if this service's occasion exists in allowed occasions
    const isAllowed = allowedOccasions.some((ao: any) => {
      const allowedOccasionId = ao.occasion?._id || ao.occasion;
      const isMatch = String(serviceOccasionId) === String(allowedOccasionId);
      const isEnabled = ao.isEnabled !== false;
      
      return isMatch && isEnabled;
    });

    return isAllowed;
  });

  return hasAllowedOccasion;
};

export const getDefaultBackgroundImage = (settings: QRCodeSettings) => {
  return settings?.backgroundImages?.find(img => img.isDefault && img.isActive) || settings?.backgroundImages?.[0];
};

export const getQRImageUrl = (qrToken: string): string => {
  // Generate QR code image URL using the token
  return `${API_BASE_URL}/qr-codes/${qrToken}`;
};

export const getBackgroundImageUrl = (imagePath: string): string => {
  // Convert backend path to full API URL
  if (!imagePath) return '';
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Remove leading slashes and convert backslashes to forward slashes
  const cleanPath = imagePath.replace(/^[\\/]+/, '').replace(/\\/g, '/');
  
  // Return full URL
  return `${API_BASE_URL}/${cleanPath}`;
};
