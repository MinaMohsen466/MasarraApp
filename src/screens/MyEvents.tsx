import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Clipboard,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/colors';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { CustomAlert } from '../components/CustomAlert';
import OccasionSelector from '../components/SearchSection/OccasionSelector';
import DateSelector from '../components/SearchSection/DateSelector';
import { API_URL } from '../config/api.config';
import { myEventsStyles as styles } from './myEventsStyles';
import { fetchOccasions, Occasion } from '../services/api';
import { getQRCodeByBooking, getUserQRCodes } from '../services/qrCodeApi';

interface MyEventsProps {
  onBack?: () => void;
}

interface EventGuest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  user?: any;
}

interface EventService {
  _id: string;
  service: any;
  vendor: any;
  price: number;
  status: string;
}

interface MyEvent {
  _id: string;
  eventDate: string;
  eventTime: {
    start: string;
    end: string;
  };
  services: EventService[];
  packages: any[];
  status: string;
  guests: EventGuest[];
  guestLimit: number;
}

const MyEvents: React.FC<MyEventsProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const getStatusBadgeStyle = (status: string) => {
    const lower = status ? status.toLowerCase() : '';
    if (lower === 'confirmed') return { bg: '#EAF8F1', text: '#2E7D32' };
    if (lower === 'pending') return { bg: '#FFF8E1', text: '#F57F17' };
    if (lower === 'cancelled') return { bg: '#FEEBEE', text: '#C62828' };
    return { bg: '#F1F5F9', text: '#475569' };
  };
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Date and Occasion filters
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);

  // Guest list - inline display (not modal)
  const [expandedGuestListId, setExpandedGuestListId] = useState<string | null>(
    null,
  );
  const [guestsData, setGuestsData] = useState<{ [key: string]: EventGuest[] }>(
    {},
  );
  const [loadingGuests, setLoadingGuests] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    loadEvents();
    loadOccasions();
  }, []);

  // Derive filteredEvents directly during render to prevent state-update lag and visual flashing
  const filteredEvents = React.useMemo(() => {
    let filtered = events;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(event => event.status === selectedFilter);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Filter by occasion (service name)
    if (selectedOccasion) {
      filtered = filtered.filter(event => {
        if (event.services && event.services.length > 0) {
          const serviceName = event.services[0].service?.name || '';
          return serviceName
            .toLowerCase()
            .includes(selectedOccasion.toLowerCase());
        }
        return false;
      });
    }

    return filtered;
  }, [events, selectedFilter, selectedDate, selectedOccasion]);

  const loadOccasions = async () => {
    try {
      const data = await fetchOccasions();
      setOccasions(data);
    } catch (error) {}
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first',
        );
        setLoading(false);
        return;
      }

      // Fetch user's own bookings and their QR codes in parallel
      const [bookingsResponse, qrCodesResponse] = await Promise.all([
        fetch(`${API_URL}/bookings`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        getUserQRCodes(token),
      ]);

      if (!bookingsResponse.ok) {
        throw new Error(`HTTP ${bookingsResponse.status}`);
      }

      const bookings = await bookingsResponse.json();
      const allBookings = Array.isArray(bookings) ? bookings : [];

      let bookingsWithQR: MyEvent[] = [];

      if (qrCodesResponse?.success) {
        // Create a set of booking IDs that have QR codes for O(1) lookup
        const qrCodesList = qrCodesResponse.qrCodes || [];
        const bookingsWithQRSet = new Set(
          qrCodesList.filter(qr => qr.qrUrl).map(qr => qr.booking)
        );

        // Only keep bookings that have QR codes
        bookingsWithQR = allBookings.filter(booking =>
          bookingsWithQRSet.has(booking._id)
        );
      } else {
        // Fallback: Check each booking individually since bulk API is not available on production server yet
        const qrChecks = await Promise.all(
          allBookings.map(async (booking) => {
            try {
              const qr = await getQRCodeByBooking(token, booking._id);
              if (qr && qr.qrUrl) {
                return booking;
              }
            } catch (e) {
              // Ignore
            }
            return null;
          })
        );
        bookingsWithQR = qrChecks.filter((b): b is MyEvent => b !== null);
      }

      // Sort by event date (newest first)
      bookingsWithQR.sort(
        (a, b) =>
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
      );

      setEvents(bookingsWithQR);
    } catch (error: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'حدث خطأ أثناء تحميل الفعاليات' : 'Error loading events',
      );
    } finally {
      setLoading(false);
    }
  };

  // Removed filterEvents function as it is now derived via React.useMemo

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleCopyQR = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول' : 'Please login',
        );
        return;
      }

      // Fetch QR code data from API
      const qrData = await getQRCodeByBooking(token, bookingId);

      if (qrData && qrData.qrUrl) {
        await Clipboard.setString(qrData.qrUrl);
        showAlert(
          isRTL ? 'نجح' : 'Success',
          isRTL
            ? 'تم نسخ رابط QR إلى الحافظة!'
            : 'QR link copied to clipboard!',
        );
      } else {
        showAlert(
          isRTL ? 'تنبيه' : 'Info',
          isRTL
            ? 'لا يوجد رمز QR متاح لهذا الحجز. قم بإنشائه من الحجوزات.'
            : 'No QR code available for this booking. Create it from bookings.',
        );
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showAlert(
          isRTL ? 'تنبيه' : 'Info',
          isRTL
            ? 'لا يوجد رمز QR متاح لهذا الحجز. قم بإنشائه من الحجوزات.'
            : 'No QR code available. Create it from bookings.',
        );
      } else {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل نسخ رابط QR' : 'Failed to copy QR link',
        );
      }
    }
    setExpandedEventId(null);
  };

  const handleViewQR = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول' : 'Please login',
        );
        return;
      }

      // Check if QR exists
      const qrData = await getQRCodeByBooking(token, bookingId);

      if (qrData && qrData.qrUrl) {
        // Open QR URL in browser
        await Linking.openURL(qrData.qrUrl);
      } else {
        showAlert(
          isRTL ? 'تنبيه' : 'Info',
          isRTL
            ? 'لا يوجد رمز QR متاح لهذا الحجز'
            : 'No QR code available for this booking',
        );
      }
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل عرض QR' : 'Failed to view QR',
      );
    }
    setExpandedEventId(null);
  };

  const handleGuestList = async (bookingId: string) => {
    // Toggle guest list display
    if (expandedGuestListId === bookingId) {
      setExpandedGuestListId(null);
      setExpandedEventId(null);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول' : 'Please login',
        );
        return;
      }

      // Set loading state for this booking
      setLoadingGuests(prev => ({ ...prev, [bookingId]: true }));
      setExpandedGuestListId(bookingId);

      // Fetch guests for this booking
      const response = await fetch(`${API_URL}/bookings/${bookingId}/guests`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const guests = await response.json();
        setGuestsData(prev => ({ ...prev, [bookingId]: guests || [] }));
      } else {
        throw new Error('Failed to fetch guests');
      }
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل قائمة الضيوف' : 'Failed to load guest list',
      );
      setExpandedGuestListId(null);
    } finally {
      setLoadingGuests(prev => ({ ...prev, [bookingId]: false }));
    }
    setExpandedEventId(null);
  };

  const handleRemoveGuest = async (guestId: string, bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول' : 'Please login',
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/guests/${guestId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        // Update local guest list for this booking
        setGuestsData(prev => ({
          ...prev,
          [bookingId]: (prev[bookingId] || []).filter(g => g._id !== guestId),
        }));

        // Reload events to get updated data
        await loadEvents();

        showAlert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم حذف الضيف بنجاح' : 'Guest removed successfully',
        );
      } else {
        throw new Error('Failed to remove guest');
      }
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل حذف الضيف' : 'Failed to remove guest',
      );
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const clearOccasionFilter = () => {
    setSelectedOccasion('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getOccasionName = (event: MyEvent) => {
    // Get the first service's name as occasion
    if (event.services && event.services.length > 0) {
      return event.services[0].service?.name || (isRTL ? 'مناسبة' : 'Event');
    }
    return isRTL ? 'مناسبة' : 'Event';
  };

  const getVendorName = (event: MyEvent) => {
    // Get the first service's vendor name
    if (event.services && event.services.length > 0) {
      return event.services[0].vendor?.businessName || '';
    }
    return '';
  };

  const renderFilterButton = (label: string, value: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: MyEvent }) => {
    const isExpanded = expandedEventId === item._id;
    const statusStyle = getStatusBadgeStyle(item.status);

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventMainInfo}>
            <Text style={styles.eventTitle}>{getOccasionName(item)}</Text>
            {getVendorName(item) ? (
              <Text style={styles.eventVendor}>
                {isRTL ? 'مقدم الخدمة: ' : 'Vendor: '}
                <Text style={styles.eventVendorName}>{getVendorName(item)}</Text>
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setExpandedEventId(isExpanded ? null : item._id)}
            activeOpacity={0.7}
          >
            <Icon name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.eventMetaRow}>
          <View style={styles.eventDateBadge}>
            <Icon name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.eventDateText}>{formatDate(item.eventDate)}</Text>
          </View>
          
          <View style={styles.guestCountBadge}>
            <Icon name="people-outline" size={14} color="#475569" />
            <Text style={styles.guestCountText}>
              {isRTL 
                ? `الضيوف: ${item.guests?.length || 0}/${item.guestLimit || 0}`
                : `Guests: ${item.guests?.length || 0}/${item.guestLimit || 0}`}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {isRTL 
                ? (item.status === 'confirmed' ? 'مؤكد' : item.status === 'pending' ? 'قيد الانتظار' : 'ملغي')
                : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.simpleActionButton}
              onPress={() => handleCopyQR(item._id)}
              activeOpacity={0.8}
            >
              <Text style={styles.simpleActionButtonText}>
                {isRTL ? 'نسخ QR' : 'Copy QR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simpleActionButton}
              onPress={() => handleViewQR(item._id)}
              activeOpacity={0.8}
            >
              <Text style={styles.simpleActionButtonText}>
                {isRTL ? 'عرض QR' : 'View QR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simpleActionButton}
              onPress={() => handleGuestList(item._id)}
              activeOpacity={0.8}
            >
              <Text style={styles.simpleActionButtonText}>
                {isRTL ? 'الضيوف' : 'Guests'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {expandedGuestListId === item._id && (
          <View style={styles.guestListContainer}>
            {loadingGuests[item._id] ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>
                  {isRTL ? 'جاري التحميل...' : 'Loading...'}
                </Text>
              </View>
            ) : (guestsData[item._id] || []).length === 0 ? (
              <View style={styles.emptyGuestList}>
                <Text style={styles.emptyGuestText}>
                  {isRTL ? 'لا يوجد ضيوف' : 'No guests'}
                </Text>
              </View>
            ) : (
              guestsData[item._id]?.map(guest => (
                <View key={guest._id} style={styles.guestListItem}>
                  <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>{guest.name}</Text>
                    <Text style={styles.guestPhone}>{guest.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteGuestButton}
                    onPress={() => handleRemoveGuest(guest._id, item._id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteGuestButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
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
          <View style={[styles.container, { position: 'relative' }]}>
            {/* Curved Header Background Block with topographic waves & integrated navigation */}
            <View style={styles.profileHeaderBlock}>
              <Svg width="100%" height="100%" viewBox="0 0 375 110" preserveAspectRatio="none" style={styles.topographicSvg}>
                <Path d="M-20 20 C80 55 180 12 300 45 T400 35" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} fill="none" />
                <Path d="M-20 35 C80 70 180 20 300 60 T400 50" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} fill="none" />
                <Path d="M-20 50 C80 85 180 28 300 75 T400 65" stroke="rgba(255,255,255,0.15)" strokeWidth={2} fill="none" />
              </Svg>

              {/* Overlay Navigation Bar */}
              <View style={[styles.headerOverlayBar, isRTL && styles.headerOverlayBarRTL]}>
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
                <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
                  {isRTL ? 'فعالياتي' : 'My Events'}
                </Text>
                <View style={styles.headerSpacer} />
              </View>
            </View>

            {/* Curved Wave Divider (Transitions header to card background) */}
            <View style={styles.profileCurveDivider}>
              <Svg height="30" width="100%" viewBox="0 0 375 30" preserveAspectRatio="none">
                <Path d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z" fill={colors.background} />
              </Svg>
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
        <View style={[styles.container, { position: 'relative' }]}>
          {/* Curved Header Background Block with topographic waves & integrated navigation */}
          <View style={styles.profileHeaderBlock}>
            <Svg width="100%" height="100%" viewBox="0 0 375 110" preserveAspectRatio="none" style={styles.topographicSvg}>
              <Path d="M-20 20 C80 55 180 12 300 45 T400 35" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} fill="none" />
              <Path d="M-20 35 C80 70 180 20 300 60 T400 50" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} fill="none" />
              <Path d="M-20 50 C80 85 180 28 300 75 T400 65" stroke="rgba(255,255,255,0.15)" strokeWidth={2} fill="none" />
            </Svg>

            {/* Overlay Navigation Bar */}
            <View style={[styles.headerOverlayBar, isRTL && styles.headerOverlayBarRTL]}>
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
              <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
                {isRTL ? 'فعالياتي' : 'My Events'}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Curved Wave Divider (Transitions header to card background) */}
          <View style={styles.profileCurveDivider}>
            <Svg height="30" width="100%" viewBox="0 0 375 30" preserveAspectRatio="none">
              <Path d="M0,20 C100,40 250,0 375,20 L375,30 L0,30 Z" fill={colors.background} />
            </Svg>
          </View>

          {/* Date and Occasion Filters */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Icon name="calendar-outline" size={16} color={colors.primary} style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
              <Text style={styles.dateFilterText} numberOfLines={1}>
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                    })
                  : (isRTL ? 'تحديد التاريخ' : 'Select Date')}
              </Text>
              {selectedDate ? (
                <TouchableOpacity
                  onPress={clearDateFilter}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-down" size={14} color="#94A3B8" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.occasionFilterButton}
              onPress={() => setShowOccasionPicker(true)}
              activeOpacity={0.8}
            >
              <Icon name="funnel-outline" size={16} color={colors.primary} style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
              <Text
                style={styles.occasionFilterText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedOccasion ||
                  (isRTL ? 'اختر المناسبة' : 'Select Occasion')}
              </Text>
              {selectedOccasion ? (
                <TouchableOpacity
                  onPress={clearOccasionFilter}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <Icon name="chevron-down" size={14} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>

          {/* Status Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {renderFilterButton(isRTL ? 'الكل' : 'All', 'all')}
            {renderFilterButton(isRTL ? 'مؤكد' : 'Confirmed', 'confirmed')}
            {renderFilterButton(isRTL ? 'قيد الانتظار' : 'Pending', 'pending')}
            {renderFilterButton(isRTL ? 'ملغي' : 'Cancelled', 'cancelled')}
          </ScrollView>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.dateColumn]}>
              {isRTL ? 'التاريخ' : 'Date'}
            </Text>
            <Text style={[styles.tableHeaderText, styles.occasionColumn]}>
              {isRTL ? 'المناسبة' : 'Occasion'}
            </Text>
            <Text style={[styles.tableHeaderText, styles.actionColumn]}>
              {isRTL ? 'الإجراء' : 'Action'}
            </Text>
          </View>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isRTL ? 'لا توجد فعاليات' : 'No events found'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Custom Alert */}
          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            buttons={[
              {
                text: 'OK',
                onPress: () => setAlertVisible(false),
              },
            ]}
            onClose={() => setAlertVisible(false)}
          />

          {/* Date Picker Modal */}
          <DateSelector
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={handleDateSelect}
            selectedDate={selectedDate || undefined}
            allowPastDates={true}
          />

          {/* Occasion Picker Modal */}
          <OccasionSelector
            visible={showOccasionPicker}
            onClose={() => setShowOccasionPicker(false)}
            onSelect={(occasion) => {
              setSelectedOccasion(isRTL ? occasion.nameAr : occasion.name);
            }}
            selectedOccasion={occasions.find(o => (isRTL ? o.nameAr : o.name) === selectedOccasion)}
          />
        </View>
      </View>
    </>
  );
};

export default MyEvents;
