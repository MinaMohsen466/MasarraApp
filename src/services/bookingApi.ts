/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, parseJsonResponse } from './apiUtils';

export interface BookingTimeSlot {
  start: string;
  end: string;
}

export interface CustomInput {
  label: string;
  value: any;
  labelAr?: string;
  valueAr?: any;
  price?: number;
  _id?: string;
}

export interface ServiceInfo {
  _id: string;
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  image?: string;
}

export interface VendorInfo {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  businessName_ar?: string;
  email?: string;
  phone?: string;
  vendorProfile?: {
    businessName?: string;
    businessName_ar?: string;
    refundPeriodHours?: number;
  };
}

export interface BookingService {
  service: string | ServiceInfo;
  vendor: string | VendorInfo;
  price: number;
  quantity: number;
  status: string;
  paymentStatus?: string;
  confirmedAt?: string;
  paidAt?: string;
  notes?: string;
  customInputs?: CustomInput[];
  eventDate?: string;
  timeSlot?: BookingTimeSlot;
  _id: string;
}

export interface Booking {
  _id: string;
  customer: string;
  eventDate: string;
  eventTime: BookingTimeSlot;
  location: string;
  services: BookingService[];
  packages: any[];
  totalPrice: number;
  deliveryFees?: number;
  coupon?: {
    code: string;
    discountAmount: number;
    originalPrice: number;
    deductFrom: string;
    deductionSplit?: {
      adminPercentage: number;
      vendorPercentage: number;
    };
  };
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  guestLimit?: number;
  guests?: any[];
  myFatoorahPayment?: {
    paymentMethod?: string;
    transactionId?: string;
    invoiceId?: string | number;
    referenceId?: string;
  };
  review?: any;
  cancellationRequest?: {
    status: 'requested' | 'approved' | 'rejected';
    reason: string;
    customerRefundAmount?: number;
    vendorDeductionPercent?: number;
    adminNote?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
  __v: number;
}

/**
 * Fetch all bookings (for availability checking)
 */
export const fetchBookings = async (token?: string): Promise<Booking[]> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }

    const data: Booking[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch user bookings (for customer order history)
 */
export const getUserBookings = async (token: string): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user bookings: ${response.statusText}`);
    }

    const data: Booking[] = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch user dashboard bookings using the same endpoint as the web dashboard.
 */
export const getUserDashboardBookings = async (
  token: string,
): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch user dashboard bookings: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return Array.isArray(data?.myBookings) ? data.myBookings : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Request cancellation for a paid booking
 */
export const requestBookingCancellation = async (
  token: string,
  bookingId: string,
  reason: string,
): Promise<{ success: boolean; eligibility?: any; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/cancellation-request`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      },
    );

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(responseData?.error || 'Failed to submit cancellation request');
    }

    return responseData;
  } catch (error: any) {
    throw error;
  }
};
