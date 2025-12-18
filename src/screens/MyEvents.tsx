import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import { API_URL } from '../config/api.config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundHome,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.backgroundHome,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  backIcon: {
    fontSize: 24,
    color: colors.primaryDark,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateFilterText: {
    fontSize: 14,
    color: colors.primary,
  },
  occasionFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  occasionFilterText: {
    fontSize: 14,
    color: colors.primary,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  dateColumn: {
    flex: 0.3,
  },
  occasionColumn: {
    flex: 0.5,
  },
  actionColumn: {
    flex: 0.2,
    textAlign: 'right' as const,
  },
  listContent: {
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    minWidth: 80,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  eventVendor: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  menuButton: {
    padding: 4,
    width: 30,
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: colors.textDark,
    fontWeight: '700',
  },
  menuDropdown: {
    position: 'absolute',
    right: 16,
    top: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: colors.textDark,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  guestInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  guestName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  guestContact: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  guestDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

interface MyEventsProps {
  onBack?: () => void;
}

interface EventGuest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
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
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedFilter]);

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

      // Fetch events where user is a guest
      const response = await fetch(`${API_URL}/bookings/my-events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data || []);
      } else {
        showAlert(
          isRTL ? 'خطأ' : 'Error',
          data.message || (isRTL ? 'فشل تحميل الفعاليات' : 'Failed to load events')
        );
      }
    } catch (error) {
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
    if (selectedFilter === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.status === selectedFilter));
    }
  };

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleCopyQR = (eventId: string) => {
    // TODO: Implement QR copy functionality
    showAlert(
      isRTL ? 'نجح' : 'Success',
      isRTL ? 'تم نسخ رمز QR' : 'QR code copied'
    );
    setExpandedEventId(null);
  };

  const handleViewQR = (eventId: string) => {
    // TODO: Navigate to QR view
    setExpandedEventId(null);
  };

  const handleGuestList = (eventId: string) => {
    // TODO: Navigate to guest list
    setExpandedEventId(null);
  };

  const handleOpenGuestPage = (eventId: string) => {
    // TODO: Open guest page
    setExpandedEventId(null);
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
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleOpenGuestPage(item._id)}
            >
              <Text style={styles.menuItemText}>
                {isRTL ? 'فتح صفحة الضيوف' : 'Open guest page'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guest info */}
        {item.guests && item.guests.length > 0 && (
          <View style={styles.guestInfo}>
            <Text style={styles.guestName}>{item.guests[0].name}</Text>
            <Text style={styles.guestContact}>
              {item.guests[0].email} • {item.guests[0].phone}
            </Text>
            <Text style={styles.guestDate}>
              {new Date(item.guests[0].joinedAt).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
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
            <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
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
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'فعالياتي' : 'My Events'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Date and Occasion Filters */}
      <View style={styles.filterSection}>
        <TouchableOpacity style={styles.dateFilterButton}>
          <Text style={styles.dateFilterText}>mm/dd/yyyy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.occasionFilterButton}>
          <Text style={styles.occasionFilterText}>
            {isRTL ? 'اختر المناسبة' : 'Select Occasion'}
          </Text>
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
    </View>
  );
};

export default MyEvents;
