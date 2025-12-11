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
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [qrAllowedBookings, setQrAllowedBookings] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

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
      setFilteredBookings(sortedBookings);
      
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

  const applyFilter = (filter: string) => {
    setSelectedFilter(filter);
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => booking.status.toLowerCase() === filter.toLowerCase());
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
    
    // Fallback to service name
    const service = booking.services[0]?.service;
    if (!service || typeof service === 'string') return isRTL ? 'خدمة' : 'Service';
    return isRTL ? (service as any)?.nameAr || (service as any)?.name || 'خدمة' : (service as any)?.name || 'Service';
  };

  const getServiceId = (booking: Booking) => {
    const service = booking.services[0]?.service;
    return typeof service === 'string' ? service : (service as any)?._id;
  };

  const getVendorName = (booking: Booking) => {
    const vendor = booking.services[0]?.vendor;
    if (!vendor || typeof vendor !== 'object') return isRTL ? 'مقدم الخدمة' : 'Vendor';
    return isRTL 
      ? (vendor as any)?.nameAr || (vendor as any)?.vendorProfile?.businessName_ar || (vendor as any)?.name || 'مقدم الخدمة'
      : (vendor as any)?.name || (vendor as any)?.vendorProfile?.businessName || 'Vendor';
  };

  const getDescription = (booking: Booking) => {
    const service = booking.services[0]?.service;
    if (!service || typeof service === 'string') return isRTL ? 'لا يوجد وصف' : 'No description';
    return isRTL ? (service as any)?.descriptionAr || (service as any)?.description || 'لا يوجد وصف' : (service as any)?.description || 'No description';
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
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getStatusStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    const colors: { [key: string]: string } = {
      'confirmed': '#4CAF50',
      'pending': '#FF9800',
      'cancelled': '#F44336',
      'completed': '#2196F3'
    };
    const labels: { [key: string]: { ar: string; en: string } } = {
      'confirmed': { ar: 'مؤكد', en: 'Confirmed' },
      'pending': { ar: 'قيد الانتظار', en: 'Pending' },
      'cancelled': { ar: 'ملغي', en: 'Cancelled' },
      'completed': { ar: 'مكتمل', en: 'Completed' }
    };
    return {
      color: colors[statusLower] || '#757575',
      text: isRTL ? labels[statusLower]?.ar || status : labels[statusLower]?.en || status.charAt(0).toUpperCase() + status.slice(1)
    };
  };

  // Get total price from booking - use totalPrice directly from database
  const getTotalPrice = (booking: Booking): number => {
    // Use totalPrice from booking as it already includes quantity and options
    return booking.totalPrice || 0;
  };

  // Get options price separately for display
  const getOptionsPrice = (booking: Booking): number => {
    const service = booking.services?.[0];
    if (!service || !service.customInputs) return 0;
    
    let optionsTotal = 0;
    service.customInputs.forEach((input: any) => {
      if (input.price) {
        optionsTotal += input.price;
      }
    });
    
    return optionsTotal;
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
        Alert.alert(isRTL ? 'غير مسموح' : 'Not Allowed', isRTL ? 'لا يمكن إنشاء رمز QR لهذا نوع الحدث' : 'QR codes cannot be created for this occasion type');
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

  if (loading) {
    return (
      <View style={[styles.container, { position: 'relative' }]}>
        {/* header background to fill notch */}
        <View style={[styles.headerBackground, { height: insets.top + 78 }]} />

        <View style={[styles.header, { height: insets.top + 78 }]}>
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
      <View style={[styles.headerBackground, { height: insets.top + 78 }]} />

      <View style={[styles.header, { height: insets.top + 78 }]}>
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

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => applyFilter('all')}>
            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
              {isRTL ? 'الكل' : 'All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'confirmed' && styles.filterButtonActive]}
            onPress={() => applyFilter('confirmed')}>
            <Text style={[styles.filterButtonText, selectedFilter === 'confirmed' && styles.filterButtonTextActive]}>
              {isRTL ? 'مؤكد' : 'Confirmed'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => applyFilter('pending')}>
            <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
              {isRTL ? 'قيد الانتظار' : 'Pending'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
            onPress={() => applyFilter('completed')}>
            <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
              {isRTL ? 'مكتمل' : 'Completed'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'cancelled' && styles.filterButtonActive]}
            onPress={() => applyFilter('cancelled')}>
            <Text style={[styles.filterButtonText, selectedFilter === 'cancelled' && styles.filterButtonTextActive]}>
              {isRTL ? 'ملغي' : 'Cancelled'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? (isRTL ? 'لا توجد حجوزات بعد' : 'No bookings yet')
                : (isRTL ? 'لا توجد حجوزات في هذه الفئة' : 'No bookings in this category')}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking._id} style={styles.bookingCard}>
              {/* Service Name with Status Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.serviceNameContainer}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {getServiceName(booking)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(booking.status).color }]}>
                  <Text style={styles.statusText}>{getStatusStyle(booking.status).text}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {getDescription(booking)}
              </Text>

              {/* Booking Info */}
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  {isRTL ? 'التاريخ: ' : 'Date: '}{formatDateTime(booking.eventDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  {isRTL ? 'الوقت: ' : 'Time: '}{formatDateTime(booking.eventTime.start, true)} - {formatDateTime(booking.eventTime.end, true)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoText} numberOfLines={2}>
                  {isRTL ? 'الموقع: ' : 'Location: '}{formatLocation(booking.location)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  {isRTL ? 'مقدم الخدمة: ' : 'Vendor: '}{getVendorName(booking)}
                </Text>
              </View>

              {/* Custom Inputs / Add-ons */}
              {booking.services[0]?.customInputs && booking.services[0].customInputs.length > 0 && (
                <View style={styles.customInputsContainer}>
                  <Text style={styles.customInputsTitle}>
                    {isRTL ? 'الإضافات:' : 'Add-ons:'}
                  </Text>
                  {booking.services[0].customInputs.map((input: any, index: number) => (
                    <View key={index} style={styles.customInputRow}>
                      <Text style={styles.customInputLabel}>
                        {input.label}
                        {input.price && (
                          <Text style={{ color: '#00695C', fontSize: 11 }}>
                            {' '}(+{input.price.toFixed(3)} {isRTL ? 'د.ك' : 'KWD'})
                          </Text>
                        )}:
                      </Text>
                      <Text style={styles.customInputValue}>
                        {Array.isArray(input.value) 
                          ? input.value.join(', ')
                          : typeof input.value === 'number' 
                          ? input.value 
                          : String(input.value)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Price */}
              <View style={styles.priceContainer}>
                {booking.coupon && booking.coupon.discountAmount > 0 ? (
                  <>
                    {/* Original Price with strikethrough */}
                    <View style={{ marginBottom: 4 }}>
                      <Text style={[styles.priceLabel, { fontSize: 12, color: '#999' }]}>
                        {isRTL ? 'المبلغ قبل الخصم:' : 'Original Amount:'}
                      </Text>
                      <Text style={[styles.priceValue, { fontSize: 14, color: '#999', textDecorationLine: 'line-through' }]}>
                        KWD {booking.coupon.originalPrice.toFixed(3)}
                      </Text>
                    </View>
                    
                    {/* Discount Amount */}
                    <View style={{ marginBottom: 4 }}>
                      <Text style={[styles.priceLabel, { fontSize: 12, color: '#4CAF50' }]}>
                        {isRTL ? 'الخصم' : 'Discount'} ({booking.coupon.code}):
                      </Text>
                      <Text style={[styles.priceValue, { fontSize: 14, color: '#4CAF50' }]}>
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
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                      {booking.services?.[0]?.quantity > 1 && (
                        <Text style={[styles.priceValue, { fontSize: 12, color: '#666' }]}>
                          ({booking.services[0].quantity} × {(booking.services[0].price + getOptionsPrice(booking)).toFixed(3)})
                          {' = '}
                        </Text>
                      )}
                      <Text style={styles.priceValue}>
                        KWD {getTotalPrice(booking).toFixed(3)}
                      </Text>
                    </View>
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
                    if (serviceId && onWriteReview) {
                      onWriteReview(booking._id, serviceId, getServiceName(booking));
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
