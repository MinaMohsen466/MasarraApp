/* eslint-disable @typescript-eslint/no-explicit-any, react-native/no-inline-styles */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  RefreshControl,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserDashboardBookings, Booking, requestBookingCancellation } from '../services/api';
import { API_URL } from '../config/api.config';
import { colors } from '../constants/colors';
import {
  getPendingServicesForPayment,
  sendPayment,
} from '../services/paymentApi';
import { useLanguage } from '../contexts/LanguageContext';
import { orderHistoryStyles as styles } from './orderHistoryStyles';
import { useNotification } from '../contexts/NotificationContext';
import { QRFormModal } from '../components/QRCodeCard/QRFormModal';
import { CustomAlert } from '../components/CustomAlert';
import PaymentWebView from '../components/PaymentWebView';
import PaymentReceiptModal from '../components/PaymentReceiptModal/PaymentReceiptModal';
import { CancellationRequestModal } from '../components/OrderHistory/CancellationRequestModal';
import {
  getQRCodeByBooking,
  canCreateQRCode,
  getQRCodeSettings,
} from '../services/qrCodeApi';

interface OrderHistoryProps {
  onBack?: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { checkBookingsStatusChanges } = useNotification();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [qrAllowedBookings, setQrAllowedBookings] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [timeLeftMap, setTimeLeftMap] = useState<{ [key: string]: number }>({});
  const [activeAlertBookingId, setActiveAlertBookingId] = useState<string | null>(null);
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(
    new Set(),
  );
  const [payingBookings, setPayingBookings] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cancellation Request State
  const [cancellationModalVisible, setCancellationModalVisible] = useState(false);
  const [selectedCancellationBooking, setSelectedCancellationBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submittingCancellation, setSubmittingCancellation] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<any>(null);

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
  const [selectedReceiptBooking, setSelectedReceiptBooking] =
    useState<any>(null);

