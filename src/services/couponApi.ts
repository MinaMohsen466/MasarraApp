import { API_BASE_URL } from './api';

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  expiryDate: string | null;
  applicableVendors: string[];
  allVendors: boolean;
  applicableServices: string[];
  allServices: boolean;
  applicablePackages: string[];
  allPackages: boolean;
  deductFrom: 'vendor' | 'customer' | 'platform';
  isActive: boolean;
  createdBy: string;
  usedBy: Array<{
    user: string;
    booking: string;
    usedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
}

/**
 * Validate and apply a coupon code
 * @param couponCode - The coupon code to validate
 * @param cartTotal - The total amount of the cart
 * @param userId - The user ID
 * @param cartItems - Array of cart items with serviceId and vendorId
 * @param token - User authentication token
 */
export const validateCoupon = async (
  couponCode: string,
  cartTotal: number,
  userId: string,
  cartItems: Array<{ serviceId: string; vendorId?: string }>,
  token: string,
): Promise<ValidateCouponResponse> => {
  try {
    const requestBody = {
      code: couponCode.trim().toUpperCase(),
      totalPrice: cartTotal,
      userId,
      serviceIds: cartItems.map(item => item.serviceId),
      vendorIds: cartItems.map(item => item.vendorId).filter(Boolean),
    };

    if (__DEV__) {
    }

    const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (__DEV__) {
    }

    if (!response.ok) {
      return {
        valid: false,
        message: data.message || 'Failed to validate coupon',
      };
    }

    // Map the response to our interface
    if (data.success && data.data) {
      return {
        valid: true,
        message: 'Coupon applied successfully',
        coupon: {
          _id: data.data.code,
          code: data.data.code,
          discountType: data.data.discountType,
          discountValue: data.data.discountValue,
          isActive: true,
          deductFrom: data.data.deductFrom,
        } as Coupon,
        discountAmount: data.data.discountAmount || 0,
        finalAmount: cartTotal - (data.data.discountAmount || 0),
      };
    }

    return data;
  } catch (error: any) {
    if (__DEV__) {
    }
    return {
      valid: false,
      message: error.message?.includes('Network')
        ? 'تعذر الاتصال بالسيرفر'
        : 'حدث خطأ. حاول مرة أخرى.',
    };
  }
};

/**
 * Apply coupon to a booking
 * @param bookingId - The booking ID
 * @param couponCode - The coupon code
 * @param token - User authentication token
 */
export const applyCouponToBooking = async (
  bookingId: string,
  couponCode: string,
  token: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/coupons/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookingId,
        couponCode: couponCode.trim().toUpperCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to apply coupon',
      };
    }

    return {
      success: true,
      message: data.message || 'Coupon applied successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
};
