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

export const getQRCodeSettings = async (token: string): Promise<QRCodeSettings | null> => {
  try {
    console.log('[QR Settings] Fetching settings...');
    console.log('[QR Settings] API Base URL:', API_BASE_URL);
    
    // First, try to get the full settings with token (same as client web)
    // This gives us displaySettings and allowedOccasions
    try {
      const settingsEndpoint = `${API_BASE_URL}/qr-codes/settings`;
      console.log('[QR Settings] Trying settings endpoint:', settingsEndpoint);
      
      const settingsResponse = await fetch(settingsEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[QR Settings] Settings response status:', settingsResponse.status);
      
      if (settingsResponse.ok) {
        const fullSettings = await settingsResponse.json();
        console.log('[QR Settings] Got full settings:', {
          hasDisplaySettings: !!fullSettings.displaySettings,
          hasQRCodeStyle: !!fullSettings.qrCodeStyle,
          allowedOccasionsCount: fullSettings.allowedOccasions?.length || 0,
          backgroundImagesCount: fullSettings.backgroundImages?.length || 0
        });
        
        // If we got full settings with background images, return it
        if (fullSettings.backgroundImages && fullSettings.backgroundImages.length > 0) {
          console.log('[QR Settings] ✓ Successfully got full settings with background images');
          return fullSettings;
        }
      }
    } catch (settingsError) {
      console.log('[QR Settings] Settings endpoint error (trying public endpoint):', settingsError);
    }
    
    // If full settings failed, try public endpoint for background images
    try {
      const endpoint = `${API_BASE_URL}/qr-codes/public/background-images`;
      console.log('[QR Settings] Trying public endpoint:', endpoint);
      
      const publicResponse = await fetch(endpoint, {
        method: 'GET'
      });
      
      console.log('[QR Settings] Public response status:', publicResponse.status);
      
      if (publicResponse.ok) {
        const backgroundImages = await publicResponse.json();
        console.log('[QR Settings] Got', backgroundImages?.length || 0, 'background images');
        
        if (backgroundImages?.length > 0) {
          console.log('[QR Settings] ✓ Successfully got background images from public endpoint');
          
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
              showPrice: false
            },
            qrCodeStyle: {
              size: 300,
              errorCorrectionLevel: 'M',
              margin: 4
            },
            backgroundImages: Array.isArray(backgroundImages) ? backgroundImages : [],
            allowedOccasions: []
          };
        }
      }
    } catch (publicError) {
      console.log('[QR Settings] Public endpoint error:', publicError);
    }

    console.log('[QR Settings] Could not fetch background images - returning minimal settings');
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
  } catch (error) {
    console.error('[QR Settings] Error:', error);
    return null;
  }
};

