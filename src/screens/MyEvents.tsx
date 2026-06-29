import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Clipboard,
  StatusBar,
  Modal,
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
import { fetchOccasions, Occasion, getUserDashboardBookings } from '../services/api';
import { getQRCodeByBooking, getQRCodeSettings } from '../services/qrCodeApi';
import { useAuth } from '../contexts/AuthContext';
import { QRFormModal } from '../components/QRCodeCard/QRFormModal';

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

interface EventServiceRow {
  bookingId: string;
  serviceId: string;
  service: any;
  vendor: any;
  booking: any;
  uniqueKey: string;
}

const MyEvents: React.FC<MyEventsProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const getStatusBadgeStyle = (status: string) => {
    const lower = status ? status.toLowerCase() : '';
    if (lower === 'confirmed') return { bg: '#EAF8F1', text: '#2E7D32' };
    if (lower === 'pending') return { bg: '#FFF8E1', text: '#F57F17' };
    if (lower === 'cancelled') return { bg: '#FEEBEE', text: '#C62828' };
    return { bg: '#F1F5F9', text: '#475569' };
  };
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Date and Occasion filters
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);

  // Guest list Modal display
  const [guestListModalVisible, setGuestListModalVisible] = useState(false);
  const [selectedBookingForGuests, setSelectedBookingForGuests] = useState<any>(null);
  const [guestsData, setGuestsData] = useState<{ [key: string]: EventGuest[] }>(
    {},
  );
  const [loadingGuests, setLoadingGuests] = useState<{
    [key: string]: boolean;
  }>({});

  // QR Modal States
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    loadEvents();
    loadOccasions();
  }, []);

  // Derive filteredEvents directly during render to prevent state-update lag and visual flashing
  const filteredEvents = React.useMemo(() => {
    let filtered = events;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.booking.status === selectedFilter);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(item => {
        const eventDate = new Date(item.booking.eventDate);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Filter by occasion
    if (selectedOccasionId) {
      filtered = filtered.filter(item => {
        const fullService = item.service;
        if (fullService && Array.isArray(fullService.occasions)) {
          const matchesOccasion = fullService.occasions.some((occ: any) => {
            const occId = occ.occasion && occ.occasion._id ? String(occ.occasion._id) : String(occ.occasion || '');
            return occId === selectedOccasionId;
          });
          if (matchesOccasion) return true;
        }

        const bookingOccId = item.booking?.occasion && item.booking.occasion._id
          ? String(item.booking.occasion._id)
          : String(item.booking?.occasion || '');
        return bookingOccId === selectedOccasionId;
      });
    }

    return filtered;
  }, [events, selectedFilter, selectedDate, selectedOccasionId]);

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

      // Fetch user's own dashboard bookings and QR settings in parallel
      const [bookings, settings] = await Promise.all([
        getUserDashboardBookings(token),
        getQRCodeSettings(token),
      ]);

      const servicesList: EventServiceRow[] = [];
      const matchesId = (id1: any, id2: any) => {
        const str1 = typeof id1 === 'object' ? id1?._id?.toString() || id1?.toString() : id1?.toString();
        const str2 = typeof id2 === 'object' ? id2?._id?.toString() || id2?.toString() : id2?.toString();
        return str1 === str2;
      };

      const isOccasionCategoryAllowed = (occasionId: any, categoryId: any) => {
        if (!settings || !settings.isEnabled) {
          return false;
        }

        const allowedOccasion = settings.allowedOccasions?.find(
          (ao: any) => matchesId(ao.occasion?._id || ao.occasion, occasionId) && ao.isEnabled
        );

        if (!allowedOccasion) return false;

        const occasionObj = typeof allowedOccasion.occasion === 'object' ? allowedOccasion.occasion : null;
        const availableCategories = (occasionObj as any)?.categories || [];
        const allowedCategoryIds = allowedOccasion.allowedCategories || [];

        if (occasionObj && availableCategories.length === 0) return true;
        if (allowedCategoryIds.length === 0) return false;
        if (!categoryId) return false;

        return allowedCategoryIds.some((id: any) => matchesId(id, categoryId));
      };

      const allBookings = Array.isArray(bookings) ? bookings : [];

      allBookings.forEach((booking: any) => {
        (booking.services || []).forEach((s: any) => {
          // Hide cancelled services
          if (s.status === 'cancelled') return;

          // Hide services whose event date has already passed
          const svcDate = s.eventDate || booking.eventDate;
          if (svcDate) {
            const eventDay = new Date(svcDate);
            eventDay.setHours(23, 59, 59, 999); // event counts as "passed" only after its day ends
            if (eventDay < new Date()) return;
          }

          const serviceId = s.service && s.service._id ? String(s.service._id) : String(s.service || '');
          
          let isServiceAllowed = false;
          if (s.service && Array.isArray(s.service.occasions)) {
            for (const occ of s.service.occasions) {
              if (isOccasionCategoryAllowed(occ.occasion, occ.categoryId)) {
                isServiceAllowed = true;
                break;
              }
            }
          }

          if (isServiceAllowed) {
            servicesList.push({
              bookingId: booking._id,
              serviceId,
              service: s.service,
              vendor: s.vendor,
              booking,
              uniqueKey: `${booking._id}-${serviceId}`
            });
          }
        });
      });

      // Sort servicesList by booking createdAt descending (newest bookings first)
      servicesList.sort((a, b) => {
        const timeB = b.booking.createdAt ? new Date(b.booking.createdAt).getTime() : 0;
        const timeA = a.booking.createdAt ? new Date(a.booking.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setEvents(servicesList);
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

  const handleCopyQR = async (bookingId: string, bookingStatus?: string) => {
    if (bookingStatus === 'cancelled') {
      showAlert(
        isRTL ? 'تنبيه' : 'Info',
        isRTL ? 'لا يمكن نسخ رمز QR لحجز ملغي.' : 'Cannot copy QR code for a cancelled booking.',
      );
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

  const handleViewQR = async (booking: any) => {
    if (booking?.status === 'cancelled') {
      showAlert(
        isRTL ? 'تنبيه' : 'Info',
        isRTL ? 'لا يمكن عرض أو تعديل رمز QR لحجز ملغي.' : 'Cannot view or edit QR code for a cancelled booking.',
      );
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

      setLoading(true);
      // Check if QR exists
      let qrData = null;
      try {
        qrData = await getQRCodeByBooking(token, booking._id);
      } catch (err: any) {
        console.log('No QR code found or failed to fetch. Opening QR modal in creation mode.', err);
      }
      
      setSelectedBooking(booking);
      setSelectedQRCode(qrData);
      setQrModalVisible(true);
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل عرض QR' : 'Failed to view QR',
      );
    } finally {
      setLoading(false);
    }
    setExpandedEventId(null);
  };

  const handleGuestList = async (booking: any) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول' : 'Please login',
        );
        return;
      }

      setSelectedBookingForGuests(booking);
      setGuestListModalVisible(true);
      setLoadingGuests(prev => ({ ...prev, [booking._id]: true }));

      // Fetch guests for this booking
      const response = await fetch(`${API_URL}/bookings/${booking._id}/guests`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const guests = await response.json();
        setGuestsData(prev => ({ ...prev, [booking._id]: guests || [] }));
      } else {
        throw new Error('Failed to fetch guests');
      }
    } catch (error) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل قائمة الضيوف' : 'Failed to load guest list',
      );
    } finally {
      setLoadingGuests(prev => ({ ...prev, [booking._id]: false }));
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

  const handleLeaveGuest = async (bookingId: string) => {
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
        `${API_URL}/bookings/${bookingId}/guests`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        // Clear or refresh local guest list
        setGuestsData(prev => ({
          ...prev,
          [bookingId]: (prev[bookingId] || []).filter(g => {
            const guestUserId = g.user?._id || g.user;
            return guestUserId !== user?._id;
          }),
        }));

        // Reload events to get updated data
        await loadEvents();

        showAlert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'غادرت قائمة الضيوف' : 'Left the guest list',
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData?.message || 'Failed to leave guest list');
      }
    } catch (error: any) {
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل مغادرة قائمة الضيوف' : 'Failed to leave guest list'),
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
    setSelectedOccasionId('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
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

  const renderEventItem = ({ item }: { item: EventServiceRow }) => {
    const isExpanded = expandedEventId === item.uniqueKey;
    const statusStyle = getStatusBadgeStyle(item.booking?.status || '');
    const serviceName = isRTL ? (item.service?.nameAr || item.service?.name) : item.service?.name;
    const vendorName = item.vendor?.businessName || item.vendor?.name || '';

    return (
      <View style={[styles.eventCard, isExpanded && { zIndex: 999, elevation: 10 }]}>
        <View style={styles.eventHeader}>
          <View style={styles.eventMainInfo}>
            <Text style={styles.eventTitle}>{serviceName || (isRTL ? 'خدمة' : 'Service')}</Text>
            {vendorName ? (
              <Text style={styles.eventVendor}>
                {isRTL ? 'مقدم الخدمة: ' : 'Vendor: '}
                <Text style={styles.eventVendorName}>
                  {vendorName}
                </Text>
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setExpandedEventId(isExpanded ? null : item.uniqueKey)}
            activeOpacity={0.7}
          >
            <Icon
              name="ellipsis-vertical"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.eventMetaRow}>
          <View style={styles.eventDateBadge}>
            <Icon name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.eventDateText}>
              {item.booking?.eventDate ? formatDate(item.booking.eventDate) : ''}
            </Text>
          </View>

          <View style={styles.guestCountBadge}>
            <Icon name="people-outline" size={14} color="#475569" />
            <Text style={styles.guestCountText}>
              {isRTL
                ? `الضيوف: ${item.booking?.guests?.length || 0}/${item.booking?.guestLimit || 0}`
                : `Guests: ${item.booking?.guests?.length || 0}/${item.booking?.guestLimit || 0}`}
            </Text>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {isRTL
                ? item.booking?.status === 'confirmed'
                  ? 'مؤكد'
                  : item.booking?.status === 'pending'
                  ? 'قيد الانتظار'
                  : 'ملغي'
                : (item.booking?.status ? item.booking.status.charAt(0).toUpperCase() + item.booking.status.slice(1) : '')}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={[styles.menuDropdown, { top: 50 }, isRTL ? { left: 16 } : { right: 16 }]}>
            {item.booking?.status !== 'cancelled' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setExpandedEventId(null);
                    handleCopyQR(item.bookingId, item.booking?.status);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemContent, isRTL && styles.menuItemContentRTL]}>
                    <Icon
                      name="copy-outline"
                      size={16}
                      color={colors.primary}
                      style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
                    />
                    <Text style={[styles.menuItemText, isRTL && styles.menuItemTextRTL]}>
                      {isRTL ? 'نسخ QR' : 'Copy QR'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.menuDivider} />
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setExpandedEventId(null);
                    handleViewQR(item.booking);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemContent, isRTL && styles.menuItemContentRTL]}>
                    <Icon
                      name="qr-code-outline"
                      size={16}
                      color={colors.primary}
                      style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
                    />
                    <Text style={[styles.menuItemText, isRTL && styles.menuItemTextRTL]}>
                      {isRTL ? 'عرض/تعديل QR' : 'View/Edit QR'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.menuDivider} />
              </>
            )}
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setExpandedEventId(null);
                handleGuestList(item.booking);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemContent, isRTL && styles.menuItemContentRTL]}>
                <Icon
                  name="people-outline"
                  size={16}
                  color={colors.primary}
                  style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
                />
                <Text style={[styles.menuItemText, isRTL && styles.menuItemTextRTL]}>
                  {isRTL ? 'الضيوف' : 'Guests'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
              {isRTL ? 'فعالياتي' : 'My Events'}
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
            {isRTL ? 'فعالياتي' : 'My Events'}
          </Text>

          {/* Date and Occasion Filters */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Icon
                name="calendar-outline"
                size={16}
                color={colors.primary}
                style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }}
              />
              <Text style={styles.dateFilterText} numberOfLines={1}>
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                    })
                  : isRTL
                  ? 'تحديد التاريخ'
                  : 'Select Date'}
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
              <Icon
                name="funnel-outline"
                size={16}
                color={colors.primary}
                style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }}
              />
              <Text
                style={styles.occasionFilterText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedOccasionId
                  ? (occasions.find(o => o._id === selectedOccasionId)
                      ? (isRTL
                          ? occasions.find(o => o._id === selectedOccasionId)?.nameAr
                          : occasions.find(o => o._id === selectedOccasionId)?.name)
                      : '')
                  : (isRTL ? 'اختر المناسبة' : 'Select Occasion')}
              </Text>
              {selectedOccasionId ? (
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
              keyExtractor={item => item.uniqueKey}
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
            onSelect={occasion => {
              setSelectedOccasionId(occasion._id);
            }}
            selectedOccasion={occasions.find(
              o => o._id === selectedOccasionId,
            )}
          />

          {/* QR Form Modal */}
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
                loadEvents();
              }}
            />
          )}

          {/* Guest List Modal */}
          <Modal
            visible={guestListModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              setGuestListModalVisible(false);
              setSelectedBookingForGuests(null);
            }}
          >
            <View style={styles.guestPageContainer}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => {
                  setGuestListModalVisible(false);
                  setSelectedBookingForGuests(null);
                }}
              />
              <View style={styles.guestPageContent}>
                <View style={styles.guestPageHeader}>
                  <TouchableOpacity
                    style={styles.guestPageBackButton}
                    onPress={() => {
                      setGuestListModalVisible(false);
                      setSelectedBookingForGuests(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={isRTL ? 'chevron-forward' : 'chevron-back'}
                      size={24}
                      color={colors.primaryDark}
                    />
                  </TouchableOpacity>
                  <Text style={styles.guestPageTitle}>
                    {isRTL ? 'قائمة الضيوف' : 'Guest List'}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.guestPageScroll} showsVerticalScrollIndicator={false}>
                  {selectedBookingForGuests && (
                    <>
                      {loadingGuests[selectedBookingForGuests._id] ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>
                            {isRTL ? 'جاري التحميل...' : 'Loading...'}
                          </Text>
                        </View>
                      ) : !guestsData[selectedBookingForGuests._id] || guestsData[selectedBookingForGuests._id].length === 0 ? (
                        <View style={styles.emptyGuestList}>
                          <Text style={styles.emptyGuestText}>
                            {isRTL ? 'لا يوجد ضيوف' : 'No guests'}
                          </Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4 }}>
                          {guestsData[selectedBookingForGuests._id].map((guest: any) => {
                            const isCurrentUser = guest.user?._id
                              ? guest.user._id === user?.id || guest.user._id === user?._id
                              : guest.user === user?.id || guest.user === user?._id;

                            const bookingCustomerId = selectedBookingForGuests.customer?._id || selectedBookingForGuests.customer;
                            const canRemove =
                              user?.role === 'admin' ||
                              (bookingCustomerId && (bookingCustomerId === user?.id || bookingCustomerId === user?._id));

                            return (
                              <View key={guest._id} style={[styles.guestListItem, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[{ flex: 1, alignItems: 'flex-start' }, isRTL && { alignItems: 'flex-end' }]}>
                                  <Text style={[styles.guestListName, isRTL && { textAlign: 'right' }]}>
                                    {guest.name || guest.user?.name || (isRTL ? 'ضيف' : 'Guest')}
                                    <Text style={styles.guestListSubText}>
                                      {guest.phone ? ` (${guest.phone})` : guest.email || guest.user?.email ? ` (${guest.email || guest.user?.email})` : ''}
                                    </Text>
                                  </Text>
                                  <Text style={[styles.guestListMetaText, isRTL && { textAlign: 'right' }]}>
                                    {`#${String(guest._id).slice(-6)} • `}
                                    {guest.joinedAt ? new Date(guest.joinedAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                  </Text>
                                </View>
                                <View style={[{ flexDirection: 'row', gap: 12, alignItems: 'center' }, isRTL && { flexDirection: 'row-reverse' }]}>
                                  {canRemove && (
                                    <TouchableOpacity
                                      style={styles.guestActionIconButton}
                                      onPress={() => handleRemoveGuest(guest._id, selectedBookingForGuests._id)}
                                      activeOpacity={0.7}
                                    >
                                      <Icon name="trash-outline" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                  )}
                                  {isCurrentUser && (
                                    <TouchableOpacity
                                      style={styles.guestActionIconButton}
                                      onPress={() => handleLeaveGuest(selectedBookingForGuests._id)}
                                      activeOpacity={0.7}
                                    >
                                      <Icon name="log-out-outline" size={18} color="#f97316" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </>
  );
};

export default MyEvents;
