import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLanguage } from './LanguageContext';
import { colors } from '../constants/colors';
import { getUserDashboardBookings } from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  type:
    | 'booking_created'
    | 'booking_confirmed'
    | 'booking_payment_confirmed'
    | 'booking_confirmed_by_vendor'
    | 'booking_rejected_by_vendor'
    | 'vendor_uploaded'
    | string;
  bookingId?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  notificationsEnabled: boolean;
  toggleNotificationsEnabled: () => Promise<void>;
  addNotification: (
    notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>,
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  checkBookingsStatusChanges: (token: string) => Promise<void>;
  registerNavigationHandler: (handler: (route: string) => void) => void;
  handleNotificationPress: (notification: NotificationItem) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);
  const [navHandler, setNavHandler] = useState<((route: string) => void) | null>(
    null,
  );

  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from AsyncStorage on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem('@notifications_history');
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
        const enabled = await AsyncStorage.getItem('@notifications_enabled');
        if (enabled !== null) {
          setNotificationsEnabled(JSON.parse(enabled));
        }
      } catch (err) {
        console.error('Failed to load notifications from AsyncStorage:', err);
      }
    };
    loadNotifications();
  }, []);

  const toggleNotificationsEnabled = useCallback(async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('@notifications_enabled', JSON.stringify(newValue));
    } catch (err) {
      console.error('Failed to toggle notificationsEnabled:', err);
    }
  }, [notificationsEnabled]);

  const registerNavigationHandler = useCallback(
    (handler: (route: string) => void) => {
      setNavHandler(() => handler);
    },
    [],
  );

  const handleNotificationPress = useCallback(
    async (notification: NotificationItem) => {
      try {
        // Mark as read
        await markAsRead(notification.id);

        if (notification.bookingId) {
          await AsyncStorage.setItem('openOrderHistory', '1');
          if (navHandler) {
            navHandler('profile');
          }
        }
      } catch (err) {
        console.error('Error handling notification press:', err);
      }
    },
    [navHandler],
  );

  const showTopBanner = useCallback(
    (notification: NotificationItem) => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }

      setActiveBanner(notification);

      // Slide down and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: insets.top + 10,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Dismiss banner after 4 seconds
      bannerTimeoutRef.current = setTimeout(() => {
        dismissBanner();
      }, 4500);
    },
    [insets.top, slideAnim, opacityAnim],
  );

  const dismissBanner = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveBanner(null);
    });
  }, [slideAnim, opacityAnim]);

  const addNotification = useCallback(
    async (
      newNotif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>,
    ) => {
      if (!notificationsEnabled) {
        console.log('[NotificationService] Notifications are disabled, ignoring.');
        return;
      }

      const item: NotificationItem = {
        ...newNotif,
        id:
          Math.random().toString(36).substring(2, 9) +
          Date.now().toString(36),
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Check duplicate on current state array
      const isDuplicate = notifications.some(n => {
        const timeDiff = Date.now() - new Date(n.createdAt).getTime();
        if (timeDiff >= 10000) return false;

        if (item.bookingId && n.bookingId === item.bookingId) {
          return n.type === item.type;
        }
        return n.type === item.type && n.message === item.message;
      });

      if (isDuplicate) {
        console.log('[NotificationService] Ignored duplicate notification:', item.titleEn);
        return;
      }

      setNotifications(prev => {
        // Double check duplicate in functional state to prevent quick click duplicates
        const duplicate = prev.some(n => {
          const timeDiff = Date.now() - new Date(n.createdAt).getTime();
          if (timeDiff >= 10000) return false;

          if (item.bookingId && n.bookingId === item.bookingId) {
            return n.type === item.type;
          }
          return n.type === item.type && n.message === item.message;
        });

        if (duplicate) {
          return prev;
        }

        const updated = [item, ...prev];
        AsyncStorage.setItem(
          '@notifications_history',
          JSON.stringify(updated),
        ).catch(err =>
          console.error('Failed to save notifications to AsyncStorage:', err),
        );
        return updated;
      });

      // Trigger top banner
      showTopBanner(item);
    },
    [showTopBanner, notificationsEnabled, notifications],
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      AsyncStorage.setItem(
        '@notifications_history',
        JSON.stringify(updated),
      ).catch(err =>
        console.error('Failed to save updated notifications:', err),
      );
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      AsyncStorage.setItem(
        '@notifications_history',
        JSON.stringify(updated),
      ).catch(err =>
        console.error('Failed to save all read notifications:', err),
      );
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await AsyncStorage.removeItem('@notifications_history');
    } catch (err) {
      console.error('Failed to clear notifications in storage:', err);
    }
  }, []);

  const checkBookingsStatusChanges = useCallback(
    async (userToken: string) => {
      if (!userToken) return;
      try {
        console.log('[NotificationService] Checking booking changes...');
        // 1. Fetch latest bookings
        const latestBookings = await getUserDashboardBookings(userToken);
        if (!latestBookings || !Array.isArray(latestBookings)) return;

        // 2. Load cached bookings from AsyncStorage
        const cachedBookingsStr = await AsyncStorage.getItem(
          '@cached_bookings_status',
        );
        const cachedBookings: {
          [key: string]: {
            status: string;
            services: {
              [key: string]: { status: string; paymentStatus: string };
            };
          };
        } = cachedBookingsStr ? JSON.parse(cachedBookingsStr) : {};

        // Prepare updated cache object
        const newCache: typeof cachedBookings = {};
        const newNotifications: Omit<
          NotificationItem,
          'id' | 'createdAt' | 'read'
        >[] = [];

        latestBookings.forEach(booking => {
          const bId = booking._id;
          const currentServices: {
            [key: string]: { status: string; paymentStatus: string };
          } = {};

          booking.services?.forEach((s: any) => {
            const sId = s._id || s.service?._id || s.service;
            currentServices[sId] = {
              status: s.status || 'pending',
              paymentStatus: s.paymentStatus || 'pending',
            };
          });

          newCache[bId] = {
            status: booking.status || 'pending',
            services: currentServices,
          };

          // If we had this booking cached before, compare services
          const cachedB = cachedBookings[bId];
          if (cachedB) {
            booking.services?.forEach((s: any) => {
              const sId = s._id || s.service?._id || s.service;
              const cachedS = cachedB.services[sId];
              const serviceName =
                s.service?.name || s.service?.nameAr || 'Service';
              const serviceNameAr =
                s.service?.nameAr || s.service?.name || 'خدمة';

              if (cachedS) {
                // Check status change
                if (s.status !== cachedS.status) {
                  if (s.status === 'confirmed') {
                    newNotifications.push({
                      title: 'موافقة مقدم الخدمة',
                      titleEn: 'Vendor Approved',
                      message: `تمت موافقة مقدم الخدمة على خدمة "${serviceNameAr}". يرجى إتمام الدفع.`,
                      messageEn: `Vendor approved the service "${serviceName}". Please complete the payment.`,
                      type: 'booking_confirmed_by_vendor',
                      bookingId: bId,
                    });
                  } else if (s.status === 'cancelled') {
                    newNotifications.push({
                      title: 'إلغاء الخدمة',
                      titleEn: 'Service Cancelled',
                      message: `تم إلغاء خدمة "${serviceNameAr}" من قبل مقدم الخدمة.`,
                      messageEn: `Service "${serviceName}" has been cancelled by the vendor.`,
                      type: 'booking_rejected_by_vendor',
                      bookingId: bId,
                    });
                  } else if (s.status === 'completed') {
                    newNotifications.push({
                      title: 'اكتملت الخدمة',
                      titleEn: 'Service Completed',
                      message: `تم إكمال خدمة "${serviceNameAr}" بنجاح!`,
                      messageEn: `Service "${serviceName}" has been completed successfully!`,
                      type: 'vendor_uploaded',
                      bookingId: bId,
                    });
                  }
                }

                // Check payment status change
                if (
                  s.paymentStatus !== cachedS.paymentStatus &&
                  s.paymentStatus === 'paid'
                ) {
                  newNotifications.push({
                    title: 'تم تأكيد الدفع',
                    titleEn: 'Payment Confirmed',
                    message: `تم تأكيد دفع خدمة "${serviceNameAr}" بنجاح!`,
                    messageEn: `Payment confirmed for service "${serviceName}"!`,
                    type: 'booking_payment_confirmed',
                    bookingId: bId,
                  });
                }
              }
            });
          }
        });

        // Save updated bookings statuses to cache
        await AsyncStorage.setItem(
          '@cached_bookings_status',
          JSON.stringify(newCache),
        );

        // If there are new notifications, add them to history
        if (newNotifications.length > 0) {
          for (const n of newNotifications) {
            await addNotification(n);
          }
        }
      } catch (error) {
        console.error('Error checking booking status changes:', error);
      }
    },
    [addNotification],
  );

  // Helper for notification colors and icons in the top banner
  const getBannerConfig = (type: string) => {
    switch (type) {
      case 'booking_confirmed_by_vendor':
      case 'booking_confirmed':
        return {
          bg: '#E0F2FE', // Light blue
          border: '#38BDF8',
          iconColor: '#0284C7',
          iconName: 'checkmark-circle',
        };
      case 'booking_payment_confirmed':
        return {
          bg: '#DCFCE7', // Light green
          border: '#4ADE80',
          iconColor: '#16A34A',
          iconName: 'ribbon',
        };
      case 'booking_rejected_by_vendor':
        return {
          bg: '#FEE2E2', // Light red
          border: '#FCA5A5',
          iconColor: '#DC2626',
          iconName: 'close-circle',
        };
      case 'vendor_uploaded':
        return {
          bg: '#FEF9C3', // Light yellow
          border: '#FDE047',
          iconColor: '#CA8A04',
          iconName: 'cloud-done',
        };
      case 'booking_created':
      default:
        return {
          bg: '#ECEFEE', // Teal light or grey
          border: colors.primary,
          iconColor: colors.primary,
          iconName: 'notifications',
        };
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    notificationsEnabled,
    toggleNotificationsEnabled,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    checkBookingsStatusChanges,
    registerNavigationHandler,
    handleNotificationPress,
  };

  const bannerConfig = activeBanner ? getBannerConfig(activeBanner.type) : null;

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Slide-down Banner View */}
      {activeBanner && bannerConfig && (
        <Animated.View
          style={[
            styles.bannerContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
              backgroundColor: bannerConfig.bg,
              borderColor: bannerConfig.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.bannerContent}
            activeOpacity={0.9}
            onPress={() => {
              handleNotificationPress(activeBanner);
              dismissBanner();
            }}
          >
            <View
              style={[
                styles.iconContainer,
                isRTL ? { marginLeft: 12 } : { marginRight: 12 },
              ]}
            >
              <Icon
                name={bannerConfig.iconName}
                size={28}
                color={bannerConfig.iconColor}
              />
            </View>

            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.bannerTitle,
                  isRTL && styles.textRTL,
                  { color: '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {isRTL ? activeBanner.title : activeBanner.titleEn}
              </Text>
              <Text
                style={[
                  styles.bannerMessage,
                  isRTL && styles.textRTL,
                  { color: '#475569' },
                ]}
                numberOfLines={2}
              >
                {isRTL ? activeBanner.message : activeBanner.messageEn}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismissBanner}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'left',
  },
  bannerMessage: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  textRTL: {
    textAlign: 'right',
  },
  closeButton: {
    paddingLeft: 8,
  },
});
