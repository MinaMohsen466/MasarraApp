import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';
import { getUserDashboardBookings, Booking } from '../services/api';
import { API_URL } from '../config/api.config';
import { colors } from '../constants/colors';
import {
  getPendingServicesForPayment,
  sendPayment,
} from '../services/paymentApi';
import { useLanguage } from '../contexts/LanguageContext';
import { orderHistoryStyles as styles } from './orderHistoryStyles';
import { QRFormModal } from '../components/QRCodeCard/QRFormModal';
import { CustomAlert } from '../components/CustomAlert';
import PaymentWebView from '../components/PaymentWebView';
import PaymentReceiptModal from '../components/PaymentReceiptModal/PaymentReceiptModal';
import {
  getQRCodeByBooking,
  canCreateQRCode,
  getQRCodeSettings,
} from '../services/qrCodeApi';

interface OrderHistoryProps {
  onBack?: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  onBack,
}) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [qrAllowedBookings, setQrAllowedBookings] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [timeLeftMap, setTimeLeftMap] = useState<{ [key: string]: number }>({});
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(
    new Set(),
  );
  const [payingBookings, setPayingBookings] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<
    Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  >([]);

  // PaymentWebView state
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentPayingBooking, setCurrentPayingBooking] = useState<
    string | null
  >(null);

  // Receipt Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<any>(null);

  // Payment timeout in milliseconds (10 minutes)
  const PAYMENT_TIMEOUT = 10 * 60 * 1000;

  const filterBookingsByStatus = useCallback(
    (items: Booking[], filter: string) => {
      if (filter === 'all') {
        return items;
      }

      return items.filter(
        booking => booking.status.toLowerCase() === filter.toLowerCase(),
      );
    },
    [],
  );

  useEffect(() => {
    loadBookings();
  }, []);

  // Derive filteredBookings directly during render to prevent state-update lag and visual flashing
  const filteredBookings = React.useMemo(() => {
    return filterBookingsByStatus(bookings, selectedFilter);
  }, [bookings, selectedFilter, filterBookingsByStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        setAlertTitle(isRTL ? 'خطأ' : 'Error');
        setAlertMessage(
          isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first',
        );
        setAlertButtons([
          {
            text: isRTL ? 'حسناً' : 'OK',
            style: 'default',
            onPress: () => {
              if (onBack) onBack();
            },
          },
        ]);
        setAlertVisible(true);
        setLoading(false);
        return;
      }

      const [data, settings] = await Promise.all([
        getUserDashboardBookings(token),
        getQRCodeSettings(token),
      ]);

      // Sort by creation date, newest first
      const sortedBookings = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setBookings(sortedBookings);

      // End loading immediately so user sees bookings right away
      setLoading(false);

      // Check which bookings are allowed for QR code (in background, non-blocking)
      // This way the user sees their bookings immediately, QR buttons appear when ready
      const promises = sortedBookings.map(booking =>
        canCreateQRCode(booking, settings, token)
          .then(canCreate => (canCreate ? booking._id : null))
          .catch(() => null),
      );

      // Run in background - don't await
      Promise.all(promises).then(results => {
        const allowed = new Set(results.filter(Boolean) as string[]);
        setQrAllowedBookings(allowed);
      });
    } catch (error) {
      setAlertTitle(isRTL ? 'خطأ' : 'Error');
      setAlertMessage(isRTL ? 'فشل تحميل الحجوزات' : 'Failed to load bookings');
      setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
      setAlertVisible(true);
      setLoading(false);
    }
  };

  const getConfirmedPendingServices = useCallback((booking: Booking) => {
    return (
      booking.services?.filter(
        (s: any) => s.paymentStatus === 'pending' && s.status === 'confirmed',
      ) || []
    );
  }, []);

  // Calculate time left for payment pending bookings
  const calculateTimeLeft = useCallback(
    (booking: Booking): number => {
      if (booking.status === 'cancelled') {
        return 0;
      }

      const confirmedServices = getConfirmedPendingServices(booking);

      if (confirmedServices.length === 0) {
        return 0;
      }

      const confirmedDates = confirmedServices
        .map((s: any) => s.confirmedAt || booking.createdAt)
        .filter(Boolean)
        .map((d: string) => new Date(d).getTime());

      if (confirmedDates.length === 0) return 0;

      const earliestConfirmed = Math.min(...confirmedDates);
      const expiryTime = earliestConfirmed + PAYMENT_TIMEOUT;
      const now = Date.now();

      return Math.max(0, expiryTime - now);
    },
    [PAYMENT_TIMEOUT, getConfirmedPendingServices],
  );

  // Start timer for pending payments
  useEffect(() => {
    const updateTimers = () => {
      const newTimeLeftMap: { [key: string]: number } = {};

      bookings.forEach(booking => {
        if (getConfirmedPendingServices(booking).length > 0) {
          const timeLeft = calculateTimeLeft(booking);
          newTimeLeftMap[booking._id] = timeLeft;
        }
      });

      setTimeLeftMap(newTimeLeftMap);
    };

    updateTimers();

    timerRef.current = setInterval(updateTimers, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [bookings, calculateTimeLeft, getConfirmedPendingServices]);

  // Format time left as MM:SS
  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isFreeBooking = (booking: Booking) => booking.totalPrice === 0;

  const isPaidOrFreeService = (serviceEntry: any, booking: Booking) => {
    return (
      serviceEntry.price === 0 ||
      isFreeBooking(booking) ||
      serviceEntry.paymentStatus === 'paid' ||
      booking.paymentStatus === 'paid'
    );
  };

  const getEventEndTime = (booking: Booking) => {
    if (booking.eventTime?.end) {
      return new Date(booking.eventTime.end);
    }

    const eventDate = new Date(booking.eventDate);
    eventDate.setHours(23, 59, 59, 999);
    return eventDate;
  };

  const hasEventDatePassed = (booking: Booking) => {
    return getEventEndTime(booking) < new Date();
  };

  const hasPaymentWindowExpired = (booking: Booking) => {
    const timeLeft = timeLeftMap[booking._id] ?? calculateTimeLeft(booking);
    return (
      getConfirmedPendingServices(booking).length > 0 &&
      timeLeft <= 0
    );
  };

  const getPendingPaymentPreviewTotal = (booking: Booking) => {
    const pendingServicesTotal = getConfirmedPendingServices(booking).reduce(
      (sum: number, s: any) => sum + s.price * (s.quantity || 1),
      0,
    );
    const pendingTotalRaw = pendingServicesTotal + (booking.deliveryFees || 0);

    if (
      booking.coupon &&
      booking.coupon.discountAmount > 0 &&
      booking.coupon.originalPrice > 0
    ) {
      const discountRatio =
        booking.coupon.discountAmount / booking.coupon.originalPrice;
      return pendingTotalRaw * (1 - discountRatio);
    }

    return pendingTotalRaw;
  };

  const getReceiptServices = (booking: Booking) => {
    return (booking.services || [])
      .filter((s: any) => s.paymentStatus === 'paid')
      .map((s: any) => ({
        name:
          s.service?.name ||
          s.service?.nameAr ||
          (isRTL ? 'Ø®Ø¯Ù…Ø©' : 'Service'),
        quantity: s.quantity || 1,
        total: s.price * (s.quantity || 1),
      }));
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setAlertTitle(isRTL ? 'تأكيد الإلغاء' : 'Confirm Cancellation');
    setAlertMessage(
      isRTL
        ? 'هل أنت متأكد من إلغاء هذا الطلب؟'
        : 'Are you sure you want to cancel this order?',
    );
    setAlertButtons([
      { text: isRTL ? 'لا' : 'NO', style: 'cancel' },
      {
        text: isRTL ? 'نعم' : 'YES',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancellingBookings(prev => new Set(prev).add(bookingId));
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
              setAlertTitle(isRTL ? 'خطأ' : 'Error');
              setAlertMessage(isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
              setAlertButtons([
                { text: isRTL ? 'حسناً' : 'OK', style: 'default' },
              ]);
              setAlertVisible(true);
              return;
            }

            const response = await fetch(
              `${API_URL}/bookings/${bookingId}/cancel`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            if (response.ok) {
              setAlertTitle(isRTL ? 'تم الإلغاء' : 'Cancelled');
              setAlertMessage(
                isRTL ? 'تم إلغاء الطلب بنجاح' : 'Order cancelled successfully',
              );
              setAlertButtons([
                {
                  text: isRTL ? 'حسناً' : 'OK',
                  style: 'default',
                  onPress: () => {
                    loadBookings();
                  },
                },
              ]);
              setAlertVisible(true);
            } else {
              throw new Error('Failed to cancel');
            }
          } catch (error) {
            setAlertTitle(isRTL ? 'خطأ' : 'Error');
            setAlertMessage(
              isRTL ? 'فشل إلغاء الطلب' : 'Failed to cancel order',
            );
            setAlertButtons([
              { text: isRTL ? 'حسناً' : 'OK', style: 'default' },
            ]);
            setAlertVisible(true);
          } finally {
            setCancellingBookings(prev => {
              const newSet = new Set(prev);
              newSet.delete(bookingId);
              return newSet;
            });
          }
        },
      },
    ]);
    setAlertVisible(true);
  };

  // Pay now - open payment link
  const handlePayNow = async (booking: Booking) => {
    try {
      setPayingBookings(prev => new Set(prev).add(booking._id));
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        setAlertTitle(isRTL ? 'خطأ' : 'Error');
        setAlertMessage(isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
        setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      // Use the same pending-payment calculation as the web checkout flow.
      const pendingResponse = await getPendingServicesForPayment(booking._id);
      const pendingData = pendingResponse.data;
      const pendingServices = pendingData?.pendingServices || [];
      const pendingAmount =
        pendingData?.pendingTotalRaw || pendingData?.pendingTotal || 0;

      if (!pendingResponse.success || pendingServices.length === 0) {
        setAlertTitle(isRTL ? 'تنبيه' : 'Info');
        setAlertMessage(
          isRTL ? 'لا يوجد مبلغ مستحق للدفع' : 'No pending amount to pay',
        );
        setAlertButtons([
          {
            text: isRTL ? 'حسناً' : 'OK',
            style: 'default',
          },
        ]);
        setAlertVisible(true);
        await loadBookings();
        return;
      }

      if (pendingAmount <= 0) {
        setAlertTitle(isRTL ? 'تنبيه' : 'Info');
        setAlertMessage(
          isRTL ? 'لا يوجد مبلغ مستحق للدفع' : 'No pending amount to pay',
        );
        setAlertButtons([
          {
            text: isRTL ? 'حسنًا' : 'OK',
            style: 'default',
          },
        ]);
        setAlertVisible(true);
        return;
      }

      // Get user info from AsyncStorage
      const userStr = await AsyncStorage.getItem('userData');
      const user = userStr ? JSON.parse(userStr) : null;

      // Prepare invoice items
      const invoiceItems = pendingServices.map((s: any) => ({
        ItemName: isRTL && s.nameAr ? s.nameAr : s.name || 'Service',
        Quantity: s.quantity || 1,
        UnitPrice:
          (s.discountedTotal || s.total || s.price) / (s.quantity || 1),
      }));

      const response = await sendPayment({
        bookingId: booking._id,
        invoiceValue: pendingAmount,
        customerName: user?.name || user?.firstName || 'Customer',
        customerEmail: user?.email || '',
        customerMobile:
          user?.phoneNumber?.replace(/^\+965/, '').replace(/\s/g, '') || '',
        mobileCountryCode: '965',
        displayCurrencyIso: 'KWD',
        language: isRTL ? 'ar' : 'en',
        invoiceItems,
        notificationOption: 'LNK',
      });

      if (response.success && response.data?.invoiceURL) {
        // Open payment in WebView instead of external browser
        setPaymentUrl(response.data.invoiceURL);
        setCurrentPayingBooking(booking._id);
        setShowPaymentWebView(true);
      } else {
        throw new Error(response.message || 'Failed to create payment link');
      }
    } catch (error: any) {
      setAlertTitle(isRTL ? 'خطأ' : 'Error');
      setAlertMessage(
        error.message ||
          (isRTL ? 'فشل إنشاء رابط الدفع' : 'Failed to create payment link'),
      );
      setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
      setAlertVisible(true);
    } finally {
      setPayingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(booking._id);
        return newSet;
      });
    }
  };

  // Handle payment success from WebView
  const handlePaymentSuccess = async () => {
    setShowPaymentWebView(false);
    setPaymentUrl('');
    if (currentPayingBooking) {
      setPayingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentPayingBooking);
        return newSet;
      });
    }
    setCurrentPayingBooking(null);

    // Wait longer for the server to process the callback (increased to 3 seconds)
    await new Promise<void>(resolve => setTimeout(resolve, 3000));

    // Reload bookings to get updated status
    await loadBookings();

    // Show success alert
    setAlertTitle(isRTL ? 'نجح الدفع' : 'Payment Success');
    setAlertMessage(
      isRTL
        ? 'تم الدفع بنجاح! تم تحديث حالة طلبك.'
        : 'Payment completed successfully! Your order status has been updated.',
    );
    setAlertButtons([
      {
        text: isRTL ? 'حسناً' : 'OK',
        style: 'default',
      },
    ]);
    setAlertVisible(true);
  };

  // Handle payment error from WebView
  const handlePaymentError = (error: string) => {
    setShowPaymentWebView(false);
    setPaymentUrl('');
    if (currentPayingBooking) {
      setPayingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentPayingBooking);
        return newSet;
      });
    }
    setCurrentPayingBooking(null);

    // Show error alert
    setAlertTitle(isRTL ? 'فشل الدفع' : 'Payment Failed');
    setAlertMessage(
      error ||
        (isRTL
          ? 'لم يتم إكمال الدفع. يرجى المحاولة مرة أخرى.'
          : 'Payment was not completed. Please try again.'),
    );
    setAlertButtons([
      {
        text: isRTL ? 'حسناً' : 'OK',
        style: 'default',
      },
    ]);
    setAlertVisible(true);
  };

  // Handle payment WebView close
  const handlePaymentClose = () => {
    setShowPaymentWebView(false);
    setPaymentUrl('');
    if (currentPayingBooking) {
      setPayingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentPayingBooking);
        return newSet;
      });
    }
    setCurrentPayingBooking(null);
  };

  const applyFilter = (filter: string) => {
    setSelectedFilter(filter);
  };

  // Helper to get single service name
  const getSingleServiceName = (service: any) => {
    if (!service || typeof service === 'string')
      return isRTL ? 'خدمة' : 'Service';
    return isRTL
      ? service?.nameAr || service?.name || 'خدمة'
      : service?.name || 'Service';
  };

  // Helper to get vendor name from service entry
  const getServiceVendorName = (serviceEntry: any) => {
    const vendor = serviceEntry?.vendor;
    if (!vendor || typeof vendor !== 'object')
      return isRTL ? 'مقدم الخدمة' : 'Vendor';
    return isRTL
      ? vendor?.nameAr ||
          vendor?.vendorProfile?.businessName_ar ||
          vendor?.name ||
          'مقدم الخدمة'
      : vendor?.name || vendor?.vendorProfile?.businessName || 'Vendor';
  };

  const formatDateTime = (dateString: string, isTime: boolean = false) => {
    const date = new Date(dateString);
    if (isTime) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')} ${ampm}`;
    }
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getStatusStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    const colors: { [key: string]: string } = {
      confirmed: '#4CAF50',
      pending: '#FF9800',
      cancelled: '#F44336',
      completed: '#2196F3',
    };
    const labels: { [key: string]: { ar: string; en: string } } = {
      confirmed: { ar: 'مؤكد', en: 'Confirmed' },
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
      completed: { ar: 'مكتمل', en: 'Completed' },
    };
    return {
      color: colors[statusLower] || '#757575',
      text: isRTL
        ? labels[statusLower]?.ar || status
        : labels[statusLower]?.en ||
          status.charAt(0).toUpperCase() + status.slice(1),
    };
  };

  // Get total price from booking - use totalPrice directly from database
  const getTotalPrice = (booking: Booking): number => {
    // Use totalPrice from booking as it already includes quantity and options
    return booking.totalPrice || 0;
  };

  const handleQRCode = async (booking: Booking) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setAlertTitle(isRTL ? 'خطأ' : 'Error');
        setAlertMessage(
          isRTL ? 'لم يتم العثور على رمز التوثيق' : 'Authentication required',
        );
        setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      // No need to check canCreateQRCode here - button only shows for allowed bookings
      const existingQR = await getQRCodeByBooking(token, booking._id);
      setSelectedBooking(booking);
      setSelectedQRCode(existingQR);
      setQrModalVisible(true);
    } catch (error) {
      setAlertTitle(isRTL ? 'خطأ' : 'Error');
      setAlertMessage(isRTL ? 'حدث خطأ' : 'An error occurred');
      setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  };

  if (loading) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primary}
          translucent={false}
        />
        <View style={{ flex: 1, backgroundColor: colors.primary }}>
          <View
            style={{ height: insets.top, backgroundColor: colors.primary }}
          />
          <View style={styles.container}>
            {/* Header background */}
            <View style={[styles.headerBackground, { height: 56 }]} />

            <View style={[styles.headerBar, isRTL && styles.headerBarRTL]}>
              {onBack && (
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={onBack}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.headerBackIcon,
                      isRTL && styles.headerBackTextRTL,
                    ]}
                  >
                    {isRTL ? '›' : '‹'}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
                {isRTL ? 'سجل الطلبات' : 'Order History'}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
        <View style={styles.container}>
          {/* Header background */}
          <View style={[styles.headerBackground, { height: 56 }]} />

          {/* Header */}
          <View style={[styles.headerBar, isRTL && styles.headerBarRTL]}>
            {onBack && (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={onBack}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.headerBackIcon,
                    isRTL && styles.headerBackTextRTL,
                  ]}
                >
                  {isRTL ? '›' : '‹'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
              {isRTL ? 'سجل الطلبات' : 'Order History'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => applyFilter('all')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === 'all' && styles.filterButtonTextActive,
                  ]}
                >
                  {isRTL ? 'الكل' : 'All'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'confirmed' && styles.filterButtonActive,
                ]}
                onPress={() => applyFilter('confirmed')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === 'confirmed' &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {isRTL ? 'مؤكد' : 'Confirmed'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'pending' && styles.filterButtonActive,
                ]}
                onPress={() => applyFilter('pending')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === 'pending' &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {isRTL ? 'قيد' : 'Pending'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'completed' && styles.filterButtonActive,
                ]}
                onPress={() => applyFilter('completed')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === 'completed' &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {isRTL ? 'مكتمل' : 'Completed'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'cancelled' && styles.filterButtonActive,
                ]}
                onPress={() => applyFilter('cancelled')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === 'cancelled' &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {isRTL ? 'ملغي' : 'Cancelled'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredBookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selectedFilter === 'all'
                    ? isRTL
                      ? 'لا توجد حجوزات بعد'
                      : 'No bookings yet'
                    : isRTL
                    ? 'لا توجد حجوزات في هذه الفئة'
                    : 'No bookings in this category'}
                </Text>
              </View>
            ) : (
              filteredBookings.map(booking => (
                <View key={booking._id} style={styles.bookingCard}>
                  {/* Solid Full-Width Card Header */}
                  <View style={[styles.cardHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {isRTL ? 'رقم الطلب:: ' : 'Order ID: '}
                      {booking._id}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusStyle(booking.status).text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    {/* Items Section Header */}
                    {booking.services && booking.services.length > 0 && (
                      <View style={[styles.itemsHeader, isRTL && { flexDirection: 'row-reverse' }, { gap: 6 }]}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2}>
                          <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          <Polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                          <Line x1="12" y1="22.08" x2="12" y2="12"/>
                        </Svg>
                        <Text style={styles.itemsTitle}>
                          {isRTL ? 'العناصر' : 'Items'}
                        </Text>
                      </View>
                    )}

                    {/* Booked Services Inner Boxes */}
                    {booking.services && booking.services.length > 0 && (
                      <View style={styles.customInputsContainer}>
                        {booking.services.map(
                          (serviceEntry: any, serviceIndex: number) => {
                            const serviceName = getSingleServiceName(
                              serviceEntry.service,
                            );
                            const isPaid = isPaidOrFreeService(
                              serviceEntry,
                              booking,
                            );

                            return (
                              <View
                                key={serviceIndex}
                                style={{
                                  backgroundColor: 'rgba(0, 161, 156, 0.02)',
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  borderRadius: 8,
                                  padding: 12,
                                  marginBottom: serviceIndex < booking.services.length - 1 ? 10 : 0,
                                  flexDirection: isRTL ? 'row-reverse' : 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                {/* Info side (Right-aligned in RTL, Left-aligned in LTR) */}
                                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, textAlign: isRTL ? 'right' : 'left' }}>
                                    {serviceName}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                                    {getServiceVendorName(serviceEntry)}
                                  </Text>

                                  {/* Date & Time Row with SVG Icons */}
                                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 6, gap: 12 }}>
                                    {/* Date */}
                                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2}>
                                        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <Line x1="16" y1="2" x2="16" y2="6"/>
                                        <Line x1="8" y1="2" x2="8" y2="6"/>
                                        <Line x1="3" y1="10" x2="21" y2="10"/>
                                      </Svg>
                                      <Text style={{ fontSize: 11, color: '#666' }}>
                                        {formatDateTime(
                                          serviceEntry.timeSlot?.start ||
                                            serviceEntry.eventDate ||
                                            booking.eventDate,
                                        )}
                                      </Text>
                                    </View>

                                    {/* Time */}
                                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2}>
                                        <Circle cx="12" cy="12" r="10"/>
                                        <Polyline points="12 6 12 12 16 14"/>
                                      </Svg>
                                      <Text style={{ fontSize: 11, color: '#666' }}>
                                        {formatDateTime(
                                          serviceEntry.timeSlot?.start ||
                                            booking.eventTime?.start,
                                          true,
                                        )}
                                        {' - '}
                                        {formatDateTime(
                                          serviceEntry.timeSlot?.end ||
                                            booking.eventTime?.end,
                                          true,
                                        )}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Custom Options */}
                                  {serviceEntry.customInputs && serviceEntry.customInputs.length > 0 && (
                                    <View
                                      style={{
                                        marginTop: 8,
                                        width: '100%',
                                        paddingTop: 6,
                                        borderTopWidth: 1,
                                        borderTopColor: 'rgba(0, 0, 0, 0.05)',
                                        alignItems: isRTL ? 'flex-end' : 'flex-start',
                                      }}
                                    >
                                      {serviceEntry.customInputs.map((opt: any, optIndex: number) => {
                                        const displayLabel = isRTL && opt.labelAr ? opt.labelAr : opt.label;
                                        const rawValue = isRTL && opt.valueAr ? opt.valueAr : opt.value;
                                        const displayValue = Array.isArray(rawValue)
                                          ? rawValue.join(', ')
                                          : rawValue;
                                        const hasPrice = typeof opt.price === 'number' && opt.price > 0;

                                        return (
                                          <View
                                            key={optIndex}
                                            style={{
                                              flexDirection: isRTL ? 'row-reverse' : 'row',
                                              alignItems: 'flex-start',
                                              marginVertical: 2,
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 11,
                                                color: colors.primary,
                                                marginRight: isRTL ? 0 : 4,
                                                marginLeft: isRTL ? 4 : 0,
                                                lineHeight: 16,
                                              }}
                                            >
                                              •
                                            </Text>
                                            <Text
                                              style={{
                                                fontSize: 12,
                                                textAlign: isRTL ? 'right' : 'left',
                                                flex: 1,
                                                lineHeight: 16,
                                              }}
                                            >
                                              <Text style={{ fontWeight: '600', color: '#374151' }}>
                                                {displayLabel}:{' '}
                                              </Text>
                                              <Text style={{ color: '#4B5563' }}>
                                                {displayValue}
                                              </Text>
                                              {hasPrice && (
                                                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '500' }}>
                                                  {` (+${opt.price.toFixed(3)} ${isRTL ? 'د.ك' : 'KWD'})`}
                                                </Text>
                                              )}
                                            </Text>
                                          </View>
                                        );
                                      })}
                                    </View>
                                  )}

                                </View>

                                {/* Price & Payment Status Badge (Left-aligned in RTL, Right-aligned in LTR) */}
                                <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', textAlign: isRTL ? 'left' : 'right' }}>
                                    {serviceEntry.price?.toFixed(3) || '0.000'} {isRTL ? 'د.ك' : 'KWD'}
                                  </Text>
                                  
                                  {/* Paid / Unpaid Status Badge */}
                                  <View
                                    style={{
                                      backgroundColor: isPaid ? '#E8F5E9' : '#FFF3E0',
                                      borderColor: isPaid ? '#C8E6C9' : '#FFE0B2',
                                      borderWidth: 1,
                                      borderRadius: 4,
                                      paddingHorizontal: 8,
                                      paddingVertical: 2,
                                      marginTop: 6,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        fontWeight: '700',
                                        color: isPaid ? '#2E7D32' : '#E65100',
                                      }}
                                    >
                                      {isPaid ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'غير مدفوع' : 'Unpaid')}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            );
                          }
                        )}
                      </View>
                    )}

                    {/* Price Container */}
                    <View style={[styles.priceContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                      {booking.coupon && booking.coupon.discountAmount > 0 ? (
                        <View style={{ flex: 1 }}>
                          {/* Original Price */}
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12, color: '#999' }}>
                              {isRTL ? 'المبلغ قبل الخصم:' : 'Original Amount:'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#999', textDecorationLine: 'line-through' }}>
                              {booking.coupon.originalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                          </View>

                          {/* Discount Amount */}
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12, color: '#4CAF50' }}>
                              {isRTL ? 'الخصم' : 'Discount'} ({booking.coupon.code}):
                            </Text>
                            <Text style={{ fontSize: 13, color: '#4CAF50', fontWeight: '600' }}>
                              - {booking.coupon.discountAmount.toFixed(3)} {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                          </View>

                          {/* Final Price */}
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={styles.priceLabel}>
                              {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                            </Text>
                            <Text style={styles.priceValue}>
                              {booking.totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.priceLabel}>
                            {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                          </Text>
                          <Text style={styles.priceValue}>
                            {getTotalPrice(booking).toFixed(3)} {isRTL ? 'د.ك' : 'KWD'}
                          </Text>
                        </>
                      )}
                    </View>

                  {/* Payment Pending Banner with Timer - Only for confirmed services that need payment */}
                  {(() => {
                    const isPaymentPending =
                      booking.paymentStatus === 'pending' &&
                      booking.totalPrice > 0;
                    const hasPendingPayment =
                      getConfirmedPendingServices(booking).length > 0;
                    const hasExpired = hasPaymentWindowExpired(booking);
                    const bookingTimeLeft = timeLeftMap[booking._id];

                    return booking.status !== 'cancelled' &&
                      !hasExpired &&
                      isPaymentPending &&
                      !isFreeBooking(booking) &&
                      booking.status !== 'pending' &&
                      booking.paymentStatus !== 'paid' &&
                      hasPendingPayment &&
                      bookingTimeLeft !== undefined ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor:
                            bookingTimeLeft > 0 ? '#FFF3E0' : '#FFEBEE',
                          borderWidth: 1,
                          borderColor:
                            bookingTimeLeft > 0 ? '#FFCC80' : '#EF9A9A',
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 16, marginRight: 8 }}>
                            💳
                          </Text>
                          <Text
                            style={{
                              color:
                                bookingTimeLeft > 0 ? '#E65100' : '#C62828',
                              fontSize: 13,
                              flex: 1,
                            }}
                          >
                            {isRTL ? 'الدفع معلق' : 'Payment Pending'}
                          </Text>
                        </View>
                        {bookingTimeLeft > 0 ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#FFCC80',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text style={{ fontSize: 12, marginRight: 4 }}>
                              ⏱
                            </Text>
                            <Text
                              style={{
                                color: '#E65100',
                                fontSize: 12,
                                fontWeight: '600',
                              }}
                            >
                              {formatTimeLeft(bookingTimeLeft)}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#EF9A9A',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: '#C62828',
                                fontWeight: '600',
                              }}
                            >
                              {isRTL ? 'انتهى الوقت' : 'Expired'}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : null;
                  })()}

                  {/* Awaiting Vendor Confirmation Banner */}
                  {booking.status !== 'cancelled' &&
                    !hasPaymentWindowExpired(booking) &&
                    booking.status === 'pending' && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#E3F2FD',
                          borderWidth: 1,
                          borderColor: '#90CAF9',
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <Text style={{ fontSize: 16, marginRight: 8 }}>⏳</Text>
                        <Text
                          style={{ color: '#1565C0', fontSize: 13, flex: 1 }}
                        >
                          {isRTL
                            ? 'في انتظار موافقة مقدم الخدمة'
                            : 'Awaiting vendor confirmation'}
                        </Text>
                      </View>
                    )}

                  {/* Pay Now, Cancel, and Receipt Buttons */}
                  {(() => {
                    // Only return early if booking is cancelled
                    if (booking.status === 'cancelled') {
                      return null;
                    }

                    const isFree = isFreeBooking(booking);
                    const hasPendingPayment =
                      getConfirmedPendingServices(booking).length > 0;
                    const hasExpired = hasPaymentWindowExpired(booking);
                    const eventDateHasPassed = hasEventDatePassed(booking);

                    const pendingTotal = getPendingPaymentPreviewTotal(booking);

                    const showPayButton =
                      hasPendingPayment &&
                      booking.paymentStatus !== 'paid' &&
                      !eventDateHasPassed &&
                      !hasExpired &&
                      booking.totalPrice > 0 &&
                      pendingTotal > 0;

                    const showCancelButton = false;

                    const showReceiptButton = booking.paymentStatus === 'paid';
                    const hasQR =
                      (booking.status === 'confirmed' ||
                        booking.status === 'completed') &&
                      (booking.paymentStatus === 'paid' || isFree) &&
                      qrAllowedBookings.has(booking._id);

                    if (!showPayButton && !showCancelButton && !showReceiptButton && !hasQR) return null;

                    return (
                      <View
                        style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          justifyContent: 'space-between',
                          marginTop: 14,
                          gap: 12,
                        }}
                      >
                        {/* View Receipt Button */}
                        {showReceiptButton && (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fff',
                              borderWidth: 1.5,
                              borderColor: colors.primary,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              gap: 8,
                            }}
                            onPress={() => {
                              setSelectedReceiptBooking(booking);
                              setShowReceiptModal(true);
                            }}
                          >
                            <Text
                              style={{
                                color: colors.primary,
                                fontSize: 13,
                                fontWeight: '600',
                              }}
                            >
                              {isRTL ? 'الفاتورة' : 'Receipt'}
                            </Text>
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth={2.5}>
                              <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                              <Polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
                              <Line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                              <Line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                              <Polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round"/>
                            </Svg>
                          </TouchableOpacity>
                        )}

                        {/* Create/View QR Code Button */}
                        {hasQR && (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.primary,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              gap: 8,
                            }}
                            onPress={() => handleQRCode(booking)}
                          >
                            <Text
                              style={{
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: '600',
                              }}
                            >
                              {isRTL ? 'رمز QR' : 'QR Code'}
                            </Text>
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <Rect x="3" y="3" width="6" height="6" rx="1" />
                              <Rect x="15" y="3" width="6" height="6" rx="1" />
                              <Rect x="3" y="15" width="6" height="6" rx="1" />
                              <Path d="M16 16h1v1h-1zm3 0h2v1h-2zm-3 3h2v2h-2zm6 1h1v1h-1zm-2-4h2v2h-2zm-3 0h1v2h-1z" fill="#fff" />
                            </Svg>
                          </TouchableOpacity>
                        )}

                        {/* Pay Now Button */}
                        {showPayButton && (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.primary,
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              gap: 8,
                            }}
                            onPress={() => handlePayNow(booking)}
                            disabled={payingBookings.has(booking._id)}
                          >
                            {payingBookings.has(booking._id) ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Text
                                  style={{
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: '600',
                                  }}
                                >
                                  {isRTL ? 'ادفع الآن' : 'Pay Now'}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}

                        {/* Cancel Order Button */}
                        {showCancelButton && (
                          <TouchableOpacity
                            style={{
                              flex: (showPayButton || showReceiptButton || hasQR) ? 0.5 : 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fff',
                              borderWidth: 1.5,
                              borderColor: '#dc3545',
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              gap: 6,
                            }}
                            onPress={() => handleCancelBooking(booking._id)}
                            disabled={cancellingBookings.has(booking._id)}
                          >
                            {cancellingBookings.has(booking._id) ? (
                              <ActivityIndicator size="small" color="#dc3545" />
                            ) : (
                              <>
                                <Text style={{ fontSize: 14, color: '#dc3545', fontWeight: 'bold' }}>✕</Text>
                                <Text
                                  style={{
                                    color: '#dc3545',
                                    fontSize: 13,
                                    fontWeight: '600',
                                  }}
                                >
                                  {isRTL ? 'إلغاء' : 'Cancel'}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}

                  {/* Action Buttons removed - each service now has its own buttons */}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {selectedBooking && (
            <QRFormModal
              visible={qrModalVisible}
              booking={selectedBooking}
              existingQRCode={selectedQRCode}
              onClose={() => {
                setQrModalVisible(false);
                setSelectedBooking(null);
                setSelectedQRCode(null);
              }}
               onSuccess={(_updatedQR, updatedGuestLimit) => {
                 if (selectedBooking) {
                   setBookings(prevBookings =>
                     prevBookings.map(b =>
                       b._id === selectedBooking._id
                         ? { ...b, guestLimit: updatedGuestLimit }
                         : b
                     )
                   );
                 }
                 loadBookings();
               }}
            />
          )}

          {/* CustomAlert */}
          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            buttons={alertButtons}
            onClose={() => setAlertVisible(false)}
          />

          {/* Payment WebView Modal */}
          <PaymentWebView
            visible={showPaymentWebView}
            paymentUrl={paymentUrl}
            onClose={handlePaymentClose}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />

          {/* Payment Receipt Modal */}
          <PaymentReceiptModal
            visible={showReceiptModal}
            receiptData={
              selectedReceiptBooking
                ? {
                    status: 'success',
                    bookingId: selectedReceiptBooking._id,
                    amount: selectedReceiptBooking.totalPrice,
                    currency: 'KWD',
                    paymentMethod:
                      selectedReceiptBooking.myFatoorahPayment?.paymentMethod,
                    transactionId:
                      selectedReceiptBooking.myFatoorahPayment?.transactionId,
                    invoiceId:
                      selectedReceiptBooking.myFatoorahPayment?.invoiceId,
                    referenceId:
                      selectedReceiptBooking.myFatoorahPayment?.referenceId,
                    services: getReceiptServices(selectedReceiptBooking),
                    paidAt:
                      selectedReceiptBooking.services?.find((s: any) => s.paidAt)
                        ?.paidAt ||
                      selectedReceiptBooking.updatedAt ||
                      selectedReceiptBooking.createdAt,
                  }
                : null
            }
            onClose={() => {
              setShowReceiptModal(false);
              setSelectedReceiptBooking(null);
            }}
          />
        </View>
      </View>
    </>
  );
};

export default OrderHistory;
