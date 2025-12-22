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
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import { API_URL } from '../config/api.config';
import { myEventsStyles as styles } from './myEventsStyles';
import { fetchOccasions } from '../services/api';
import { canCreateQRCode, getQRCodeByBooking } from '../services/qrCodeApi';
import DateTimePicker from '@react-native-community/datetimepicker';

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

interface Occasion {
  _id: string;
  name: string;
  nameAr: string;
  isActive: boolean;
}

const MyEvents: React.FC<MyEventsProps> = ({ onBack }) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MyEvent[]>([]);
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
  const [expandedGuestListId, setExpandedGuestListId] = useState<string | null>(null);
  const [guestsData, setGuestsData] = useState<{ [key: string]: EventGuest[] }>({});
  const [loadingGuests, setLoadingGuests] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadEvents();
    loadOccasions();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedFilter, selectedDate, selectedOccasion]);

  const loadOccasions = async () => {
    try {
      const data = await fetchOccasions();
      setOccasions(data);
    } catch (error) {
      console.error('Error loading occasions:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first'
        );
        setLoading(false);
        return;
      }

      // Fetch user's own bookings
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const bookings = await response.json();
      
      // Filter bookings that can create QR codes
      const filteredBookings = [];
      for (const booking of (Array.isArray(bookings) ? bookings : [])) {
        const canCreate = await canCreateQRCode(booking, null, token);
        if (canCreate) {
          filteredBookings.push(booking);
        }
      }
      
      setEvents(filteredBookings);
      
    } catch (error: any) {
      console.error('Error loading events:', error);
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'حدث خطأ أثناء تحميل الفعاليات' : 'Error loading events'
      );
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
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
          return serviceName.toLowerCase().includes(selectedOccasion.toLowerCase());
        }
        return false;
      });
    }

    setFilteredEvents(filtered);
  };

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleCopyQR = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
        return;
      }

      // Fetch QR code data from API
      const qrData = await getQRCodeByBooking(token, bookingId);
      
      if (qrData && qrData.qrUrl) {
        await Clipboard.setString(qrData.qrUrl);
        showAlert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم نسخ رابط QR إلى الحافظة!' : 'QR link copied to clipboard!'
        );
      } else {
        showAlert(
          isRTL ? 'تنبيه' : 'Info',
          isRTL ? 'لا يوجد رمز QR متاح لهذا الحجز. قم بإنشائه من الحجوزات.' : 'No QR code available for this booking. Create it from bookings.'
        );
      }
    } catch (error: any) {
      console.error('Error copying QR:', error);
      if (error?.response?.status === 404) {
        showAlert(
          isRTL ? 'تنبيه' : 'Info',
          isRTL ? 'لا يوجد رمز QR متاح لهذا الحجز. قم بإنشائه من الحجوزات.' : 'No QR code available. Create it from bookings.'
        );
      } else {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل نسخ رابط QR' : 'Failed to copy QR link'
        );
      }
    }
    setExpandedEventId(null);
  };

  const handleViewQR = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
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
          isRTL ? 'لا يوجد رمز QR متاح لهذا الحجز' : 'No QR code available for this booking'
        );
      }
    } catch (error) {
      console.error('Error viewing QR:', error);
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل عرض QR' : 'Failed to view QR'
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
        showAlert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
        return;
      }

      // Set loading state for this booking
      setLoadingGuests(prev => ({ ...prev, [bookingId]: true }));
      setExpandedGuestListId(bookingId);

      // Fetch guests for this booking
      const response = await fetch(`${API_URL}/bookings/${bookingId}/guests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      console.error('Error fetching guests:', error);
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل قائمة الضيوف' : 'Failed to load guest list'
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
        showAlert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى تسجيل الدخول' : 'Please login');
        return;
      }

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/guests/${guestId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update local guest list for this booking
        setGuestsData(prev => ({
          ...prev,
          [bookingId]: (prev[bookingId] || []).filter(g => g._id !== guestId)
        }));
        
        // Reload events to get updated data
        await loadEvents();
        
        showAlert(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم حذف الضيف بنجاح' : 'Guest removed successfully'
        );
      } else {
        throw new Error('Failed to remove guest');
      }
    } catch (error) {
      console.error('Error removing guest:', error);
      showAlert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل حذف الضيف' : 'Failed to remove guest'
      );
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const clearOccasionFilter = () => {
    setSelectedOccasion('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
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
        selectedFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === value && styles.filterButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: MyEvent }) => {
    const isExpanded = expandedEventId === item._id;

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventDate}>{formatDate(item.eventDate)}</Text>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>{getOccasionName(item)}</Text>
              <Text style={styles.eventVendor}>{getVendorName(item)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setExpandedEventId(isExpanded ? null : item._id)}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleCopyQR(item._id)}
            >
              <Text style={styles.menuItemText}>
                {isRTL ? 'نسخ QR' : 'Copy QR'}
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleViewQR(item._id)}
            >
              <Text style={styles.menuItemText}>
                {isRTL ? 'عرض QR' : 'View QR'}
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleGuestList(item._id)}
            >
              <Text style={styles.menuItemText}>
                {isRTL ? 'قائمة الضيوف' : 'Guest List'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {expandedGuestListId === item._id && (
          <View style={styles.guestListContainer}>
            {loadingGuests[item._id] ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8B4789" />
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
              guestsData[item._id]?.map((guest) => (
                <View key={guest._id} style={styles.guestListItem}>
                  <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>{guest.name}</Text>
                    <Text style={styles.guestPhone}>{guest.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteGuestButton}
                    onPress={() => handleRemoveGuest(guest._id, item._id)}
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>{isRTL ? '›' : '‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRTL ? 'فعالياتي' : 'My Events'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'فعالياتي' : 'My Events'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Date and Occasion Filters */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={styles.dateFilterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateFilterText} numberOfLines={1}>
            {selectedDate 
              ? selectedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
              : 'mm/dd/yyyy'
            }
          </Text>
          {selectedDate && (
            <TouchableOpacity onPress={clearDateFilter} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.occasionFilterButton}
          onPress={() => setShowOccasionPicker(true)}
        >
          <Text style={styles.occasionFilterText} numberOfLines={1} ellipsizeMode="tail">
            {selectedOccasion || (isRTL ? 'اختر المناسبة' : 'Select Occasion')}
          </Text>
          {selectedOccasion && (
            <TouchableOpacity onPress={clearOccasionFilter} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
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
          keyExtractor={(item) => item._id}
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
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Occasion Picker Modal */}
      <Modal
        visible={showOccasionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOccasionPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOccasionPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isRTL ? 'اختر المناسبة' : 'Select Occasion'}
            </Text>
            <ScrollView style={styles.occasionList}>
              {occasions.map((occasion) => (
                <TouchableOpacity
                  key={occasion._id}
                  style={styles.occasionItem}
                  onPress={() => {
                    setSelectedOccasion(isRTL ? occasion.nameAr : occasion.name);
                    setShowOccasionPicker(false);
                  }}
                >
                  <Text style={styles.occasionItemText}>
                    {isRTL ? occasion.nameAr : occasion.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowOccasionPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>
                {isRTL ? 'إغلاق' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default MyEvents;
