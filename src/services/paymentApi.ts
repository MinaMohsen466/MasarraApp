/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { getSecureToken } from '../utils/secureStorage';
import { API_URL } from '../config/api.config';

/**
 * Payment API Service
 * Handles MyFatoorah payment integration for React Native
 */

/**
 * The single place that decides which MyFatoorah environment is in play.
 *
 * Everything downstream — the SDK script tag *and* the WebView's document
 * origin — must agree, because the gateway rejects a session minted on the
 * other environment ("SessionId is not valid!"). Splitting this decision across
 * call sites is what broke checkout before.
 *
 * The server owns the answer through MYFATOORAH_TEST_MODE and reports it as
 * `isTestMode` on the session response. Note that "deployed to production" does
 * NOT imply live payments: the production backend runs in test mode while the
 * app is still being tested.
 *
 * When the server does not report it, this defaults to the TEST gateway. That
 * direction is deliberate — guessing "live" would put real cards in front of
 * testers, while guessing "test" merely fails safe.
 */
export const resolveGatewayOrigin = (isTestMode?: boolean): string =>
  isTestMode === false
    ? 'https://portal.myfatoorah.com'
    : 'https://demo.myfatoorah.com';

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    return await getSecureToken();
  } catch {
    return null;
  }
}

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
    gatewayOrigin?: string;
  };
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    if (__DEV__) {
      console.log(
        'Initiating payment session for booking:',
        paymentData.bookingId,
      );
    }

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
    if (__DEV__)
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
    // Which MyFatoorah environment issued this session is the server's call
    // (MYFATOORAH_TEST_MODE), and the session id only resolves on that same
    // environment's SDK. Undefined here means the deployed server predates the
    // field, and resolveGatewayOrigin falls back to the test gateway.
    const gatewayOrigin = resolveGatewayOrigin(data.data?.isTestMode);

    // Create HTML content for embedded payment
    const htmlContent = createEmbeddedPaymentHTML(
      sessionId,
      language,
      gatewayOrigin,
    );

    return {
      success: true,
      data: {
        invoiceId: sessionId,
        invoiceURL: htmlContent,
        paymentURL: htmlContent,
        customerReference: paymentData.bookingId,
        sessionId: sessionId,
        encryptionKey: encryptionKey,
        // Passed to PaymentWebView so the document origin matches the SDK it
        // loads. These drifting apart is what produced "SessionId is not valid!".
        gatewayOrigin,
      },
      message: 'Payment session created successfully',
    };
  } catch (error: any) {
    console.error('Error initiating payment session:', error);
    throw error;
  }
};

export interface PendingServiceForPayment {
  serviceId: string;
  name?: string;
  nameAr?: string;
  price: number;
  quantity: number;
  total: number;
  discountedTotal?: number;
  vendor?: any;
  status: string;
  paymentStatus: string;
}

export interface PendingServicesPaymentData {
  bookingId: string;
  pendingServices: PendingServiceForPayment[];
  awaitingConfirmation: PendingServiceForPayment[];
  pendingTotal: number;
  pendingTotalRaw: number;
  deliveryFees: number;
  awaitingTotal: number;
  coupon?: {
    code: string;
    discountAmount: number;
    originalPendingTotal: number;
  } | null;
}

