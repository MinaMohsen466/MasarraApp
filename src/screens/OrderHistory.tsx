import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserBookings, Booking, getImageUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { orderHistoryStyles as styles } from './orderHistoryStyles';
import { QRFormModal } from '../components/QRCodeCard/QRFormModal';
import { getQRCodeByBooking, canCreateQRCode, getQRCodeSettings } from '../services/qrCodeApi';

interface OrderHistoryProps {
  onBack?: () => void;
  onViewDetails?: (bookingId: string) => void;
  onWriteReview?: (bookingId: string, serviceId: string, serviceName: string) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack, onViewDetails, onWriteReview }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [qrAllowedBookings, setQrAllowedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first'
        );
        if (onBack) onBack();
        return;
      }

      const [data, settings] = await Promise.all([
        getUserBookings(token),
        getQRCodeSettings(token)
      ]);

      // Sort by creation date, newest first
      const sortedBookings = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBookings(sortedBookings);
      
      // Check which bookings are allowed for QR code (in parallel)
      if (settings) {
        const promises = sortedBookings.map(booking =>
          canCreateQRCode(booking, settings, token)
            .then(canCreate => canCreate ? booking._id : null)
            .catch(() => null)
        );
        
        const results = await Promise.all(promises);
        const allowed = new Set(results.filter(Boolean) as string[]);
        setQrAllowedBookings(allowed);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل الحجوزات' : 'Failed to load bookings'
      );
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = (booking: Booking) => {
    const service = booking.services[0]?.service;
    if (!service) return isRTL ? 'خدمة' : 'Service';
    
    if (typeof service === 'string') return isRTL ? 'خدمة' : 'Service';
    
    return isRTL 
      ? (service as any)?.nameAr || (service as any)?.name || 'خدمة'
      : (service as any)?.name || (service as any)?.nameAr || 'Service';
  };

  const getServiceId = (booking: Booking) => {
    const service = booking.services[0]?.service;
    return typeof service === 'string' ? service : (service as any)?._id;
  };

  const getVendorName = (booking: Booking) => {
    const vendor = booking.services[0]?.vendor;
    if (!vendor) return isRTL ? 'مقدم الخدمة' : 'Vendor';
    
    if (typeof vendor !== 'object') return isRTL ? 'مقدم الخدمة' : 'Vendor';
    
    return isRTL 
      ? (vendor as any)?.nameAr 
        || (vendor as any)?.vendorProfile?.businessName_ar 
        || (vendor as any)?.vendorProfile?.businessName
        || (vendor as any)?.name 
        || 'مقدم الخدمة'
      : (vendor as any)?.name 
        || (vendor as any)?.vendorProfile?.businessName
        || (vendor as any)?.vendorProfile?.businessName_ar
        || 'Vendor';
  };

  const getDescription = (booking: Booking) => {
    const service = booking.services[0]?.service;
    if (!service || typeof service === 'string') return isRTL ? 'لا يوجد وصف' : 'No description';
    
    return isRTL 
      ? (service as any)?.descriptionAr || (service as any)?.description || 'لا يوجد وصف' 
      : (service as any)?.description || (service as any)?.descriptionAr || 'No description';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    if (isRTL) {
      switch (status.toLowerCase()) {
        case 'confirmed':
          return 'مؤكد';
        case 'pending':
          return 'قيد الانتظار';
        case 'cancelled':
          return 'ملغي';
        case 'completed':
          return 'مكتمل';
        default:
          return status;
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleQRCode = async (booking: Booking) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'لم يتم العثور على رمز التوثيق' : 'Authentication required');
        return;
      }

      const settings = await getQRCodeSettings(token);
      if (!settings) {
        Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل تحميل الإعدادات' : 'Failed to load settings');
        return;
      }

      const canCreate = await canCreateQRCode(booking, settings, token);
      if (!canCreate) {
        Alert.alert(
          isRTL ? 'غير مسموح' : 'Not Allowed',
          isRTL ? 'لا يمكن إنشاء رمز QR لهذا نوع الحدث' : 'QR codes cannot be created for this occasion type'
        );
        return;
      }

      const existingQR = await getQRCodeByBooking(token, booking._id);
      setSelectedBooking(booking);
      setSelectedQRCode(existingQR);
      setQrModalVisible(true);
    } catch (error) {
      console.error('Error preparing QR code:', error);
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleReview = (bookingId: string, serviceId: string, serviceName: string) => {
    console.log('Write review for booking:', bookingId, 'service:', serviceId);
    if (onWriteReview) {
      onWriteReview(bookingId, serviceId, serviceName);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { position: 'relative' }]}>
        {/* header background to fill notch */}
        <View style={[styles.headerBackground, { height: insets.top + 66 }]} />

        <View style={[styles.header, { height: insets.top + 76 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>
              {isRTL ? '›' : '‹'}
            </Text>
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
      <View style={[styles.headerBackground, { height: insets.top + 82 }]} />

      <View style={[styles.header, { height: insets.top + 82 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>
            {isRTL ? '›' : '‹'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'سجل الطلبات' : 'Order History'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>
              {isRTL ? 'لا توجد حجوزات بعد' : 'No bookings yet'}
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking._id} style={styles.bookingCard}>
              {/* Service Name with Status Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.serviceNameContainer}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {getServiceName(booking)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {getDescription(booking)}
              </Text>

              {/* Booking Info */}
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <Text style={styles.infoText}>
                  {formatDate(booking.eventDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🕐</Text>
                <Text style={styles.infoText}>
                  {formatTime(booking.eventTime.start)} - {formatTime(booking.eventTime.end)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText} numberOfLines={1}>
                  {booking.location || (isRTL ? 'غير محدد' : 'Not specified')}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👤</Text>
                <Text style={styles.infoText}>
                  {getVendorName(booking)}
                </Text>
              </View>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>
                  {isRTL ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                </Text>
                <Text style={styles.priceValue}>
                  KWD {booking.totalPrice.toFixed(3).replace(/\.?0+$/, '')}
                </Text>
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

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {qrAllowedBookings.has(booking._id) && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleQRCode(booking)}
                  >
                    <View style={styles.buttonIconContainer}>
                      <Text style={styles.buttonIcon}>▦</Text>
                    </View>
                    <Text style={styles.actionButtonText}>
                      {isRTL ? 'رمز QR' : 'QR Code'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    const serviceId = getServiceId(booking);
                    if (serviceId) {
                      handleReview(booking._id, serviceId, getServiceName(booking));
                    }
                  }}
                >
                  <View style={styles.buttonIconContainer}>
                    <Text style={styles.buttonIcon}>★</Text>
                  </View>
                  <Text style={styles.actionButtonText}>
                    {isRTL ? 'تقييم' : 'Review'}
                  </Text>
                </TouchableOpacity>
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
          onSuccess={() => {
            loadBookings();
          }}
        />
      )}
    </View>
  );
};

export default OrderHistory;
