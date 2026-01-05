import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';

interface PaymentWebViewProps {
  visible: boolean;
  paymentUrl: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

/**
 * PaymentWebView Component
 * Opens the MyFatoorah payment URL in an external browser
 * Since we don't have react-native-webview installed, we use Linking.openURL
 * The payment callback will be handled when user returns to the app
 */
const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  paymentUrl,
  onClose,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { isRTL, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const openPaymentInBrowser = async () => {
    try {
      setLoading(true);
      console.log('Opening payment URL:', paymentUrl);
      
      // Try to open URL directly - canOpenURL on Android requires special manifest config
      // which is unnecessary for http/https URLs that the browser can always handle
      try {
        await Linking.openURL(paymentUrl);
        console.log('Payment URL opened successfully');
        // After opening browser, user will complete payment there
        // The callback URL will redirect back or user will manually return
        onPaymentSuccess();
      } catch (openError: any) {
        console.error('Failed to open URL directly:', openError);
        // Fallback: check if supported
        const supported = await Linking.canOpenURL(paymentUrl);
        console.log('canOpenURL result:', supported);
        if (supported) {
          await Linking.openURL(paymentUrl);
          onPaymentSuccess();
        } else {
          onPaymentError('Cannot open payment URL. Please copy this link and open in your browser.');
        }
      }
    } catch (error: any) {
      console.error('Error opening payment URL:', error);
      onPaymentError(error.message || 'Failed to open payment page');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
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

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.paymentIcon}>💳</Text>
          </View>
          
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            {t('completePayment') || 'Complete Your Payment'}
          </Text>
          
          <Text style={[styles.description, isRTL && styles.rtlText]}>
            {t('paymentRedirectMessage') ||
              'You will be redirected to our secure payment page to complete your transaction.'}
          </Text>

          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={openPaymentInBrowser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                {t('proceedToPayment') || 'Proceed to Payment'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, isRTL && styles.rtlText]}>
              {t('cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.secureText, isRTL && styles.rtlText]}>
            🔒 {t('securePayment') || 'Secured by MyFatoorah'}
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
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  secureText: {
    marginTop: 24,
    fontSize: 14,
    color: colors.textLight,
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default PaymentWebView;