  // Payment timeout in milliseconds (24 hours)
  const PAYMENT_TIMEOUT = 24 * 60 * 60 * 1000;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadBookings(true);
    } finally {
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive filteredBookings directly during render to prevent state-update lag and visual flashing
  const filteredBookings = React.useMemo(() => {
    return filterBookingsByStatus(bookings, selectedFilter);
  }, [bookings, selectedFilter, filterBookingsByStatus]);

  const loadBookings = async (
    forceRefresh: boolean = false,
  ): Promise<Booking[] | undefined> => {
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
        return undefined;
      }

      const [data, settings] = await Promise.all([
        getUserDashboardBookings(token),
        getQRCodeSettings(token, forceRefresh),
      ]);

      // Sort by creation date, newest first
      const sortedBookings = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setBookings(sortedBookings);

      // Check for changes in background
      checkBookingsStatusChanges(token);

      // End loading immediately so user sees bookings right away
      setLoading(false);

      // Check which bookings are allowed for QR code (in background, non-blocking)
      // This way the user sees their bookings immediately, QR buttons appear when ready
      const allowed = new Set<string>();
      for (const booking of sortedBookings) {
        try {
          const canCreate = await canCreateQRCode(booking, settings, token);
          if (canCreate) {
            allowed.add(booking._id);
          }
        } catch {
          // Skip this booking
        }
      }
      setQrAllowedBookings(allowed);
      return sortedBookings;
    } catch {
      setAlertTitle(isRTL ? 'خطأ' : 'Error');
      setAlertMessage(isRTL ? 'فشل تحميل الحجوزات' : 'Failed to load bookings');
      setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
      setAlertVisible(true);
      setLoading(false);
      return undefined;
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

      // If active alert booking timer is ticking, update the alert message
      if (activeAlertBookingId) {
        const booking = bookings.find(b => b._id === activeAlertBookingId);
        if (booking) {
          const timeLeft = newTimeLeftMap[activeAlertBookingId];
          if (timeLeft !== undefined && timeLeft > 0) {
            const timeStr = formatTimeLeft(timeLeft);
            setAlertMessage(
              isRTL
                ? `الطلب بانتظار سداد المبلغ. الوقت المتبقي للدفع: ${timeStr}`
                : `Payment is pending. Time left to complete payment: ${timeStr}`
            );
          } else {
            // Expired
            setAlertTitle(isRTL ? 'انتهت مهلة الدفع' : 'Payment Expired');
            setAlertMessage(
              isRTL
                ? 'لقد انتهت مهلة الدفع المحددة بـ 24 ساعة لهذا الطلب.'
                : 'The 24-hour payment window for this booking has expired.'
            );
          }
        }
      }
    };

    updateTimers();

    timerRef.current = setInterval(updateTimers, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [bookings, calculateTimeLeft, getConfirmedPendingServices, activeAlertBookingId, isRTL]);

  // Format time left as HH:MM:SS
  const formatTimeLeft = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    return getConfirmedPendingServices(booking).length > 0 && timeLeft <= 0;
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
          } catch {
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

  // Submit cancellation request (paid bookings)
  const handleSubmitCancellationRequest = async () => {
    if (!selectedCancellationBooking || !cancellationReason.trim()) return;

    try {
      setSubmittingCancellation(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setAlertTitle(isRTL ? 'خطأ' : 'Error');
        setAlertMessage(isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
        setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
        setAlertVisible(true);
        return;
      }

      const res = await requestBookingCancellation(
        token,
        selectedCancellationBooking._id,
        cancellationReason.trim(),
      );

      setCancellationResult(res);
      // Reload bookings to update status in the background
      loadBookings();
    } catch (error: any) {
      setCancellationResult({
        error: error.message || (isRTL ? 'فشل إرسال طلب الإلغاء' : 'Failed to submit cancellation request'),
      });
    } finally {
      setSubmittingCancellation(false);
    }
  };

  const closeCancellationModal = () => {
    setCancellationModalVisible(false);
    setSelectedCancellationBooking(null);
    setCancellationReason('');
    setCancellationResult(null);
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

    const payingId = currentPayingBooking;
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
    const updatedBookings = await loadBookings();

    if (updatedBookings && payingId) {
      const updatedBooking = updatedBookings.find(b => b._id === payingId);
      if (updatedBooking) {
        setSelectedReceiptBooking(updatedBooking);
        setShowReceiptModal(true);
      }
    }
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
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
    } catch {
      setAlertTitle(isRTL ? 'خطأ' : 'Error');
      setAlertMessage(isRTL ? 'حدث خطأ' : 'An error occurred');
      setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
      setAlertVisible(true);
    }
  };

  const handleShowStatusAlert = (booking: Booking) => {
    const hasExpired = hasPaymentWindowExpired(booking);
    const isPaymentPending = booking.paymentStatus === 'pending' && booking.totalPrice > 0;
    const hasPendingPayment = getConfirmedPendingServices(booking).length > 0;
    const bookingTimeLeft = timeLeftMap[booking._id];

    let title = '';
    let message = '';

    if (booking.status === 'cancelled') {
      return;
    }

    if (booking.cancellationRequest?.status === 'rejected') {
      title = isRTL ? 'تم رفض طلب الإلغاء' : 'Cancellation Request Declined';
      message = isRTL 
        ? 'تم رفض طلب الإلغاء الخاص بك من قبل الإدارة.' 
        : 'Your cancellation request was declined by the admin.';
      if (booking.cancellationRequest.adminNote) {
        message += `\n\n${isRTL ? 'ملاحظة الإدارة' : 'Admin note'}: ${booking.cancellationRequest.adminNote}`;
      }
    } else if (booking.cancellationRequest?.status === 'requested') {
      title = isRTL ? 'طلب الإلغاء قيد المراجعة' : 'Cancellation Request Pending';
      message = isRTL 
        ? 'تم تقديم طلب الإلغاء بنجاح وهو قيد المراجعة حالياً من قبل الإدارة.' 
        : 'Your cancellation request has been submitted and is currently under review by the administration.';
    } else if (isPaymentPending && hasPendingPayment && bookingTimeLeft !== undefined && !hasExpired) {
      title = isRTL ? 'الدفع معلق' : 'Payment Pending';
      const timeStr = formatTimeLeft(bookingTimeLeft);
      message = isRTL 
        ? `الطلب بانتظار سداد المبلغ. الوقت المتبقي للدفع: ${timeStr}`
        : `Payment is pending. Time left to complete payment: ${timeStr}`;
    } else if (isPaymentPending && hasPendingPayment && hasExpired) {
      title = isRTL ? 'انتهت مهلة الدفع' : 'Payment Expired';
      message = isRTL 
        ? 'لقد انتهت مهلة الدفع المحددة بـ 24 ساعة لهذا الطلب.'
        : 'The 24-hour payment window for this booking has expired.';
    } else if (booking.status === 'pending' && !hasExpired) {
      title = isRTL ? 'في انتظار موافقة مقدم الخدمة' : 'Awaiting Vendor Confirmation';
      message = isRTL 
        ? 'الطلب بانتظار موافقة مقدم الخدمة لتأكيد حجزك.'
        : 'Your booking request has been submitted and is awaiting confirmation from the vendor.';
    }

    if (title && message) {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
      if (isPaymentPending && hasPendingPayment && bookingTimeLeft !== undefined && !hasExpired) {
        setActiveAlertBookingId(booking._id);
      }
      setAlertVisible(true);
    }
  };

  if (loading) {
    return (
      <>
        <StatusBar
          backgroundColor="#00a19c"
          barStyle="light-content"
          translucent={false}
        />
        <View style={{ flex: 1, backgroundColor: colors.primary }}>
          <View
            style={{ height: insets.top, backgroundColor: colors.primary }}
          />
          <View style={[styles.container, { position: 'relative' }]}>
            {/* Curved Header Background Block with topographic waves & integrated navigation */}
            <View style={styles.profileHeaderBlock}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 375 110"
                preserveAspectRatio="none"
                style={styles.topographicSvg}
              >
                <Path
                  d="M-20 20 C80 55 180 12 300 45 T400 35"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M-20 35 C80 70 180 20 300 60 T400 50"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M-20 50 C80 85 180 28 300 75 T400 65"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>

              {/* Overlay Navigation Bar */}
              <View
                style={[
                  styles.headerOverlayBar,
                  isRTL && styles.headerOverlayBarRTL,
                ]}
              >
                {onBack && (
                  <TouchableOpacity
                    style={styles.headerBackButtonCircle}
                    onPress={onBack}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={isRTL ? 'chevron-forward' : 'chevron-back'}
                      size={20}
                      color={colors.textWhite}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Curved Wave Divider (Transitions header to card background) */}
            <View style={styles.profileCurveDivider}>
              <Svg
                height="30"
                width="100%"
                viewBox="0 0 375 30"
                preserveAspectRatio="none"
              >
                <Path
                  d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z"
                  fill={colors.background}
                />
              </Svg>
            </View>

            <Text
              style={[styles.pageBodyTitle, isRTL && styles.pageBodyTitleRTL]}
            >
              {isRTL ? 'سجل الطلبات' : 'Order History'}
            </Text>
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
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
        <View style={[styles.container, { position: 'relative' }]}>
          {/* Curved Header Background Block with topographic waves & integrated navigation */}
          <View style={styles.profileHeaderBlock}>
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 375 110"
              preserveAspectRatio="none"
              style={styles.topographicSvg}
            >
              <Path
                d="M-20 20 C80 55 180 12 300 45 T400 35"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d="M-20 35 C80 70 180 20 300 60 T400 50"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d="M-20 50 C80 85 180 28 300 75 T400 65"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={2}
                fill="none"
              />
            </Svg>

            {/* Overlay Navigation Bar */}
            <View
              style={[
                styles.headerOverlayBar,
                isRTL && styles.headerOverlayBarRTL,
              ]}
            >
              {onBack ? (
                <TouchableOpacity
                  style={styles.headerBackButtonCircle}
                  onPress={onBack}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isRTL ? 'chevron-forward' : 'chevron-back'}
                    size={20}
                    color={colors.textWhite}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerSpacer} />
              )}

              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Curved Wave Divider (Transitions header to card background) */}
          <View style={styles.profileCurveDivider}>
            <Svg
              height="30"
              width="100%"
              viewBox="0 0 375 30"
              preserveAspectRatio="none"
            >
              <Path
                d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z"
                fill={colors.background}
              />
            </Svg>
          </View>

          <Text
            style={[styles.pageBodyTitle, isRTL && styles.pageBodyTitleRTL]}
          >
            {isRTL ? 'سجل الطلبات' : 'Order History'}
          </Text>

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

          <FlatList
            data={filteredBookings}
            keyExtractor={item => item._id}
            renderItem={({ item: booking }) => (
                <View style={styles.bookingCard}>
                  {/* Solid Full-Width Card Header */}
                  <View
                    style={[
                      styles.cardHeader,
                      isRTL && { flexDirection: 'row-reverse' },
                    ]}
                  >
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {isRTL ? 'رقم الطلب:: ' : 'Order ID: '}
                      {isTablet
                        ? booking._id.length > 24
                          ? `${booking._id.substring(0, 24)}...`
                          : booking._id
                        : booking._id.length > 12
                        ? `${booking._id.substring(0, 12)}...`
                        : booking._id}
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
                      <View
                        style={[
                          styles.itemsHeader,
                          isRTL && { flexDirection: 'row-reverse' },
                          { justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },
                        ]}
                      >
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                          <Svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#374151"
                            strokeWidth={2}
                          >
                            <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <Polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <Line x1="12" y1="22.08" x2="12" y2="12" />
                          </Svg>
                          <Text style={styles.itemsTitle}>
                            {isRTL ? 'العناصر' : 'Items'}
                          </Text>
                        </View>

                        {/* eslint-disable-next-line react/no-unstable-nested-components */}
                        {(() => {
                          const hasExpired = hasPaymentWindowExpired(booking);
                          const isPaymentPending = booking.paymentStatus === 'pending' && booking.totalPrice > 0;
                          const hasPendingPayment = getConfirmedPendingServices(booking).length > 0;
                          const bookingTimeLeft = timeLeftMap[booking._id];

                          let iconName = '';
                          let iconColor = '';
                          let badgeBg = '';

                          if (booking.status === 'cancelled') return null;

                          if (booking.cancellationRequest?.status === 'rejected') {
                            iconName = 'alert-circle';
                            iconColor = '#EF4444';
                            badgeBg = '#FEF2F2';
                          } else if (booking.cancellationRequest?.status === 'requested') {
                            iconName = 'hourglass';
                            iconColor = '#F59E0B';
                            badgeBg = '#FFFBEB';
                          } else if (isPaymentPending && hasPendingPayment && bookingTimeLeft !== undefined && !hasExpired) {
                            iconName = 'card';
                            iconColor = '#F59E0B';
                            badgeBg = '#FFFBEB';
                          } else if (isPaymentPending && hasPendingPayment && hasExpired) {
                            iconName = 'alert-circle';
                            iconColor = '#EF4444';
                            badgeBg = '#FEF2F2';
                          } else if (booking.status === 'pending' && !hasExpired) {
                            iconName = 'time';
                            iconColor = '#2563EB';
                            badgeBg = '#EFF6FF';
                          }

                          if (!iconName) return null;

                          return (
                            <TouchableOpacity
                              onPress={() => handleShowStatusAlert(booking)}
                              style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                backgroundColor: badgeBg,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                borderWidth: 0.8,
                                borderColor: iconColor + '30',
                                gap: 4,
                              }}
                            >
                              <Icon name={iconName} size={14} color={iconColor} />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: iconColor }}>
                                {isPaymentPending && hasPendingPayment && bookingTimeLeft !== undefined && !hasExpired
                                  ? formatTimeLeft(bookingTimeLeft)
                                  : (isRTL ? 'تنبيه' : 'Alert')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })()}
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
                                  marginBottom:
                                    serviceIndex < booking.services.length - 1
                                      ? 10
                                      : 0,
                                  flexDirection: isRTL ? 'row-reverse' : 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                {/* Info side (Right-aligned in RTL, Left-aligned in LTR) */}
                                <View
                                  style={{
                                    flex: 1,
                                    alignItems: isRTL
                                      ? 'flex-end'
                                      : 'flex-start',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      fontWeight: '700',
                                      color: colors.primary,
                                      textAlign: isRTL ? 'right' : 'left',
                                    }}
                                  >
                                    {serviceName}
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color: '#666',
                                      marginTop: 2,
                                      textAlign: isRTL ? 'right' : 'left',
                                    }}
                                  >
                                    {getServiceVendorName(serviceEntry)}
                                  </Text>

                                  {/* Date & Time Row with SVG Icons */}
                                  <View
                                    style={{
                                      flexDirection: isRTL
                                        ? 'row-reverse'
                                        : 'row',
                                      alignItems: 'center',
                                      marginTop: 6,
                                      gap: 12,
                                    }}
                                  >
                                    {/* Date */}
                                    <View
                                      style={{
                                        flexDirection: isRTL
                                          ? 'row-reverse'
                                          : 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      <Svg
                                        width={12}
                                        height={12}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#666"
                                        strokeWidth={2}
                                      >
                                        <Rect
                                          x="3"
                                          y="4"
                                          width="18"
                                          height="18"
                                          rx="2"
                                          ry="2"
                                        />
                                        <Line x1="16" y1="2" x2="16" y2="6" />
                                        <Line x1="8" y1="2" x2="8" y2="6" />
                                        <Line x1="3" y1="10" x2="21" y2="10" />
                                      </Svg>
                                      <Text
                                        style={{ fontSize: 11, color: '#666' }}
                                      >
                                        {formatDateTime(
                                          serviceEntry.timeSlot?.start ||
                                            serviceEntry.eventDate ||
                                            booking.eventDate,
                                        )}
                                      </Text>
                                    </View>

                                    {/* Time */}
                                    <View
                                      style={{
                                        flexDirection: isRTL
                                          ? 'row-reverse'
                                          : 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      <Svg
                                        width={12}
                                        height={12}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#666"
                                        strokeWidth={2}
                                      >
                                        <Circle cx="12" cy="12" r="10" />
                                        <Polyline points="12 6 12 12 16 14" />
                                      </Svg>
                                      <Text
                                        style={{ fontSize: 11, color: '#666' }}
                                      >
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
                                  {serviceEntry.customInputs &&
                                    serviceEntry.customInputs.length > 0 && (
                                      <View
                                        style={{
                                          marginTop: 8,
                                          width: '100%',
                                          paddingTop: 6,
                                          borderTopWidth: 1,
                                          borderTopColor: 'rgba(0, 0, 0, 0.05)',
                                          alignItems: isRTL
                                            ? 'flex-end'
                                            : 'flex-start',
                                        }}
                                      >
                                        {serviceEntry.customInputs.map(
                                          (opt: any, optIndex: number) => {
                                            const displayLabel =
                                              isRTL && opt.labelAr
                                                ? opt.labelAr
                                                : opt.label;
                                            const rawValue =
                                              isRTL && opt.valueAr
                                                ? opt.valueAr
                                                : opt.value;
                                            const displayValue =
                                              rawValue &&
                                              typeof rawValue === 'object'
                                                ? Array.isArray(rawValue)
                                                  ? rawValue.join(', ')
                                                  : Object.entries(rawValue)
                                                      .filter(
                                                        ([, q]) =>
                                                          Number(q) > 0,
                                                      )
                                                      .map(
                                                        ([optName, q]) =>
                                                          `${optName} ×${q}`,
                                                      )
                                                      .join(', ')
                                                : rawValue !== undefined &&
                                                  rawValue !== null
                                                ? String(rawValue)
                                                : '';
                                            const hasPrice =
                                              typeof opt.price === 'number' &&
                                              opt.price > 0;

                                            return (
                                              <View
                                                key={optIndex}
                                                style={{
                                                  flexDirection: isRTL
                                                    ? 'row-reverse'
                                                    : 'row',
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
                                                    textAlign: isRTL
                                                      ? 'right'
                                                      : 'left',
                                                    flex: 1,
                                                    lineHeight: 16,
                                                  }}
                                                >
                                                  <Text
                                                    style={{
                                                      fontWeight: '600',
                                                      color: '#374151',
                                                    }}
                                                  >
                                                    {displayLabel}:{' '}
                                                  </Text>
                                                  <Text
                                                    style={{ color: '#4B5563' }}
                                                  >
                                                    {displayValue}
                                                  </Text>
                                                  {hasPrice && (
                                                    <Text
                                                      style={{
                                                        color: colors.primary,
                                                        fontSize: 11,
                                                        fontWeight: '500',
                                                      }}
                                                    >
                                                      {` (+${opt.price.toFixed(
                                                        3,
                                                      )} ${
                                                        isRTL ? 'د.ك' : 'KWD'
                                                      })`}
                                                    </Text>
                                                  )}
                                                </Text>
                                              </View>
                                            );
                                          },
                                        )}
                                      </View>
                                    )}
                                </View>

                                {/* Price & Payment Status Badge (Left-aligned in RTL, Right-aligned in LTR) */}
                                <View
                                  style={{
                                    alignItems: isRTL
                                      ? 'flex-start'
                                      : 'flex-end',
                                    marginLeft: isRTL ? 0 : 12,
                                    marginRight: isRTL ? 12 : 0,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      fontWeight: '700',
                                      color: '#111827',
                                      textAlign: isRTL ? 'left' : 'right',
                                    }}
                                  >
                                    {serviceEntry.price?.toFixed(3) || '0.000'}{' '}
                                    {isRTL ? 'د.ك' : 'KWD'}
                                  </Text>

                                  {/* Paid / Unpaid Status Badge */}
                                  <View
                                    style={{
                                      backgroundColor: isPaid
                                        ? '#E8F5E9'
                                        : '#FFF3E0',
                                      borderColor: isPaid
                                        ? '#C8E6C9'
                                        : '#FFE0B2',
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
                                      {isPaid
                                        ? isRTL
                                          ? 'مدفوع'
                                          : 'Paid'
                                        : isRTL
                                        ? 'غير مدفوع'
                                        : 'Unpaid'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            );
                          },
                        )}
                      </View>
                    )}

                    {/* Price Container */}
                    <View
                      style={[
                        styles.priceContainer,
                        isRTL && { flexDirection: 'row-reverse' },
                      ]}
                    >
                      {booking.coupon && booking.coupon.discountAmount > 0 ? (
                        <View style={{ flex: 1 }}>
                          {/* Original Price */}
                          <View
                            style={{
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#999' }}>
                              {isRTL ? 'المبلغ قبل الخصم:' : 'Original Amount:'}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: '#999',
                                textDecorationLine: 'line-through',
                              }}
                            >
                              {booking.coupon.originalPrice.toFixed(3)}{' '}
                              {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                          </View>

                          {/* Discount Amount */}
                          <View
                            style={{
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#4CAF50' }}>
                              {isRTL ? 'الخصم' : 'Discount'} (
                              {booking.coupon.code}):
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: '#4CAF50',
                                fontWeight: '600',
                              }}
                            >
                              - {booking.coupon.discountAmount.toFixed(3)}{' '}
                              {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                          </View>

                          {/* Final Price */}
                          <View
                            style={{
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              justifyContent: 'space-between',
                              marginTop: 4,
                            }}
                          >
                            <Text style={styles.priceLabel}>
                              {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                            </Text>
                            <Text style={styles.priceValue}>
                              {booking.totalPrice.toFixed(3)}{' '}
                              {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.priceLabel}>
                            {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                          </Text>
                          <Text style={styles.priceValue}>
                            {getTotalPrice(booking).toFixed(3)}{' '}
                            {isRTL ? 'د.ك' : 'KWD'}
                          </Text>
                        </>
                      )}
                    </View>


                    {/* eslint-disable-next-line react/no-unstable-nested-components */}
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

                      const pendingTotal =
                        getPendingPaymentPreviewTotal(booking);

                      const showPayButton =
                        hasPendingPayment &&
                        booking.paymentStatus !== 'paid' &&
                        !eventDateHasPassed &&
                        !hasExpired &&
                        booking.totalPrice > 0 &&
                        pendingTotal > 0;

                      const showCancelButton =
                        (booking.status === 'pending' &&
                          !hasExpired &&
                          !eventDateHasPassed) ||
                        showPayButton;

                      const showReceiptButton =
                        booking.paymentStatus === 'paid';
                      const hasQR =
                        (booking.status === 'confirmed' ||
                          booking.status === 'completed') &&
                        (booking.paymentStatus === 'paid' || isFree) &&
                        qrAllowedBookings.has(booking._id);

                      const isPaid =
                        booking.paymentStatus === 'paid' ||
                        booking.paymentStatus === 'partial';
                      const cancelRequestStatus = booking.cancellationRequest?.status;
                      const hasPendingCancelRequest = cancelRequestStatus === 'requested';
                      const canRequestCancellation =
                        booking.status !== 'cancelled' &&
                        isPaid &&
                        !isFree &&
                        !eventDateHasPassed &&
                        !hasPendingCancelRequest;

                      const hasMainActions = showReceiptButton || hasQR || showPayButton;
                      const hasCancelActions = showCancelButton || canRequestCancellation;

                      if (!hasMainActions && !hasCancelActions) {
                        return null;
                      }

                      return (
                        <View
                          style={{
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginTop: 14,
                          }}
                        >
                          {/* View Receipt Button (Icon Only) */}
                          {showReceiptButton && (
                            <TouchableOpacity
                              style={{
                                width: 44,
                                height: 44,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0, 161, 156, 0.03)',
                                borderWidth: 1.2,
                                borderColor: colors.primary,
                                borderRadius: 10,
                              }}
                              onPress={() => {
                                setSelectedReceiptBooking(booking);
                                setShowReceiptModal(true);
                              }}
                            >
                              <Icon name="receipt-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                          )}

                          {/* Create/View QR Code Button */}
                          {hasQR && (
                            <TouchableOpacity
                              style={{
                                flex: 1.2,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primary,
                                borderWidth: 1.2,
                                borderColor: colors.primary,
                                height: 44,
                                borderRadius: 10,
                                gap: 6,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 2,
                               }}
                              onPress={() => handleQRCode(booking)}
                            >
                              <Icon name="qr-code-outline" size={15} color="#fff" />
                              <Text
                                style={{
                                  color: '#fff',
                                  fontSize: 13,
                                  fontWeight: '700',
                                }}
                                numberOfLines={1}
                              >
                                {isRTL ? 'رمز QR' : 'QR Code'}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Pay Now Button */}
                          {showPayButton && (
                            <TouchableOpacity
                              style={{
                                flex: 1.2,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primary,
                                borderWidth: 1.2,
                                borderColor: colors.primary,
                                height: 44,
                                borderRadius: 10,
                                gap: 6,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 2,
                              }}
                              onPress={() => handlePayNow(booking)}
                              disabled={payingBookings.has(booking._id)}
                            >
                              {payingBookings.has(booking._id) ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Icon name="card-outline" size={16} color="#fff" />
                                  <Text
                                    style={{
                                      color: '#fff',
                                      fontSize: 13,
                                      fontWeight: '700',
                                    }}
                                    numberOfLines={1}
                                  >
                                    {isRTL ? 'ادفع الآن' : 'Pay Now'}
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}

                          {/* Cancellation Actions */}
                          {showCancelButton && (
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(239, 68, 68, 0.03)',
                                borderWidth: 1.2,
                                borderColor: '#FCA5A5',
                                height: 44,
                                borderRadius: 10,
                                gap: 6,
                              }}
                               onPress={() => handleCancelBooking(booking._id)}
                               disabled={cancellingBookings.has(booking._id)}
                             >
                               {cancellingBookings.has(booking._id) ? (
                                 <ActivityIndicator
                                   size="small"
                                   color="#EF4444"
                                 />
                               ) : (
                                 <>
                                   <Icon name="close-circle-outline" size={16} color="#EF4444" />
                                   <Text
                                     style={{
                                       color: '#EF4444',
                                       fontSize: 13,
                                       fontWeight: '700',
                                       textAlign: 'center',
                                     }}
                                     numberOfLines={1}
                                   >
                                     {isRTL ? 'إلغاء الطلب' : 'Cancel Order'}
                                   </Text>
                                 </>
                               )}
                             </TouchableOpacity>
                           )}

                           {canRequestCancellation && (
                             <TouchableOpacity
                               style={{
                                 flex: 1.2,
                                 flexDirection: isRTL ? 'row-reverse' : 'row',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 backgroundColor: 'rgba(239, 68, 68, 0.03)',
                                 borderWidth: 1.2,
                                 borderColor: '#FCA5A5',
                                 height: 44,
                                 borderRadius: 10,
                                 gap: 6,
                               }}
                               onPress={() => {
                                 setSelectedCancellationBooking(booking);
                                 setCancellationReason('');
                                 setCancellationResult(null);
                                 setCancellationModalVisible(true);
                               }}
                             >
                               <Icon name="close-circle-outline" size={16} color="#EF4444" />
                               <Text
                                 style={{
                                   color: '#EF4444',
                                   fontSize: 13,
                                   fontWeight: '700',
                                   textAlign: 'center',
                                 }}
                                 numberOfLines={1}
                               >
                                 {isRTL ? 'طلب إلغاء' : 'Cancel Request'}
                               </Text>
                             </TouchableOpacity>
                           )}
                         </View>
                      );
                    })()}

                    {/* Action Buttons removed - each service now has its own buttons */}
                  </View>
                </View>
            )}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              filteredBookings.length === 0 && { flex: 1, justifyContent: 'center' },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
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
            }
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
          />

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
                        : b,
                    ),
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
            onClose={() => {
              setAlertVisible(false);
              setActiveAlertBookingId(null);
            }}
          />

          {/* Request Cancellation Modal (paid bookings) */}
          <CancellationRequestModal
            visible={cancellationModalVisible}
            isRTL={isRTL}
            selectedCancellationBooking={selectedCancellationBooking}
            cancellationReason={cancellationReason}
            setCancellationReason={setCancellationReason}
            submittingCancellation={submittingCancellation}
            cancellationResult={cancellationResult}
            closeCancellationModal={closeCancellationModal}
            handleSubmitCancellationRequest={handleSubmitCancellationRequest}
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
                      selectedReceiptBooking.services?.find(
                        (s: any) => s.paidAt,
                      )?.paidAt ||
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
