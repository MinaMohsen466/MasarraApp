/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
  Dimensions,
  LayoutAnimation,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config/api.config';
import { resolveGatewayOrigin } from '../services/paymentApi';
import { LogoLoader } from './LogoLoader';

// The gateway posts a new height for every step of its own mount — the iframe,
// then the Apple Pay / G Pay buttons, then font swaps. Each report restarts this
// clock, so the sheet is revealed only once nothing has moved for this long. At
// 500ms it was committing to an intermediate size and lifting the cover there,
// which is why the sheet settled small and then grew again in front of the user.
const HEIGHT_SETTLE_BEFORE_REVEAL_MS = 900;
// After the form is up, this only debounces a real page change (3-D Secure).
const HEIGHT_SETTLE_AFTER_REVEAL_MS = 500;

interface PaymentWebViewProps {
  visible: boolean;
  paymentUrl: string;
  /**
   * Origin the embedded payment document is served under. It has to match the
   * environment that issued the session, otherwise the gateway rejects it with
   * "SessionId is not valid!". Comes from sendPayment(); defaults to the test
   * gateway, matching resolveGatewayOrigin.
   */
  gatewayOrigin?: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

/**
 * PaymentWebView Component
 * Displays MyFatoorah payment page inside the app using WebView
 */
const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  paymentUrl,
  gatewayOrigin,
  onClose,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { isRTL, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const verifyingRef = useRef(false);
  // Reported by the payment page once the gateway has mounted.
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const heightSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The height the sheet has locked onto. Null until the first commit.
  const committedHeightRef = useRef<number | null>(null);

  // Cleared once the gateway has finished mounting and settled on a size.
  const [gatewayReady, setGatewayReady] = useState(false);
  // The WebView is held back until the sheet has finished sliding in. Creating
  // it and starting the gateway load are heavy main-thread work, and doing that
  // during the entrance animation is what made this sheet stutter on its way up.
  const [sheetShown, setSheetShown] = useState(false);

  /**
   * The gateway iframe mounts at ~150px and grows in steps as it loads. Acting
   * on each reported height made the sheet open large, collapse, then expand
   * again. Commit only once the value has held still, and keep the loading
   * cover up until then so the growing is never on screen.
   */
  const settleHeight = useCallback((height: number) => {
    const committed = committedHeightRef.current;
    // Once the form is on screen, ignore the gateway's constant small reflows;
    // only a jump big enough to be a genuinely different page (a 3-D Secure
    // step) is allowed to move the sheet.
    if (committed !== null && Math.abs(height - committed) < 150) {
      return;
    }
    if (heightSettleTimer.current) clearTimeout(heightSettleTimer.current);
    heightSettleTimer.current = setTimeout(
      () => {
        // Animated even for the first commit: the sheet is still at its
        // fallback height, and this is the moment the cover lifts — so the
        // resize and the form appearing read as one deliberate transition
        // rather than a jump.
        LayoutAnimation.configureNext(
          LayoutAnimation.create(
            220,
            LayoutAnimation.Types.easeInEaseOut,
            LayoutAnimation.Properties.scaleY,
          ),
        );
        committedHeightRef.current = height;
        setContentHeight(height);
        setGatewayReady(true);
      },
      committed === null
        ? HEIGHT_SETTLE_BEFORE_REVEAL_MS
        : HEIGHT_SETTLE_AFTER_REVEAL_MS,
    );
  }, []);

  useEffect(() => {
    if (!visible) {
      // Modal's onDismiss is iOS-only, so the flag is cleared here instead —
      // otherwise the second open would mount the WebView during the slide
      // again and only the first payment would animate smoothly.
      setSheetShown(false);
      return undefined;
    }
    // The component stays mounted between attempts, so a reopened sheet would
    // otherwise start at the previous session's size with the cover already
    // lifted.
    setGatewayReady(false);
    setContentHeight(null);
    committedHeightRef.current = null;
    // Safety net: if the gateway never reports a size, reveal anyway rather
    // than leaving the user staring at a spinner over a working page.
    const reveal = setTimeout(() => setGatewayReady(true), 8000);
    return () => clearTimeout(reveal);
  }, [visible]);

  useEffect(
    () => () => {
      if (heightSettleTimer.current) clearTimeout(heightSettleTimer.current);
    },
    [],
  );

  // Shared helper function to verify payment status on the server
  // Uses the /payment/callback endpoint which supports both v2 and v3 PaymentIds
  const verifyPayment = async (paymentId: string) => {
    try {
      setVerifyingPayment(true);

      // Wait a moment for server to process the payment
      await new Promise<void>(resolve => setTimeout(resolve, 2500));

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        onPaymentError(
          'Authentication required. Please log in and check your orders.',
        );
        return;
      }

      // Use the /payment/status/:paymentId endpoint which exists on the production backend
      // and correctly handles verifying the payment status from MyFatoorah
      const response = await fetch(
        `${API_URL}/payment/status/${encodeURIComponent(paymentId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      // Only the status — the full response carries invoice and customer details
      // that must not reach the device log.
      if (__DEV__)
        console.log(
          'Payment verification status:',
          result?.invoiceStatus ?? result?.data?.InvoiceStatus,
        );

      if (result.success && result.invoiceStatus === 'Paid') {
        if (__DEV__) console.log('Payment verified as PAID via callback!');
        onPaymentSuccess();
      } else if (result.success && result.data?.InvoiceStatus === 'Paid') {
        if (__DEV__) console.log('Payment verified as PAID!');
        onPaymentSuccess();
      } else {
        const status =
          result.invoiceStatus || result.data?.InvoiceStatus || 'Unknown';
        if (__DEV__) console.log('Payment not confirmed. Status:', status);
        if (status === 'Pending') {
          // Payment might still be processing - treat as success and let server reconcile
          if (__DEV__)
            console.log(
              'Payment Pending - treating as potential success, user should check orders',
            );
          onPaymentError(
            'Payment is being processed. Please check your order history for confirmation.',
          );
        } else {
          onPaymentError(
            result.message || `Payment not completed. Status: ${status}`,
          );
        }
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      onPaymentError(
        'Payment verification failed. Please check your order history to confirm payment status.',
      );
    } finally {
      setVerifyingPayment(false);
      verifyingRef.current = false;
    }
  };

  // Handle navigation state changes to detect payment completion
  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    // Path only — the query string of a payment callback carries the payment id.
    if (__DEV__) console.log('WebView navigating to:', url.split('?')[0]);

    // Check if redirected to success/callback URL
    if (url.includes('/payment/callback') || url.includes('/payment/success')) {
      if (verifyingRef.current) {
        if (__DEV__)
          console.log(
            'Payment verification already in progress, ignoring duplicate event',
          );
        return;
      }
      verifyingRef.current = true;
      if (__DEV__)
        console.log('Payment callback detected! Verifying payment status...');

      // Extract paymentId from URL query parameters (manual parsing for React Native compatibility)
      try {
        // Parse query string manually since URL/URLSearchParams may not work in React Native
        const queryString = url.split('?')[1] || '';
        const params: Record<string, string> = {};
        queryString.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) params[key] = decodeURIComponent(value || '');
        });
        const paymentId = params.paymentId || params.Id || null;

        if (paymentId) {
          if (__DEV__) console.log('Payment ID extracted:', paymentId);
          await verifyPayment(paymentId);
        } else {
          if (__DEV__) console.log('No payment ID found in URL');
          onPaymentError('No payment identifier found in callback URL.');
        }
      } catch (err) {
        console.error('Error parsing callback URL:', err);
        onPaymentError('Error parsing payment callback URL.');
      }
      return;
    }

    // Check if redirected to error URL
    if (url.includes('/payment/error') || url.includes('/payment/failed')) {
      if (__DEV__) console.log('Payment error detected!');
      onPaymentError('Payment was not completed');
      return;
    }
  };

  // Handle WebView errors
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError(true);
    setLoading(false);
  };

  // Handle HTTP errors
  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView HTTP error:', nativeEvent);
    // Only show error for critical status codes
    if (nativeEvent.statusCode >= 400) {
      setError(true);
    }
  };

  if (!visible) return null;

  // Header + a little breathing room, capped so a tall gateway page still
  // leaves the cart visible behind the sheet. Falls back to the original fixed
  // share of the screen until the page reports its size.
  const screenHeight = Dimensions.get('window').height;
  const sheetHeightStyle = contentHeight
    ? {
        height: Math.min(
          contentHeight + 64 + insets.bottom,
          screenHeight * 0.9,
        ),
      }
    : styles.sheetFallbackHeight;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      onShow={() => setSheetShown(true)}
      // Without these the modal window stops short of Android's gesture bar, so
      // the cart's green background showed through as a strip under the white
      // footer. The footer already pads itself by insets.bottom, so extending
      // the window just fills that strip with the sheet's own white.
      // navigationBarTranslucent is only honoured alongside statusBarTranslucent.
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, sheetHeightStyle]}>
          {/* Header */}
          <View style={[styles.simpleHeader, isRTL && styles.simpleHeaderRTL]}>
            <TouchableOpacity
              style={styles.simpleCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>

            <Text style={[styles.simpleHeaderTitle, isRTL && styles.rtlText]}>
              {t('payment') || 'Payment'}
            </Text>

            <View style={styles.placeholder} />
          </View>

          {/* WebView Container */}
          <View style={styles.webViewContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorTitle, isRTL && styles.rtlText]}>
                  {t('paymentError') || 'Payment Error'}
                </Text>
                <Text style={[styles.errorText, isRTL && styles.rtlText]}>
                  {t('paymentLoadError') ||
                    'Failed to load payment page. Please try again.'}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setError(false);
                    setLoading(true);
                    setGatewayReady(false);
                    setContentHeight(null);
                    webViewRef.current?.reload();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    {t('retry') || 'Retry'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                  <Text
                    style={[styles.cancelLinkText, isRTL && styles.rtlText]}
                  >
                    {t('cancel') || 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {sheetShown && (
                  <WebView<{}>
                    ref={webViewRef}
                    // Check if paymentUrl is HTML content or a URL
                    source={
                      paymentUrl.startsWith('<!DOCTYPE') ||
                      paymentUrl.startsWith('<html')
                        ? {
                            html: paymentUrl,
                            baseUrl: gatewayOrigin ?? resolveGatewayOrigin(),
                          }
                        : { uri: paymentUrl }
                    }
                    style={styles.webView}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onNavigationStateChange={handleNavigationStateChange}
                    onError={handleError}
                    onHttpError={handleHttpError}
                    onMessage={async event => {
                      // Handle messages from embedded payment form
                      try {
                        const message = JSON.parse(event.nativeEvent.data);
                        // Type only — the payload holds the gateway's invoice and
                        // payer details.
                        if (__DEV__)
                          console.log('WebView message type:', message?.type);
                        if (message.type === 'PAYMENT_SUCCESS') {
                          // Extract payment ID if it is passed in the postMessage payload
                          const paymentId =
                            message.data?.PaymentId ||
                            message.data?.data?.PaymentId ||
                            message.data?.InvoiceId ||
                            message.data?.data?.InvoiceId ||
                            message.data?.invoiceId;

                          if (paymentId) {
                            if (__DEV__)
                              console.log(
                                'Extracted payment ID from onMessage:',
                                paymentId,
                              );
                            await verifyPayment(String(paymentId));
                          } else {
                            if (__DEV__)
                              console.log(
                                'No payment ID found in message payload, calling error',
                              );
                            onPaymentError(
                              'Failed to verify payment status: Missing payment identifier.',
                            );
                          }
                        } else if (message.type === 'PAYMENT_ERROR') {
                          onPaymentError(message.message || 'Payment failed');
                        } else if (message.type === 'CONTENT_HEIGHT') {
                          // Lets the sheet shrink to the gateway's actual height
                          // rather than always occupying a fixed slice of screen.
                          settleHeight(message.height);
                        }
                      } catch {
                        // The raw payload is not logged: anything the gateway page
                        // posts that fails to parse may still contain payer data.
                        if (__DEV__)
                          console.log('Non-JSON message from WebView');
                      }
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    mixedContentMode="compatibility"
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    originWhitelist={['https://*', 'http://*']}
                    setSupportMultipleWindows={false}
                    thirdPartyCookiesEnabled={true}
                    sharedCookiesEnabled={true}
                    cacheEnabled={true}
                    allowsBackForwardNavigationGestures={true}
                    allowsFullscreenVideo={true}
                    injectedJavaScript={`
                    // Only set viewport meta, don't override MyFatoorah styles
                    (function() {
                      var meta = document.querySelector('meta[name="viewport"]');
                      if (!meta) {
                        meta = document.createElement('meta');
                        meta.name = 'viewport';
                        document.head.appendChild(meta);
                      }
                      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                    })();
                    true;
                  `}
                    userAgent={Platform.select({
                      android:
                        'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
                      ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
                    })}
                  />
                )}
                {/* Stays outside the gate so the sheet is never empty while it
                    slides in — the loader covers the wait for the WebView. */}
                {(!sheetShown ||
                  loading ||
                  !gatewayReady ||
                  verifyingPayment) && (
                  <View style={styles.loadingOverlay}>
                    <LogoLoader />
                    <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                      {verifyingPayment
                        ? isRTL
                          ? 'جاري التحقق من الدفع...'
                          : 'Verifying payment...'
                        : t('loadingPayment') || 'Loading payment page...'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Text style={[styles.secureText, isRTL && styles.rtlText]}>
              {t('securePayment') || 'Secured by MyFatoorah'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetFallbackHeight: {
    // Close to what the gateway settles at, so the first paint is roughly the
    // final size. Opening at 80% made the sheet visibly collapse once the real
    // height arrived.
    height: '62%',
  },
  modalContent: {
    backgroundColor: colors.textWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.textWhite,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  simpleHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  simpleCloseButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  placeholder: {
    width: 32,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.textWhite,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.textWhite,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.textWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelLink: {
    paddingVertical: 8,
  },
  cancelLinkText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.textWhite,
  },
  secureText: {
    fontSize: 14,
    color: colors.textLight,
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default PaymentWebView;