export const getQRCodeByBooking = async (token: string, bookingId: string): Promise<QRCodeData | null> => {
  try {
    console.log('[getQRCodeByBooking] Fetching for booking:', bookingId);
    const response = await fetch(`${API_BASE_URL}/qr-codes/booking/${bookingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[getQRCodeByBooking] Response status:', response.status);
    
    if (response.status === 404) {
      console.log('[getQRCodeByBooking] QR code not found (404)');
      return null;
    }
    if (!response.ok) {
      console.log('[getQRCodeByBooking] Request failed with status:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[getQRCodeByBooking] QR code data received:', {
      hasQrCode: !!data.qrCode,
      hasQrCodeImage: !!data.qrCodeImage,
      hasCustomDetails: !!data.customDetails,
      qrUrl: data.qrUrl
    });
    return data;
  } catch (error) {
    console.error('[getQRCodeByBooking] Error:', error);
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

    console.log('[QR Generate] Payload:', payload);
    console.log('[QR Generate] Booking ID:', bookingId);

    const response = await fetch(`${API_BASE_URL}/qr-codes/generate/${bookingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('[QR Generate] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('[QR Generate] Error response:', error);
      throw new Error(error.error || error.message || 'Failed to generate QR code');
    }

    const result = await response.json();
    console.log('[QR Generate] Success:', {
      hasQrCode: !!result.qrCode,
      hasQrCodeImage: !!result.qrCodeImage,
      hasQrUrl: !!result.qrUrl,
      hasCustomDetails: !!result.customDetails,
      hasSelectedBackgroundImage: !!result.selectedBackgroundImage
    });
    
    // Ensure the result has all necessary fields
    if (!result.qrCode && !result.qrCodeImage) {
      console.warn('[QR Generate] Warning: No QR code image in response');
    }
    
    return result;
  } catch (error) {
    console.error('[QR Generate] Exception:', error);
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

export const canCreateQRCode = async (booking: any, settings: QRCodeSettings | null, token?: string): Promise<boolean> => {
  console.log('[QR Check] Checking if QR code can be created for booking:', booking?._id);
  
  if (!booking) {
    console.log('[QR Check] No booking provided');
    return false;
  }

  // Get the first service from booking
  const service = booking?.services?.[0];
  if (!service) {
    console.log('[QR Check] No service in booking');
    return false;
  }

  // Get the service data
  let serviceData = typeof service.service === 'string' ? null : service.service;
  const serviceId = typeof service.service === 'string' ? service.service : service.service?._id;
  
  // If service is not populated and we have a token, try to fetch full details
  if ((!serviceData || !serviceData.occasions) && serviceId && token) {
    console.log('[QR Check] Fetching service details for:', serviceId);
    serviceData = await fetchServiceDetails(serviceId, token);
  }

  // If still no service data, return false
  if (!serviceData) {
    console.log('[QR Check] Could not load service data');
    return false;
  }

  // Get occasions from service
  const serviceOccasions = serviceData.occasions || [];
  
  console.log('[QR Check] Service occasions:', serviceOccasions.map((so: any) => 
    so.occasion?._id || so.occasion
  ));
  
  if (!serviceOccasions.length) {
    console.log('[QR Check] Service has no occasions');
    return false;
  }

  // If we have settings with allowedOccasions, use them (from full API call)
  if (settings?.allowedOccasions && settings.allowedOccasions.length > 0) {
    console.log('[QR Check] Using allowedOccasions from settings');
    
    // Get enabled allowed occasions
    const enabledAllowedOccasionIds = settings.allowedOccasions
      .filter(ao => ao.isEnabled)
      .map(ao => ao.occasion._id);
    
    console.log('[QR Check] Enabled allowed occasions:', enabledAllowedOccasionIds);
    
    // Check if ANY of the service's occasions match the enabled allowed ones
    const hasAllowedOccasion = serviceOccasions.some((svc: any) => {
      const serviceOccasionId = svc.occasion?._id || svc.occasion;
      return serviceOccasionId && enabledAllowedOccasionIds.includes(String(serviceOccasionId));
    });
    
    if (hasAllowedOccasion) {
      console.log('[QR Check] ✓ QR code allowed (matched with settings)');
    } else {
      console.log('[QR Check] ✗ QR code NOT allowed - no matching occasions in settings');
    }
    
    return hasAllowedOccasion;
  }
  
  // Fallback: if no settings available, allow QR code creation
  // Backend will validate properly when actually generating
  console.log('[QR Check] No settings available - allowing QR creation (backend will validate)');
  return true;
};

export const getDefaultBackgroundImage = (settings: QRCodeSettings) => {
  return settings?.backgroundImages?.find(img => img.isDefault && img.isActive) || settings?.backgroundImages?.[0];
};

export const getQRImageUrl = (qrToken: string): string => {
  // Generate QR code image URL using the token
  return `${API_BASE_URL}/qr-codes/${qrToken}`;
};

export const getBackgroundImageUrl = (imagePath: string): string => {
  // Backend provides direct S3 URLs in path field
  if (!imagePath) {
    console.log('[Image URL] No path provided');
    return '';
  }
  
  console.log('[Image URL] Using path directly:', imagePath);
  return imagePath;
};
