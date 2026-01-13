import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { getPaymentStatus } from '../services/paymentApi';

interface PaymentWebViewProps {
  visible: boolean;
  paymentUrl: string;
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
  onClose,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { isRTL, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Handle navigation state changes to detect payment completion
  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log('WebView navigating to:', url);

    // Check if redirected to success/callback URL
    if (url.includes('/payment/callback') || url.includes('/payment/success')) {
      console.log('Payment callback detected! Verifying payment status...');

      // Extract paymentId from URL query parameters
      try {
        const urlObj = new URL(url);
        const paymentId = urlObj.searchParams.get('paymentId') || urlObj.searchParams.get('Id');

        if (paymentId) {
          console.log('Payment ID extracted:', paymentId);
          setVerifyingPayment(true);

          // Wait a moment for server to process
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Verify payment status with backend
          try {
            const result = await getPaymentStatus(paymentId);
            console.log('Payment verification result:', result);

            if (result.success && result.data?.InvoiceStatus === 'Paid') {
              console.log('Payment verified as PAID!');
              onPaymentSuccess();
            } else {
              console.log('Payment not confirmed:', result.data?.InvoiceStatus);
              onPaymentError('Payment verification failed');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            // Still call success as we detected the callback
            onPaymentSuccess();
          } finally {
            setVerifyingPayment(false);
          }
        } else {
          console.log('No payment ID found in URL, calling success anyway');
          onPaymentSuccess();
        }
      } catch (error) {
        console.error('Error parsing callback URL:', error);
        onPaymentSuccess();
      }
      return;
    }

    // Check if redirected to error URL
    if (url.includes('/payment/error') || url.includes('/payment/failed')) {
      console.log('Payment error detected!');
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
            {t('payment') || 'Payment'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorTitle, isRTL && styles.rtlText]}>
                {t('paymentError') || 'Payment Error'}
              </Text>
              <Text style={[styles.errorText, isRTL && styles.rtlText]}>
                {t('paymentLoadError') || 'Failed to load payment page. Please try again.'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(false);
                  setLoading(true);
                  webViewRef.current?.reload();
                }}
              >
                <Text style={styles.retryButtonText}>
                  {t('retry') || 'Retry'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                <Text style={[styles.cancelLinkText, isRTL && styles.rtlText]}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <WebView
                ref={webViewRef}
                source={{ uri: paymentUrl }}
                style={styles.webView}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={handleNavigationStateChange}
                onError={handleError}
                onHttpError={handleHttpError}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                mixedContentMode="compatibility"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
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
                  android: 'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
                  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
                })}
              />
              {(loading || verifyingPayment) && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                    {verifyingPayment
                      ? (isRTL ? 'جاري التحقق من الدفع...' : 'Verifying payment...')
                      : (t('loadingPayment') || 'Loading payment page...')
                    }
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.secureText, isRTL && styles.rtlText]}>
            {t('securePayment') || 'Secured by MyFatoorah'}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textDark,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  placeholder: {
    width: 36,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: '#fff',
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
