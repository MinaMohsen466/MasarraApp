/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
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
import {
  fetchServerNotifications,
  markServerNotificationRead,
  markAllServerNotificationsRead,
  deleteServerNotification,
} from '../services/api';

const NOTIFICATION_TRANSLATIONS: Record<string, any> = {
  en: {
    fallback: {
      title: 'Notification',
      message: 'You have a new notification',
    },
    types: {
      new_booking: {
        title: 'New booking',
        message: '{{customerName}} booked {{serviceName}}',
      },
      booking_confirmed: {
        title: 'Booking confirmed',
        message: 'Your booking for {{serviceName}} has been confirmed',
      },
      refund_requested: {
        title: 'Refund request',
        message: 'A refund was requested for a booking',
      },
      refund_approved: {
        title: 'Refund approved',
        message: 'A refund of {{refundAmount}} KWD has been approved',
      },
      refund_rejected: {
        title: 'Refund declined',
        message: 'Your refund request was declined',
      },
      event_reminder: {
        title: 'Upcoming event',
        message: 'Your event for {{serviceName}} is coming up soon',
      },
      vendor_application: {
        title: 'New vendor application',
        message: '{{applicantName}} applied to become a vendor',
      },
      backup_stale: {
        title: 'Backup overdue',
        message: 'The last database backup is over a month old',
      },
      new_chat: {
        title: 'New conversation',
        message: '{{senderName}} started a conversation',
      },
      new_message: {
        title: 'New message',
        message: '{{senderName}}: {{preview}}',
      },
    },
  },
  ar: {
    fallback: {
      title: 'إشعار',
      message: 'لديك إشعار جديد',
    },
    types: {
      new_booking: {
        title: 'حجز جديد',
        message: 'قام {{customerName}} بحجز {{serviceName}}',
      },
      booking_confirmed: {
        title: 'تم تأكيد الحجز',
        message: 'تم تأكيد حجزك لـ {{serviceName}}',
      },
      refund_requested: {
        title: 'طلب استرداد',
        message: 'تم طلب استرداد لأحد الحجوزات',
      },
      refund_approved: {
        title: 'تمت الموافقة على الاسترداد',
        message: 'تمت الموافقة على استرداد بقيمة {{refundAmount}} د.ك',
      },
      refund_rejected: {
        title: 'تم رفض الاسترداد',
        message: 'تم رفض طلب الاسترداد الخاص بك',
      },
      event_reminder: {
        title: 'مناسبة قادمة',
        message: 'تقترب مناسبتك لـ {{serviceName}} قريبًا',
      },
      vendor_application: {
        title: 'طلب تاجر جديد',
        message: 'تقدّم {{applicantName}} ليصبح تاجرًا',
      },
      backup_stale: {
        title: 'النسخ الاحتياطي متأخر',
        message: 'آخر نسخة احتياطية لقاعدة البيانات أقدم من شهر',
      },
      new_chat: {
        title: 'محادثة جديدة',
        message: 'بدأ {{senderName}} محادثة',
      },
      new_message: {
        title: 'رسالة جديدة',
        message: '{{senderName}}: {{preview}}',
      },
    },
  },
};

