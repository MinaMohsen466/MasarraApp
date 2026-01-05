import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api.config';

/**
 * Payment API Service
 * Handles MyFatoorah payment integration for React Native
 */

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (e) {
    return null;
  }
}

/**
 * Initialize MyFatoorah payment session
 * @param customerIdentifier - Customer identifier (email or phone)
 */
export const initiatePaymentSession = async (
  customerIdentifier: string,
): Promise<{
  success: boolean;
  data?: {
    SessionId: string;
    CountryCode: string;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Initiating payment session for:', customerIdentifier);

    const response = await fetch(`${API_URL}/payment/initiate-session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerIdentifier }),
    });

    const data = await response.json();
    console.log('Initiate session response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Initiate session failed:', data);
      throw new Error(data.message || 'Failed to initiate payment session');
    }

    return data;
  } catch (error: any) {
    console.error('Error initiating payment session:', error);
    throw error;
  }
};

/**
 * Execute payment with MyFatoorah
 */
export interface ExecutePaymentParams {
  sessionId: string;
  bookingId: string;
  invoiceValue: number;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  mobileCountryCode?: string;
  displayCurrencyIso?: string;
  language?: string;
  customerAddress?: {
    Block?: string;
    Street?: string;
    HouseBuildingNo?: string;
    AddressInstructions?: string;
  };
  invoiceItems?: Array<{
    ItemName: string;
    Quantity: number;
    UnitPrice: number;
  }>;
  suppliers?: Array<{
    SupplierCode: string;
    InvoiceShare: number;
    ProposedShare: number | null;
  }>;
}

export const executePayment = async (
  paymentData: ExecutePaymentParams,
): Promise<{
  success: boolean;
  data?: {
    invoiceId: string;
    paymentURL: string;
    isDirectPayment?: boolean;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Executing payment with data:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(`${API_URL}/payment/execute`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    console.log('Payment execute response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Payment execute failed:', data);
      throw new Error(data.message || 'Failed to execute payment');
    }

    return data;
  } catch (error: any) {
    console.error('Error executing payment:', error);
    throw error;
  }
};

/**
 * Send payment link (Invoice Link) via SMS/Email or just get link
 */
export interface SendPaymentParams {
  bookingId: string;
  invoiceValue: number;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  mobileCountryCode?: string;
  displayCurrencyIso?: string;
  language?: string;
  customerReference?: string;
  customerAddress?: {
    Block?: string;
    Street?: string;
    HouseBuildingNo?: string;
    AddressInstructions?: string;
  };
  invoiceItems?: Array<{
    ItemName: string;
    Quantity: number;
    UnitPrice: number;
  }>;
  suppliers?: Array<{
    SupplierCode: string;
    InvoiceShare: number;
    ProposedShare: number | null;
  }>;
  notificationOption?: 'SMS' | 'EML' | 'ALL' | 'LNK';
}

export const sendPayment = async (
  paymentData: SendPaymentParams,
): Promise<{
  success: boolean;
  data?: {
    invoiceId: string;
    invoiceURL: string;
    customerReference?: string;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Sending payment request with data:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(`${API_URL}/payment/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    console.log('Send payment response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Send payment failed:', data);
      throw new Error(data.message || 'Failed to send payment link');
    }

    return data;
  } catch (error: any) {
    console.error('Error sending payment link:', error);
    throw error;
  }
};

/**
 * Get payment status by payment ID
 */
export const getPaymentStatus = async (
  paymentId: string,
): Promise<{
  success: boolean;
  data?: {
    InvoiceStatus: string;
    InvoiceId: string;
    InvoiceValue: number;
    CustomerName: string;
    PaidCurrency?: string;
    PaidCurrencyValue?: number;
    TransactionId?: string;
    PaymentGateway?: string;
    PaymentDate?: string;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/payment/status/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment status');
    }

    return data;
  } catch (error: any) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

/**
 * Get payment status by session ID
 */
export const getPaymentStatusBySession = async (
  sessionId: string,
): Promise<{
  success: boolean;
  data?: {
    InvoiceStatus: string;
    InvoiceId: string;
    InvoiceValue: number;
    CustomerName: string;
    PaidCurrency?: string;
    PaidCurrencyValue?: number;
    TransactionId?: string;
    PaymentGateway?: string;
    PaymentDate?: string;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${API_URL}/payment/status/session/${sessionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment status');
    }

    return data;
  } catch (error: any) {
    console.error('Error getting payment status by session:', error);
    throw error;
  }
};

/**
 * Get active suppliers for commission calculation
 */
export const getActiveSuppliers = async (): Promise<{
  success: boolean;
  data?: Array<{
    _id: string;
    supplierCode: string;
    supplierName: string;
    vendorId: string;
    commissionPercentage: number;
    commissionValue: number;
    status: string;
  }>;
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Use query parameter to get active suppliers (public access allowed)
    const response = await fetch(`${API_URL}/suppliers?status=active`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get suppliers');
    }

    return data;
  } catch (error: any) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
};

/**
 * Calculate supplier shares for payment distribution
 */
export interface SupplierShare {
  SupplierCode: string;
  InvoiceShare: number;
  ProposedShare: number | null;
}

export interface Supplier {
  _id: string;
  supplierCode: string;
  vendorId: string;
  commissionPercentage: number;
  commissionValue: number;
}

export interface CartItemForPayment {
  vendorId: string;
  totalPrice?: number;
  price: number;
  quantity: number;
}

export const calculateSupplierShares = (
  cartItems: CartItemForPayment[],
  suppliers: Supplier[],
): SupplierShare[] => {
  const shares: SupplierShare[] = [];

  // Group cart items by vendor
  const itemsByVendor: Record<string, CartItemForPayment[]> = {};
  cartItems.forEach(item => {
    const vendorId = item.vendorId;
    if (!itemsByVendor[vendorId]) {
      itemsByVendor[vendorId] = [];
    }
    itemsByVendor[vendorId].push(item);
  });

  // Calculate share for each vendor
  Object.keys(itemsByVendor).forEach(vendorId => {
    const vendorItems = itemsByVendor[vendorId];
    const supplier = suppliers.find(s => s.vendorId === vendorId);

    if (supplier) {
      // Calculate total for this vendor's items
      const vendorTotal = vendorItems.reduce((sum, item) => {
        return sum + ((item.totalPrice ?? item.price) * item.quantity);
      }, 0);

      // Calculate commission
      const commissionPercentage = supplier.commissionPercentage / 100;
      const commissionAmount =
        vendorTotal * commissionPercentage + (supplier.commissionValue || 0);
      const proposedShare = vendorTotal - commissionAmount;

      shares.push({
        SupplierCode: supplier.supplierCode,
        InvoiceShare: vendorTotal,
        ProposedShare: proposedShare > 0 ? proposedShare : null,
      });
    }
  });

  return shares;
};

/**
 * Check if cart has multiple vendors
 */
export const isMultiVendorCart = (
  cartItems: CartItemForPayment[],
): boolean => {
  const vendorIds = new Set(cartItems.map(item => item.vendorId));
  return vendorIds.size > 1;
};

/**
 * Get unique vendor IDs from cart
 */
export const getCartVendorIds = (cartItems: CartItemForPayment[]): string[] => {
  return [...new Set(cartItems.map(item => item.vendorId))];
};