export const getPendingServicesForPayment = async (
  bookingId: string,
): Promise<{
  success: boolean;
  data?: PendingServicesPaymentData;
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${API_URL}/payment/pending-services/${bookingId}`,
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
      throw new Error(data.message || 'Failed to get pending services');
    }

    return data;
  } catch (error: any) {
    console.error('Error getting pending services:', error);
    throw error;
  }
};

/**
 * Create HTML content for embedded MyFatoorah payment
 */
function createEmbeddedPaymentHTML(
  sessionId: string,
  language: string,
  gatewayOrigin: string,
): string {
  // Same origin the WebView is given as baseUrl — see resolveGatewayOrigin.
  const scriptSrc = `${gatewayOrigin}/sessions/v1/session.js`;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const headerText = language === 'ar' ? 'الدفع الآمن' : 'Secure Payment';
  const loadingText =
    language === 'ar'
      ? 'جاري تحميل خيارات الدفع...'
      : 'Loading payment options...';
  const errorText =
    language === 'ar' ? 'فشل تحميل صفحة الدفع' : 'Failed to load payment page';

  return `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Payment</title>
  <style>
    /* Mirrors src/constants/colors.ts so the sheet reads as part of the app. */
    :root {
      --brand: #00a19c;
      --brand-dark: #1F4644;
      --page-bg: #e5eeec;
      --panel-bg: #ffffff;
      --border: #dde9e4;
      --text: #2C5F5D;
      --text-muted: #666666;
      --danger: #F44336;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--page-bg);
      color: var(--text);
      /* The sheet is already sized by the native modal. Filling the height here
         and pushing content to the top is what left the large empty band under
         the pay button. */
      min-height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 12px 12px 20px;
    }

    .container {
      width: 100%;
      max-width: 460px;
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px 12px;
      box-shadow: 0 2px 10px rgba(44, 95, 93, 0.06);
    }

    /* The native modal already renders a title bar. */
    .header { display: none; }

    .loading {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-muted);
      font-size: 14px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3.5px solid var(--border);
      border-top: 3.5px solid var(--brand);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      text-align: center;
      padding: 40px 20px;
      color: var(--danger);
      font-size: 14px;
      font-weight: 600;
      display: none;
    }

    /* --- Gateway-rendered markup -------------------------------------------
       Selectors reach into MyFatoorah's own DOM, so they stay defensive: any
       element these miss simply keeps the gateway's default styling. */

    /* NOTE: the gateway renders everything — payment networks, card fields and
       the pay button — inside one cross-origin iframe (#MFEmbeddedIframe), and
       leaves nothing else in this document. No rule here can reach those
       controls; they only style the wrapper around the iframe. Restyling the
       pay button needs the SDK's useCustomButton option plus our own button
       calling submitCardPayment(). */
    #embedded-sessions iframe {
      display: block;
      width: 100%;
      border: 0;
    }
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
      var waitedMs = 0;
      function post(payload) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      function reportFailure(message) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        post({ type: 'PAYMENT_ERROR', message: message });
      }

      /* The gateway renders its card fields inside cross-origin iframes, so the
         stylesheet above cannot reach them. The pay button does live in this
         document, but under obfuscated class names that change between
         releases. Pick it structurally instead — it is the widest button in the
         container — and tag it for the stylesheet. */


      /* Reports how tall the content actually is so the native sheet can shrink
         to fit instead of leaving a band of empty space below the gateway. */
      var lastHeight = 0;
      function reportHeight() {
        var h = Math.ceil(document.body.scrollHeight);
        if (h && Math.abs(h - lastHeight) > 8) {
          lastHeight = h;
          post({ type: 'CONTENT_HEIGHT', height: h });
        }
      }

      /* The gateway mounts asynchronously and resizes its iframes afterwards. */
      function watchGateway() {
        reportHeight();
      }
      if (window.MutationObserver) {
        new MutationObserver(watchGateway).observe(document.body, {
          childList: true, subtree: true, attributes: true, attributeFilter: ['style'],
        });
      }
      setInterval(watchGateway, 500);
      function initPayment() {
        if (typeof window.myfatoorah === 'undefined') {
          // Bounded wait. This used to retry every 100ms with no limit, so a
          // gateway script that never loaded left the user on a spinner
          // indefinitely with nothing reported back to the app.
          waitedMs += 100;
          if (waitedMs >= 15000) { reportFailure('${errorText}'); return; }
          setTimeout(initPayment, 100); return;
        }
        loadingEl.style.display = 'none';
        try {
          window.myfatoorah.init({
            sessionId: '${sessionId}',
            containerId: 'embedded-sessions',
            shouldHandlePaymentUrl: true,
            language: '${language}',
            style: {
              // Reserved height for the card-fields area. At 280 it was taller
              // than the fields actually need, which is what showed up as the
              // empty band between the pay button and the gateway's footer.
              cardHeight: 235,
              input: {
                color: '#2C5F5D',
                fontSize: '15px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                inputHeight: '48px',
                borderColor: '#dde9e4',
                borderRadius: '12px',
                borderWidth: '1px',
                errorColor: '#F44336',
                label: {
                  display: true,
                  color: '#666666',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }
            },
            callback: function(response) {
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
        } catch (err) {
          // Previously this only painted the error panel inside the WebView; the
          // app was never told, so the payment screen just sat there.
          reportFailure('${errorText}');
        }
      }
      setTimeout(initPayment, 500);
    });
  </script>
</body>
</html>`;
}

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

    if (!response.ok) {
      // If the API endpoint is not found (404) or unauthorized, handle it quietly
      return { success: true, data: [] };
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: true, data: [] };
    }

    const data = await response.json();
    return { success: true, data: data.data || data };
  } catch {
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
        return sum + (item.totalPrice ?? item.price) * item.quantity;
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
