import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Share,
} from 'react-native';
import Svg, { Circle, Path, Polyline, Line } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { styles } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ReceiptData {
  status: 'success' | 'pending' | 'failed';
  bookingId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  invoiceId?: string;
  referenceId?: string;
  services: { name: string; quantity: number; total: number }[];
  paidAt?: string | Date;
  errorMessage?: string;
}

interface PaymentReceiptModalProps {
  visible: boolean;
  receiptData: ReceiptData | null;
  onClose: () => void;
}

const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  visible,
  receiptData,
  onClose,
}) => {
  const { isRTL, t } = useLanguage();

  if (!receiptData) return null;

  const {
    status,
    bookingId,
    amount,
    currency = 'KWD',
    paymentMethod,
    transactionId,
    invoiceId,
    referenceId,
    services = [],
    paidAt,
    errorMessage,
  } = receiptData;

  const isSuccess = status === 'success';
  const isPending = status === 'pending';
  const isFailed = status === 'failed';

  let formattedDate = '';
  try {
    const dateObj = paidAt ? new Date(paidAt) : new Date();
    formattedDate = dateObj.toLocaleString(isRTL ? 'ar-KW' : 'en-KW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    formattedDate = paidAt ? String(paidAt) : '';
  }

  const renderIcon = () => {
    if (isSuccess) {
      return (
        <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth="2" />
          <Path
            d="M8 12l3 3 5-5"
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    }
    if (isPending) {
      return (
        <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
          <Line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          <Line x1="12" y1="16" x2="12.01" y2="16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    }
    return (
      <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
        <Line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <Line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  };

  const getStatusText = () => {
    if (isSuccess) return isRTL ? 'تم الدفع بنجاح' : 'Payment Successful';
    if (isPending) return isRTL ? 'جاري معالجة الدفع' : 'Payment Processing';
    return isRTL ? 'فشل الدفع' : 'Payment Failed';
  };

  const getTitle = () => {
    if (isSuccess) return isRTL ? 'شكراً لك على الدفع!' : 'Thank you for your payment!';
    if (isPending) return isRTL ? 'جاري معالجة دفعتك' : 'Your payment is being processed';
    return isRTL ? 'لم يتم الدفع بنجاح' : 'Payment was not successful';
  };

  const getSubtitle = () => {
    if (isSuccess) return isRTL ? 'تم تأكيد حجزك. تم إرسال بريد إلكتروني للتأكيد.' : 'Your booking has been confirmed. A confirmation email has been sent to you.';
    if (isPending) return isRTL ? 'نحن نؤكد دفعتك. يرجى الانتظار - قد يستغرق ذلك بضع لحظات. سيتم إعلامك بمجرد التأكيد.' : 'We are confirming your payment. Please wait — this may take a few moments. You will be notified once confirmed.';
    return errorMessage || (isRTL ? 'لم نتمكن من معالجة دفعتك. لم يتم خصم أي مبلغ. يرجى المحاولة مرة أخرى.' : 'Your payment could not be processed. No charge has been made. Please try again.');
  };

  const getAccentColor = () => {
    if (isSuccess) return colors.primary;
    if (isPending) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getBgColor = () => {
    if (isSuccess) return 'rgba(0, 105, 92, 0.05)';
    if (isPending) return 'rgba(245, 158, 11, 0.05)';
    return 'rgba(239, 68, 68, 0.05)';
  };

  const handleShare = async () => {
    try {
      const servicesText = services.map(s => `- ${s.name} x${s.quantity}: ${s.total.toFixed(3)} ${currency}`).join('\n');
      const message = `${isRTL ? 'فاتورة الدفع من مسرة' : 'Payment Receipt from Masarra'}
      
${isRTL ? 'حالة الدفع' : 'Status'}: ${getStatusText()}
${isRTL ? 'رقم الحجز' : 'Booking Reference'}: ${bookingId}
${isRTL ? 'التاريخ والوقت' : 'Date & Time'}: ${formattedDate}
${amount != null ? `${isRTL ? 'المبلغ المخصوم' : 'Amount Charged'}: ${amount.toFixed(3)} ${currency}` : ''}
${paymentMethod ? `${isRTL ? 'طريقة الدفع' : 'Payment Method'}: ${paymentMethod}` : ''}
${invoiceId ? `${isRTL ? 'رقم الفاتورة' : 'Invoice ID'}: ${invoiceId}` : ''}
${transactionId ? `${isRTL ? 'رقم المعاملة' : 'Transaction ID'}: ${transactionId}` : ''}
${referenceId ? `${isRTL ? 'الرقم المرجعي' : 'Reference ID'}: ${referenceId}` : ''}

${isRTL ? 'الخدمات' : 'Services'}:
${servicesText}

${amount != null ? `${isRTL ? 'المجموع' : 'Total'}: ${amount.toFixed(3)} ${currency}` : ''}`;

      await Share.share({
        message,
        title: isRTL ? 'فاتورة الدفع' : 'Payment Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Strip */}
          <View style={[styles.headerStrip, { backgroundColor: getAccentColor() }]} />

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Status Section */}
            <View style={styles.statusSection}>
              <View style={[styles.iconRing, { backgroundColor: getBgColor(), borderColor: getBgColor() }]}>
                {renderIcon()}
              </View>

              <View style={[styles.badge, { backgroundColor: getBgColor(), borderColor: getBgColor() }]}>
                <Text style={[styles.badgeText, { color: getAccentColor() }]}>
                  {getStatusText()}
                </Text>
              </View>

              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{isRTL ? 'الفاتورة' : 'RECEIPT'}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              {/* Booking Reference */}
              <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'رقم الحجز' : 'Booking Reference'}</Text>
                <Text style={[styles.detailValueMono, isRTL && styles.detailValueMonoRTL]}>{bookingId}</Text>
              </View>

              {/* Date & Time */}
              <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</Text>
                <Text style={[styles.detailValue, isRTL && styles.detailValueRTL]}>{formattedDate}</Text>
              </View>

              {/* Amount Charged */}
              {amount != null && (
                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'المبلغ المخصوم' : 'Amount Charged'}</Text>
                  <Text style={[styles.detailValue, isRTL && styles.detailValueRTL, { fontWeight: '700', color: '#111827' }]}>
                    {amount.toFixed(3)} {currency}
                  </Text>
                </View>
              )}

              {/* Payment Method */}
              {paymentMethod && (
                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'طريقة الدفع' : 'Payment Method'}</Text>
                  <Text style={[styles.detailValue, isRTL && styles.detailValueRTL]}>{paymentMethod}</Text>
                </View>
              )}

              {/* Invoice ID */}
              {invoiceId && (
                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'رقم الفاتورة' : 'Invoice ID'}</Text>
                  <Text style={[styles.detailValueMono, isRTL && styles.detailValueMonoRTL]}>{invoiceId}</Text>
                </View>
              )}

              {/* Transaction ID */}
              {transactionId && (
                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'رقم المعاملة' : 'Transaction ID'}</Text>
                  <Text style={[styles.detailValueMono, isRTL && styles.detailValueMonoRTL]}>{transactionId}</Text>
                </View>
              )}

              {/* Reference ID */}
              {referenceId && (
                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Text style={[styles.detailLabel, isRTL && styles.detailLabelRTL]}>{isRTL ? 'الرقم المرجعي' : 'Reference ID'}</Text>
                  <Text style={[styles.detailValueMono, isRTL && styles.detailValueMonoRTL]}>{referenceId}</Text>
                </View>
              )}

              {/* Services List */}
              {services.length > 0 && (
                <View style={styles.servicesContainer}>
                  <Text style={[styles.servicesTitle, isRTL && styles.servicesTitleRTL]}>
                    {isRTL ? 'الخدمات المدفوعة' : 'SERVICES PAID'}
                  </Text>
                  {services.map((svc, idx) => (
                    <View key={idx} style={[styles.serviceRow, isRTL && styles.serviceRowRTL]}>
                      <Text style={[styles.serviceName, isRTL && styles.serviceNameRTL]} numberOfLines={1}>
                        {svc.name || (isRTL ? 'خدمة' : 'Service')}
                        {svc.quantity > 1 && ` × ${svc.quantity}`}
                      </Text>
                      <Text style={[styles.serviceTotal, isRTL && styles.serviceTotalRTL]}>
                        {svc.total.toFixed(3)} {currency}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Total Row */}
              {amount != null && (
                <View style={[styles.totalRow, isRTL && styles.totalRowRTL]}>
                  <Text style={[styles.totalLabel, isRTL && styles.totalLabelRTL]}>{isRTL ? 'المجموع' : 'Total'}</Text>
                  <Text style={[styles.totalValue, isRTL && styles.totalValueRTL]}>
                    {amount.toFixed(3)} {currency}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <View style={styles.actionsRow}>
                {isSuccess && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                    <Text style={styles.shareButtonText}>{isRTL ? 'مشاركة / طباعة' : 'Share / Print'}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.closeButton, !isSuccess && { flex: 1 }]}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>{isRTL ? 'إغلاق' : 'Close'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isRTL 
                  ? 'هذه الفاتورة تم إنشاؤها تلقائياً. معالجة الدفع الآمنة تتم بواسطة MyFatoorah.' 
                  : 'This receipt is auto-generated. Secure payment processed by MyFatoorah.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default PaymentReceiptModal;