export function renderNotificationText(notification: any, isRTL: boolean) {
  const lang = isRTL ? 'ar' : 'en';
  const type = notification.type;
  const meta = notification.meta || {};

  const langTranslations = NOTIFICATION_TRANSLATIONS[lang];
  const typeTranslations = langTranslations?.types?.[type];

  let title = '';
  let message = '';

  if (typeTranslations) {
    title = typeTranslations.title;
    message = typeTranslations.message;
  } else {
    title = langTranslations?.fallback?.title || 'Notification';
    message =
      langTranslations?.fallback?.message || 'You have a new notification';
  }

  // Simple interpolation helper
  Object.keys(meta).forEach(key => {
    const value = meta[key];
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    message = message.replace(regex, String(value ?? ''));
  });

  return { title, message };
}

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
  link?: string;
  chat?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  notificationsEnabled: boolean;
  toggleNotificationsEnabled: () => Promise<void>;
  addNotification: (
    notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & {
      id?: string;
    },
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
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
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
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(true);
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(
    null,
  );
  const [navHandler, setNavHandler] = useState<
    ((route: string) => void) | null
  >(null);

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
      await AsyncStorage.setItem(
        '@notifications_enabled',
        JSON.stringify(newValue),
      );
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

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Only notify server if ID is a valid MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
      if (token && isMongoId) {
        await markServerNotificationRead(token, id);
      }
    } catch (err) {
      console.error(
        '[NotificationContext] Failed to mark read on server:',
        err,
      );
    }
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
        } else if (
          notification.type === 'new_message' ||
          notification.type === 'new_chat' ||
          notification.chat
        ) {
          await AsyncStorage.setItem('openChat', '1');
          if (navHandler) {
            navHandler('contact');
          }
        } else if (notification.type === 'event_reminder') {
          await AsyncStorage.setItem('openMyEvents', '1');
          if (navHandler) {
            navHandler('profile');
          }
        }
      } catch (err) {
        console.error('Error handling notification press:', err);
      }
    },
    [navHandler, markAsRead],
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
    [insets.top, slideAnim, opacityAnim, dismissBanner],
  );

  const addNotification = useCallback(
    async (
      newNotif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & {
        id?: string;
      },
    ) => {
      if (!notificationsEnabled) {
        console.log(
          '[NotificationService] Notifications are disabled, ignoring.',
        );
        return;
      }

      const item: NotificationItem = {
        ...newNotif,
        id:
          newNotif.id ||
          Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
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
        console.log(
          '[NotificationService] Ignored duplicate notification:',
          item.titleEn,
        );
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

  const fetchNotificationsFromServer = useCallback(async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) return;

      console.log(
        '[NotificationService] Fetching notifications from server...',
      );
      const response = await fetchServerNotifications(userToken, 1, 50);
      if (response && Array.isArray(response.notifications)) {
        const mapped = response.notifications.map((n: any) => {
          const { title, message } = renderNotificationText(n, true); // Arabic
          const { title: titleEn, message: messageEn } = renderNotificationText(
            n,
            false,
          ); // English
          return {
            id: n._id,
            title,
            titleEn,
            message,
            messageEn,
            type: n.type,
            bookingId: n.booking,
            createdAt: n.createdAt,
            read: n.isRead,
            link: n.link,
            chat: n.chat,
          };
        });

        setNotifications(prev => {
          const localOnly = prev.filter(n => n.type === 'booking_created');

          // Filter out server notifications that duplicate bookingId & type
          const filteredMapped = mapped.filter(
            serverNotif =>
              !localOnly.some(
                localNotif =>
                  localNotif.bookingId === serverNotif.bookingId &&
                  localNotif.type === serverNotif.type,
              ),
          );

          const combined = [...localOnly, ...filteredMapped];
          // Sort by date descending
          combined.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

          AsyncStorage.setItem(
            '@notifications_history',
            JSON.stringify(combined),
          ).catch(err =>
            console.error('Failed to save combined notifications:', err),
          );

          return combined;
        });
      }
    } catch (err) {
      console.error(
        '[NotificationService] Failed to fetch server notifications:',
        err,
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await markAllServerNotificationsRead(token);
      }
    } catch (err) {
      console.error(
        '[NotificationContext] Failed to mark all read on server:',
        err,
      );
    }
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
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && notifications.length > 0) {
        await Promise.all(
          notifications.map(n =>
            deleteServerNotification(token, n.id).catch(() => {}),
          ),
        );
      }
    } catch (err) {
      console.error(
        '[NotificationContext] Failed to delete notifications on server:',
        err,
      );
    }
    setNotifications([]);
    try {
      await AsyncStorage.removeItem('@notifications_history');
    } catch (err) {
      console.error('Failed to clear notifications in storage:', err);
    }
  }, [notifications]);

  const checkBookingsStatusChanges = useCallback(
    async (userToken: string) => {
      if (!userToken) return;
      try {
        console.log(
          '[NotificationService] Refreshing notifications from server...',
        );
        await fetchNotificationsFromServer();
      } catch (error) {
        console.error('Error checking booking status changes:', error);
      }
    },
    [fetchNotificationsFromServer],
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
                // eslint-disable-next-line react-native/no-inline-styles
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
                  // eslint-disable-next-line react-native/no-inline-styles
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
                  // eslint-disable-next-line react-native/no-inline-styles
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
