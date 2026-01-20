import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserBookings, Booking } from '../services/api';
import { API_URL } from '../config/api.config';
import { colors } from '../constants/colors';
import { sendPayment } from '../services/paymentApi';
import { useLanguage } from '../contexts/LanguageContext';
import { orderHistoryStyles as styles } from './orderHistoryStyles';
import { QRFormModal } from '../components/QRCodeCard/QRFormModal';
import { CustomAlert } from '../components/CustomAlert';
import PaymentWebView from '../components/PaymentWebView';
import {
  getQRCodeByBooking,
  canCreateQRCode,
  getQRCodeSettings,
} from '../services/qrCodeApi';

interface OrderHistoryProps {
  onBack?: () => void;
  onWriteReview?: (
    bookingId: string,
    serviceId: string,
    serviceName: string,
  ) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  onBack,
  onWriteReview,
}) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [qrAllowedBookings, setQrAllowedBookings] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [timeLeftMap, setTimeLeftMap] = useState<{ [key: string]: number }>({});
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set());
  const [payingBookings, setPayingBookings] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>>([]);

  // PaymentWebView state
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentPayingBooking, setCurrentPayingBooking] = useState<string | null>(null);

  // Payment timeout in milliseconds (10 minutes)
  const PAYMENT_TIMEOUT = 10 * 60 * 1000;

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        setAlertTitle(isRTL ? 'خطأ' : 'Error');
        setAlertMessage(isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
        setAlertButtons([{
          text: isRTL ? 'حسناً' : 'OK',
          style: 'default',
          onPress: () => {
            if (onBack) onBack();
          },
        }]);
        setAlertVisible(true);
        return;
      }

      const [data, settings] = await Promise.all([
        getUserBookings(token),
        getQRCodeSettings(token),
      ]);

      // Sort by creation date, newest first
      const sortedBookings = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setBookings(sortedBookings);
      setFilteredBookings(sortedBookings);

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

  // Calculate time left for payment pending bookings
  const calculateTimeLeft = useCallback((booking: Booking): number => {
    // Don't calculate time for cancelled bookings
    if (booking.status === 'cancelled') {
      return 0;
    }

    // Only calculate time if booking payment is pending and booking is confirmed
    if (booking.paymentStatus !== 'pending' || booking.status !== 'confirmed') {
      return 0;
    }

    // Check if there are any services that are confirmed by vendor (have confirmedAt)
    const confirmedServices = booking.services?.filter(
      (s: any) => s.status === 'confirmed' && s.confirmedAt
    );

    if (!confirmedServices || confirmedServices.length === 0) {
      return 0;
    }

    // Get the earliest confirmation time from services
    const confirmedDates = confirmedServices
      .map((s: any) => s.confirmedAt)
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime());

    if (confirmedDates.length === 0) return 0;

    const earliestConfirmed = Math.min(...confirmedDates);
    const expiryTime = earliestConfirmed + PAYMENT_TIMEOUT;
    const now = Date.now();

    return Math.max(0, expiryTime - now);
  }, [PAYMENT_TIMEOUT]);

  // Start timer for pending payments
  useEffect(() => {
    const updateTimers = () => {
      const newTimeLeftMap: { [key: string]: number } = {};

      bookings.forEach(booking => {
        // Always calculate time left for bookings with pending payment and confirmed status
        if (booking.paymentStatus === 'pending' && booking.status === 'confirmed') {
          const timeLeft = calculateTimeLeft(booking);
          // Store the time even if it's 0 - it means the timer has expired but payment is still needed
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
  }, [bookings, calculateTimeLeft]);

  // Format time left as MM:SS
  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    setAlertTitle(isRTL ? 'تأكيد الإلغاء' : 'Confirm Cancellation');
    setAlertMessage(isRTL ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?');
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
              setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
              setAlertVisible(true);
              return;
            }

            const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              setAlertTitle(isRTL ? 'تم الإلغاء' : 'Cancelled');
              setAlertMessage(isRTL ? 'تم إلغاء الطلب بنجاح' : 'Order cancelled successfully');
              setAlertButtons([{
                text: isRTL ? 'حسناً' : 'OK',
                style: 'default',
                onPress: () => {
                  loadBookings();
                },
              }]);
              setAlertVisible(true);
            } else {
              throw new Error('Failed to cancel');
            }
          } catch (error) {
            setAlertTitle(isRTL ? 'خطأ' : 'Error');
            setAlertMessage(isRTL ? 'فشل إلغاء الطلب' : 'Failed to cancel order');
            setAlertButtons([{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]);
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

      // Calculate pending total from all confirmed services (vendor approved)
      // If booking payment is pending, calculate from all confirmed services
      const pendingServices = booking.services?.filter(
        (s: any) => s.status === 'confirmed' && s.confirmedAt
      ) || [];

      const pendingTotal = pendingServices.reduce(
        (sum: number, s: any) => sum + s.price * (s.quantity || 1), 0
      );

      if (pendingTotal <= 0) {
        setAlertTitle(isRTL ? 'تنبيه' : 'Info');
        setAlertMessage(isRTL ? 'لا يوجد مبلغ مستحق للدفع' : 'No pending amount to pay');
        setAlertButtons([{
          text: isRTL ? 'حسناً' : 'OK',
          style: 'default',
        }]);
        setAlertVisible(true);
        return;
      }

      // Get user info from AsyncStorage
      const userStr = await AsyncStorage.getItem('userData');
      const user = userStr ? JSON.parse(userStr) : null;

      // Prepare invoice items
      const invoiceItems = pendingServices.map((s: any) => ({
        ItemName: isRTL && s.service?.nameAr ? s.service.nameAr : s.service?.name || 'Service',
        Quantity: s.quantity || 1,
        UnitPrice: s.price,
      }));

      const response = await sendPayment({
        bookingId: booking._id,
        invoiceValue: pendingTotal,
        customerName: user?.name || user?.firstName || 'Customer',
        customerEmail: user?.email || '',
        customerMobile: user?.phoneNumber?.replace(/^\+965/, '').replace(/\s/g, '') || '',
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
      setAlertMessage(error.message || (isRTL ? 'فشل إنشاء رابط الدفع' : 'Failed to create payment link'));
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
    setAlertMessage(isRTL ? 'تم الدفع بنجاح! تم تحديث حالة طلبك.' : 'Payment completed successfully! Your order status has been updated.');
    setAlertButtons([{
      text: isRTL ? 'حسناً' : 'OK',
      style: 'default',
    }]);
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
    setAlertMessage(error || (isRTL ? 'لم يتم إكمال الدفع. يرجى المحاولة مرة أخرى.' : 'Payment was not completed. Please try again.'));
    setAlertButtons([{
      text: isRTL ? 'حسناً' : 'OK',
      style: 'default',
    }]);
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
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(
        booking => booking.status.toLowerCase() === filter.toLowerCase(),
      );
      setFilteredBookings(filtered);
    }
  };

  const getServiceName = (booking: Booking) => {
    // Check if this is a package booking by looking for [PKG:...] in specialRequests
    const specialRequests = booking.specialRequests || '';
    const pkgMatch = specialRequests.match(/\[PKG:([^\]]+)\]/);

    if (pkgMatch && pkgMatch[1]) {
      // Extract package name from the marker
      return pkgMatch[1];
    }

    // If booking has multiple services, show count
    if (booking.services && booking.services.length > 1) {
      const count = booking.services.length;
      return isRTL ? `${count} خدمات` : `${count} Services`;
    }

    // Fallback to single service name
    const service = booking.services[0]?.service;
    if (!service || typeof service === 'string')
      return isRTL ? 'خدمة' : 'Service';
    return isRTL
      ? (service as any)?.nameAr || (service as any)?.name || 'خدمة'
      : (service as any)?.name || 'Service';
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
      : vendor?.name ||
      vendor?.vendorProfile?.businessName ||
      'Vendor';
  };



  const getDescription = (booking: Booking) => {
    const service = booking.services[0]?.service;
    if (!service || typeof service === 'string')
      return isRTL ? 'لا يوجد وصف' : 'No description';
    return isRTL
      ? (service as any)?.descriptionAr ||
      (service as any)?.description ||
      'لا يوجد وصف'
      : (service as any)?.description || 'No description';
  };

  const formatLocation = (location: string) => {
    if (!location) return isRTL ? 'غير محدد' : 'Not specified';

    // The location comes formatted from Cart like: "street, منزل X, طابق Y, city"
    // Just clean it up and return it properly formatted
    return location
      .replace(/,\s*/g, ', ') // Normalize spacing after commas
      .trim();
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
        setAlertMessage(isRTL ? 'لم يتم العثور على رمز التوثيق' : 'Authentication required');
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
      <View style={[styles.container, { position: 'relative' }]}>
        {/* header background to fill notch */}
        <View style={[styles.headerBackground, { height: insets.top + 78 }]} />

        <View
          style={[
            styles.header,
            { height: insets.top + 90 },
            isRTL && { flexDirection: 'row-reverse' },
          ]}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{isRTL ? '›' : '‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRTL ? 'سجل الطلبات' : 'Order History'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00695C" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { position: 'relative' }]}>
      {/* header background to fill notch */}
      <View style={[styles.headerBackground, { height: insets.top + 78 }]} />

      <View
        style={[
          styles.header,
          { height: insets.top + 90 },
          isRTL && { flexDirection: 'row-reverse' },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'سجل الطلبات' : 'Order History'}
        </Text>
        <View style={styles.placeholder} />
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
                selectedFilter === 'confirmed' && styles.filterButtonTextActive,
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
                selectedFilter === 'pending' && styles.filterButtonTextActive,
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
                selectedFilter === 'completed' && styles.filterButtonTextActive,
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
                selectedFilter === 'cancelled' && styles.filterButtonTextActive,
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
              {/* Service Name with Status Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.serviceNameContainer}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {getServiceName(booking)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        borderWidth: 1,
                        borderColor: getStatusStyle(booking.status).color
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusStyle(booking.status).color }]}>
                      {getStatusStyle(booking.status).text}
                    </Text>
                  </View>
                  {/* Payment Status Badge */}
                  {booking.paymentStatus === 'paid' && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: '#4CAF50' }]}>
                      <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                        {isRTL ? 'مدفوع' : 'Paid'}
                      </Text>
                    </View>
                  )}
                  {booking.paymentStatus === 'pending' && booking.status !== 'pending' && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: '#FF9800' }]}>
                      <Text style={[styles.statusText, { color: '#FF9800' }]}>
                        {isRTL ? 'بانتظار الدفع' : 'Payment Pending'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {getDescription(booking)}
              </Text>

              {/* Booking Creation Info */}
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  {isRTL ? 'تاريخ الحجز: ' : 'Booked on: '}
                  {(() => {
                    const date = new Date(booking.createdAt);
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    return `${day}/${month}/${year} - ${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                  })()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoText} numberOfLines={2}>
                  {isRTL ? 'الموقع: ' : 'Location: '}
                  {formatLocation(booking.location)}
                </Text>
              </View>

              {/* Services List - Show all services in the booking */}
              {booking.services && booking.services.length > 0 && (
                <View style={styles.customInputsContainer}>
                  <Text style={styles.customInputsTitle}>
                    {isRTL ? 'الخدمات المحجوزة:' : 'Booked Services:'}
                  </Text>
                  {booking.services.map((serviceEntry: any, serviceIndex: number) => {
                    const serviceId = typeof serviceEntry.service === 'string'
                      ? serviceEntry.service
                      : serviceEntry.service?._id;
                    const serviceName = getSingleServiceName(serviceEntry.service);
                    const serviceStatus = serviceEntry.status || booking.status;
                    const isPaid = serviceEntry.paymentStatus === 'paid' || booking.paymentStatus === 'paid';

                    return (
                      <View key={serviceIndex} style={{ marginBottom: serviceIndex < booking.services.length - 1 ? 16 : 0, paddingBottom: serviceIndex < booking.services.length - 1 ? 16 : 0, borderBottomWidth: serviceIndex < booking.services.length - 1 ? 1 : 0, borderBottomColor: '#E0E0E0' }}>
                        {/* Service Name with Status Badge */}
                        <View style={[styles.customInputRow, { alignItems: 'flex-start' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.customInputLabel, { fontWeight: '600', fontSize: 14 }]}>
                              {serviceIndex + 1}. {serviceName}
                            </Text>
                            {/* Pending Confirmation Badge under service name */}
                            {(serviceEntry.availabilityStatus === 'pending_confirmation' ||
                              (serviceStatus === 'pending' && !isPaid)) && (
                                <View style={{ backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' }}>
                                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                                    {isRTL ? 'في انتظار الموافقة' : 'Pending Confirmation'}
                                  </Text>
                                </View>
                              )}
                          </View>
                          <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <Text style={[styles.customInputValue, { color: colors.primary, fontWeight: '600' }]}>
                              {serviceEntry.price?.toFixed(3) || '0.000'} {isRTL ? 'د.ك' : 'KWD'}
                            </Text>
                            {/* Payment Status Badge for this service */}
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: isPaid ? '#4CAF50' : '#FF9800', paddingHorizontal: 8, paddingVertical: 2 }]}>
                              <Text style={[styles.statusText, { fontSize: 10, color: isPaid ? '#4CAF50' : '#FF9800' }]}>
                                {isPaid ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'غير مدفوع' : 'Unpaid')}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Event Date and Time for this service */}
                        <View style={[styles.customInputRow, { marginTop: 6 }]}>
                          <Text style={[styles.customInputLabel, { fontSize: 12, color: '#666' }]}>
                            {isRTL ? 'موعد الخدمة:' : 'Service Date:'}
                          </Text>
                          <Text style={[styles.customInputValue, { fontSize: 12, color: '#666' }]}>
                            {/* Use service's timeSlot if available, otherwise fall back to booking's eventDate/eventTime */}
                            {formatDateTime(serviceEntry.timeSlot?.start || serviceEntry.eventDate || booking.eventDate)} | {formatDateTime(serviceEntry.timeSlot?.start || booking.eventTime?.start, true)} - {formatDateTime(serviceEntry.timeSlot?.end || booking.eventTime?.end, true)}
                          </Text>
                        </View>

                        {/* Vendor Name */}
                        <View style={[styles.customInputRow, { marginTop: 4 }]}>
                          <Text style={[styles.customInputLabel, { fontSize: 12, color: '#666' }]}>
                            {isRTL ? 'مقدم الخدمة:' : 'Vendor:'}
                          </Text>
                          <Text style={[styles.customInputValue, { fontSize: 12, color: '#666' }]}>
                            {getServiceVendorName(serviceEntry)}
                          </Text>
                        </View>

                        {/* Quantity if > 1 */}
                        {serviceEntry.quantity > 1 && (
                          <View style={[styles.customInputRow, { marginTop: 4 }]}>
                            <Text style={[styles.customInputLabel, { fontSize: 12, color: '#666' }]}>
                              {isRTL ? 'الكمية:' : 'Quantity:'}
                            </Text>
                            <Text style={[styles.customInputValue, { fontSize: 12, color: '#666' }]}>
                              {serviceEntry.quantity}
                            </Text>
                          </View>
                        )}

                        {/* Custom Inputs / Add-ons for this service */}
                        {serviceEntry.customInputs && (() => {
                          // Handle both object format {label: value} and array format
                          const inputs = serviceEntry.customInputs;
                          const entries: Array<[string, any]> = [];

                          if (Array.isArray(inputs)) {
                            // Array format: [{label, value, price}]
                            inputs.forEach((input: any) => {
                              if (input && input.label !== undefined) {
                                entries.push([String(input.label), input.value]);
                              }
                            });
                          } else if (typeof inputs === 'object' && inputs !== null) {
                            // Object format
                            Object.entries(inputs).forEach(([key, val]: [string, any]) => {
                              // Check if value is an object with label property
                              if (val && typeof val === 'object' && 'label' in val) {
                                // Format: {0: {label: "X", value: "Y"}}
                                entries.push([String(val.label), val.value]);
                              } else if (val !== undefined && val !== null) {
                                // Simple key-value format: {"Color": "Red"}
                                // Skip numeric keys with no label (malformed data)
                                if (key !== '0' || typeof val !== 'object') {
                                  entries.push([key, val]);
                                }
                              }
                            });
                          }

                          // Filter out entries with numeric-only keys that look like indices
                          const filteredEntries = entries.filter(([label]) => {
                            return label && isNaN(Number(label));
                          });

                          if (filteredEntries.length === 0) return null;

                          return (
                            <View style={{ marginTop: 8, paddingLeft: 12 }}>
                              <Text style={[styles.customInputLabel, { fontSize: 12, color: '#888', marginBottom: 4 }]}>
                                {isRTL ? 'الإضافات:' : 'Add-ons:'}
                              </Text>
                              {filteredEntries.map(([label, value], inputIndex) => (
                                <View key={inputIndex} style={styles.customInputRow}>
                                  <Text style={[styles.customInputLabel, { fontSize: 11 }]}>
                                    {label}:
                                  </Text>
                                  <Text style={[styles.customInputValue, { fontSize: 11 }]}>
                                    {Array.isArray(value)
                                      ? value.join(', ')
                                      : typeof value === 'number'
                                        ? value
                                        : value !== undefined && value !== null
                                          ? String(value)
                                          : '-'}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          );
                        })()}

                        {/* Action Buttons for this service (Review & QR) */}
                        {isPaid && serviceStatus === 'confirmed' && serviceId && (
                          <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                            {/* Write Review Button */}
                            {onWriteReview && (
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  borderRadius: 6,
                                  alignItems: 'center',
                                  borderWidth: 1,
                                  borderColor: colors.primary,
                                }}
                                onPress={() => onWriteReview(booking._id, serviceId, serviceName)}
                              >
                                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                  {isRTL ? 'كتابة تقييم' : 'Write Review'}
                                </Text>
                              </TouchableOpacity>
                            )}

                            {/* Create QR Code Button */}
                            {qrAllowedBookings.has(booking._id) && (
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  borderRadius: 6,
                                  alignItems: 'center',
                                  borderWidth: 1,
                                  borderColor: '#00695C',
                                }}
                                onPress={() => handleQRCode(booking)}
                              >
                                <Text style={{ color: '#00695C', fontSize: 12, fontWeight: '600' }}>
                                  {isRTL ? 'إنشاء QR' : 'Create QR'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Price */}
              <View style={styles.priceContainer}>
                {booking.coupon && booking.coupon.discountAmount > 0 ? (
                  <>
                    {/* Original Price with strikethrough */}
                    <View style={{ marginBottom: 4 }}>
                      <Text
                        style={[
                          styles.priceLabel,
                          { fontSize: 12, color: '#999' },
                        ]}
                      >
                        {isRTL ? 'المبلغ قبل الخصم:' : 'Original Amount:'}
                      </Text>
                      <Text
                        style={[
                          styles.priceValue,
                          {
                            fontSize: 14,
                            color: '#999',
                            textDecorationLine: 'line-through',
                          },
                        ]}
                      >
                        KWD {booking.coupon.originalPrice.toFixed(3)}
                      </Text>
                    </View>

                    {/* Discount Amount */}
                    <View style={{ marginBottom: 4 }}>
                      <Text
                        style={[
                          styles.priceLabel,
                          { fontSize: 12, color: '#4CAF50' },
                        ]}
                      >
                        {isRTL ? 'الخصم' : 'Discount'} ({booking.coupon.code}):
                      </Text>
                      <Text
                        style={[
                          styles.priceValue,
                          { fontSize: 14, color: '#4CAF50' },
                        ]}
                      >
                        - KWD {booking.coupon.discountAmount.toFixed(3)}
                      </Text>
                    </View>

                    {/* Final Price (after discount) */}
                    <View>
                      <Text style={styles.priceLabel}>
                        {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                      </Text>
                      <Text style={styles.priceValue}>
                        KWD {booking.totalPrice.toFixed(3)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.priceLabel}>
                      {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                    </Text>
                    <Text style={styles.priceValue}>
                      KWD {getTotalPrice(booking).toFixed(3)}
                    </Text>
                  </>
                )}
              </View>

              {/* Order ID */}
              <View style={styles.orderIdContainer}>
                <Text style={styles.orderIdLabel}>
                  {isRTL ? 'رقم الطلب:' : 'Order ID:'}
                </Text>
                <Text style={styles.orderIdValue}>
                  {booking._id.substring(0, 13)}...{booking._id.slice(-4)}
                </Text>
              </View>

              {/* Payment Pending Banner with Timer - Only for confirmed services that need payment */}
              {(() => {
                // Check if booking payment is pending and status is confirmed (vendor approved)
                const isPaymentPending = booking.paymentStatus === 'pending' && booking.status === 'confirmed';

                // Check if there are confirmed services (vendor approved with confirmedAt)
                const hasConfirmedServices = booking.services?.some(
                  (s: any) => s.status === 'confirmed' && s.confirmedAt
                );

                const bookingTimeLeft = timeLeftMap[booking._id];

                return isPaymentPending &&
                  hasConfirmedServices &&
                  bookingTimeLeft !== undefined ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: bookingTimeLeft > 0 ? '#FFF3E0' : '#FFEBEE',
                    borderWidth: 1,
                    borderColor: bookingTimeLeft > 0 ? '#FFCC80' : '#EF9A9A',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 16, marginRight: 8 }}>💳</Text>
                      <Text style={{ color: bookingTimeLeft > 0 ? '#E65100' : '#C62828', fontSize: 13, flex: 1 }}>
                        {isRTL ? 'الدفع معلق' : 'Payment Pending'}
                      </Text>
                    </View>
                    {bookingTimeLeft > 0 ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFCC80',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}>
                        <Text style={{ fontSize: 12, marginRight: 4 }}>⏱</Text>
                        <Text style={{ color: '#E65100', fontSize: 12, fontWeight: '600' }}>
                          {formatTimeLeft(bookingTimeLeft)}
                        </Text>
                      </View>
                    ) : (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#EF9A9A',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}>
                        <Text style={{ fontSize: 12, color: '#C62828', fontWeight: '600' }}>
                          {isRTL ? 'انتهى الوقت' : 'Expired'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null;
              })()}

              {/* Awaiting Vendor Confirmation Banner */}
              {(booking.services?.some((s: any) => s.status !== 'confirmed' || !s.confirmedAt)) &&
                booking.status !== 'cancelled' && (booking.status === 'pending' || booking.paymentStatus === 'awaiting_confirmation') && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#E3F2FD',
                    borderWidth: 1,
                    borderColor: '#90CAF9',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                  }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>⏳</Text>
                    <Text style={{ color: '#1565C0', fontSize: 13, flex: 1 }}>
                      {isRTL ? 'في انتظار موافقة مقدم الخدمة' : 'Awaiting vendor confirmation'}
                    </Text>
                  </View>
                )}

              {/* Pay Now and Cancel Buttons for Payment Pending ONLY */}
              {(() => {
                // Only show buttons if paymentStatus is pending (NOT paid)
                if (booking.paymentStatus === 'paid' || booking.status === 'cancelled') {
                  return null;
                }

                // Check if booking payment is pending and confirmed (vendor approved)
                const isPaymentPending = booking.paymentStatus === 'pending' && booking.status === 'confirmed';

                // Check if any service is still awaiting vendor confirmation (not confirmed yet)
                const isAwaitingVendorConfirmation = booking.services?.some(
                  (s: any) => s.status !== 'confirmed' || !s.confirmedAt
                );

                // Check if there are services ready for payment (vendor confirmed with confirmedAt)
                const hasServicesReadyForPayment = booking.services?.some(
                  (s: any) => s.status === 'confirmed' && s.confirmedAt
                );

                // Calculate total from confirmed services only
                const totalAmount = booking.services
                  ?.filter((s: any) => s.status === 'confirmed' && s.confirmedAt)
                  .reduce((sum: number, s: any) => sum + s.price * (s.quantity || 1), 0) || 0;

                // Show pay button only if:
                // 1. Booking payment is pending and status is confirmed
                // 2. There are services ready for payment (not awaiting confirmation)
                // 3. Payment timer exists and has not expired (timeLeft > 0)
                const showPayButton = isPaymentPending &&
                  hasServicesReadyForPayment &&
                  timeLeftMap[booking._id] !== undefined &&
                  timeLeftMap[booking._id] > 0 &&
                  totalAmount > 0;

                // Show cancel button if booking is pending payment or any service is awaiting confirmation
                const showCancelButton = isPaymentPending || isAwaitingVendorConfirmation;

                if (!showPayButton && !showCancelButton) return null;

                return (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    gap: 12,
                  }}>
                    {/* Pay Now Button */}
                    {showPayButton && (
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.primary,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
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
                            <Text style={{ fontSize: 16 }}>💳</Text>
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                              {isRTL ? 'ادفع الآن' : 'Pay Now'} ({totalAmount.toFixed(3)} KWD)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Cancel Order Button */}
                    {showCancelButton && (
                      <TouchableOpacity
                        style={{
                          flex: showPayButton ? 0.5 : 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#fff',
                          borderWidth: 1,
                          borderColor: '#dc3545',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          gap: 8,
                        }}
                        onPress={() => handleCancelBooking(booking._id)}
                        disabled={cancellingBookings.has(booking._id)}
                      >
                        {cancellingBookings.has(booking._id) ? (
                          <ActivityIndicator size="small" color="#dc3545" />
                        ) : (
                          <>
                            <Text style={{ fontSize: 16 }}>✕</Text>
                            <Text style={{ color: '#dc3545', fontSize: 14, fontWeight: '600' }}>
                              {isRTL ? 'إلغاء الطلب' : 'Cancel Order'}
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
          onSuccess={() => {
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
    </View>
  );
};

export default OrderHistory;
