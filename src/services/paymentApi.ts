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
    paymentURL?: string;
    customerReference?: string;
    sessionId?: string;
    encryptionKey?: string;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Initiating payment session for booking:', paymentData.bookingId);

    // Use initiate-session endpoint which uses email (no mobile required)
    const response = await fetch(`${API_URL}/payment/initiate-session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerIdentifier: paymentData.customerEmail || '',
        amount: paymentData.invoiceValue,
        bookingId: paymentData.bookingId,
        language: paymentData.language || 'en',
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned an invalid response');
    }

    const data = await response.json();
    console.log('Initiate session response:', JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      console.error('Initiate session failed:', data);
      throw new Error(data.message || 'Failed to initiate payment session');
    }

    if (!data.data?.sessionId) {
      throw new Error('No session ID returned from server');
    }

    const sessionId = data.data.sessionId;
    const encryptionKey = data.data.encryptionKey;
    const language = paymentData.language || 'en';
    const isTestMode = true;

    // Create HTML content for embedded payment
    const htmlContent = createEmbeddedPaymentHTML(sessionId, language, isTestMode);

    return {
      success: true,
      data: {
        invoiceId: sessionId,
        invoiceURL: htmlContent,
        paymentURL: htmlContent,
        customerReference: paymentData.bookingId,
        sessionId: sessionId,
        encryptionKey: encryptionKey,
      },
      message: 'Payment session created successfully',
    };
  } catch (error: any) {
    console.error('Error initiating payment session:', error);
    throw error;
  }
};

/**
 * Create HTML content for embedded MyFatoorah payment
 */
function createEmbeddedPaymentHTML(sessionId: string, language: string, isTestMode: boolean): string {
  const scriptSrc = isTestMode
    ? 'https://demo.myfatoorah.com/sessions/v1/session.js'
    : 'https://portal.myfatoorah.com/sessions/v1/session.js';
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const headerText = language === 'ar' ? 'الدفع الآمن' : 'Secure Payment';
  const loadingText = language === 'ar' ? 'جاري تحميل خيارات الدفع...' : 'Loading payment options...';
  const errorText = language === 'ar' ? 'فشل تحميل صفحة الدفع' : 'Failed to load payment page';

  return `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Payment</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; min-height: 100vh; padding: 16px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 20px; color: #2A9D8F; font-size: 18px; font-weight: 600; }
    #embedded-sessions { min-height: 400px; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #2A9D8F; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { text-align: center; padding: 40px; color: #e74c3c; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${headerText}</div>
    <div id="loading" class="loading"><div class="spinner"></div><p>${loadingText}</p></div>
    <div id="embedded-sessions"></div>
    <div id="error" class="error"><p>${errorText}</p></div>
  </div>
  <script src="${scriptSrc}"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var loadingEl = document.getElementById('loading');
      var errorEl = document.getElementById('error');
      var paymentStarted = false;
      function initPayment() {
        if (typeof window.myfatoorah === 'undefined') { setTimeout(initPayment, 100); return; }
        loadingEl.style.display = 'none';
        try {
          window.myfatoorah.init({
            sessionId: '${sessionId}',
            containerId: 'embedded-sessions',
            shouldHandlePaymentUrl: true,
            language: '${language}',
            callback: function(response) {
              console.log('Payment callback:', JSON.stringify(response));
              if (response.paymentType) { paymentStarted = true; }
              if (response.isSuccess) {
                if (response.redirectionUrl) { window.location.href = response.redirectionUrl; }
                else if (response.paymentCompleted) {
                  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_SUCCESS', data: response }));
                }
              } else if (paymentStarted && response.message) {
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_ERROR', message: response.message }));
              }
            }
          });
        } catch (err) { console.error('Init error:', err); loadingEl.style.display = 'none'; errorEl.style.display = 'block'; }
      }
      setTimeout(initPayment, 500);
    });
  </script>
</body>
</html>`;
}

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

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Suppliers API returned non-JSON response, returning empty array');
      return { success: true, data: [] };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get suppliers');
    }

    return { success: true, data: data.data || data };
  } catch (error: any) {
    console.error('Error getting suppliers:', error);
    // Return empty array instead of throwing to prevent cart from breaking
    return { success: true, data: [] };
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
