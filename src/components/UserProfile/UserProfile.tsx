import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, notifStyles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import EditProfile from '../EditProfile';
import Wishlist from '../Wishlist/Wishlist';
import OrderHistory from '../../screens/OrderHistory';
import MyEvents from '../../screens/MyEvents';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNotification } from '../../contexts/NotificationContext';

import { API_URL } from '../../config/api.config';
import { fetchAddresses } from '../../services/api';
import { getWishlist } from '../../services/wishlist';
import { getUserDashboardBookings } from '../../services/bookingApi';
import { isActiveEventService } from '../../utils/bookingPayment';

interface Address {
  _id: string;
  name: string;
  city: string;
  isDefault?: boolean;
}

interface UserProfileProps {
  onBack?: () => void;
  onShowAuth?: () => void;
  onNavigate?: (route: string) => void;
  onSelectService?: (serviceId: string) => void;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  profilePicture?: string;
  navigationKey?: number;
}

const UserProfile: React.FC<UserProfileProps> = ({
  onBack,
  onShowAuth,
  onNavigate,
  onSelectService,
  userName = 'User',
  userPhone: _userPhone,
  userEmail: _userEmail,
  profilePicture,
  navigationKey,
}) => {
  const { isRTL } = useLanguage();
  const { user, logout, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);

  const [wishlistCount, setWishlistCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  const [showNotifications, setShowNotifications] = useState(false);
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    handleNotificationPress,
  } = useNotification();

  const handleOpenNotifications = () => {
    setShowNotifications(true);
  };

  const handleCloseNotifications = async () => {
    setShowNotifications(false);
    await markAllAsRead();
  };

  // Check for edit profile flag when component mounts
  useEffect(() => {
    // Check if drawer requested opening edit profile
    const checkOpenEdit = async () => {
      try {
        const flag = await AsyncStorage.getItem('openEditProfile');
        if (flag === '1') {
          // remove flag and open edit
          await AsyncStorage.removeItem('openEditProfile');
          setShowEditProfile(true);
        }
      } catch {
        // Error checking flag
      }
    };

    // Check if cart requested opening order history
    const checkOpenOrderHistory = async () => {
      try {
        const flag = await AsyncStorage.getItem('openOrderHistory');
        if (flag === '1') {
          // remove flag and open order history
          await AsyncStorage.removeItem('openOrderHistory');
          setShowOrderHistory(true);
        }
      } catch {
        // Error checking flag
      }
    };

    // Check if notification requested opening my events
    const checkOpenMyEvents = async () => {
      try {
        const flag = await AsyncStorage.getItem('openMyEvents');
        if (flag === '1') {
          // remove flag and open my events
          await AsyncStorage.removeItem('openMyEvents');
          setShowMyEvents(true);
        }
      } catch {
        // Error checking flag
      }
    };

    checkOpenEdit();
    checkOpenOrderHistory();
    checkOpenMyEvents();
  }, [navigationKey]);

  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (!token) return;
      try {
        const data = await fetchAddresses(token);
        if (data && data.length > 0) {
          const def = data.find((a: Address) => a.isDefault) || data[0];
          if (def) {
            setDefaultAddress(def.city || null);
          }
        }
      } catch {
        // Silent catch
      }
    };

    loadDefaultAddress();
  }, [token]);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const wishlistItems = await getWishlist();
        setWishlistCount(wishlistItems ? wishlistItems.length : 0);
      } catch (error) {
        // Leaves the counter at 0, which reads as an empty wishlist rather than
        // a load failure.
        console.error('[Profile] Failed to load wishlist count:', error);
      }

      if (token) {
        try {
          // Same endpoint the Orders and Events screens read. `/bookings`
          // returns a different set — it skips the dashboard's pruning of
          // bookings whose slot was lost — so the two counters disagreed with
          // the lists they link to.
          const bookings = await getUserDashboardBookings(token);
          if (Array.isArray(bookings)) {
            setOrdersCount(bookings.length);

            // One per upcoming, non-cancelled, paid service — the exact row
            // MyEvents renders. Counting bookings instead made a two-service
            // booking read as "1 event" next to a list showing two, and the
            // rule has to stay shared with MyEvents (isActiveEventService) or
            // this number drifts from the list it links to.
            const now = new Date();

            const activeEvents = bookings.reduce((count, b) => {
              if (b.status === 'cancelled') return count;
              // No special case for an empty services array: MyEvents iterates
              // services, so such a booking renders no rows and counting it as
              // one event just put the counter one ahead of the list.
              return (
                count +
                (b.services || []).filter(s => isActiveEventService(s, b, now))
                  .length
              );
            }, 0);
            setEventsCount(activeEvents);
          }
        } catch (error) {
          // Same here: order and event counts stay at 0 and look genuine.
          console.error('[Profile] Failed to load booking stats:', error);
        }
      }
    };
    loadUserStats();
  }, [token, navigationKey, showWishlist, showOrderHistory, showMyEvents]);

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleAddress = () => {
    if (onNavigate) onNavigate('addresses');
  };

  const handleOrderHistory = () => {
    setShowOrderHistory(true);
  };

  const handleMyEvents = () => {
    setShowMyEvents(true);
  };

  const handleWishlist = () => {
    setShowWishlist(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onBack) {
        onBack();
      }
    } catch {
      // Error logging out
    }
  };

  const handleLogin = () => {
    if (onShowAuth) {
      onShowAuth();
    }
  };

  // Helper to convert /public/ paths to full URLs
  const getImageUri = (uri: string | null | undefined) => {
    if (!uri) return null;

    // If it's already a full URL (like S3), return as is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // If it's a local file URI, return as is
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      return uri;
    }

    // If it's a server path (starts with /public), prepend the base URL
    if (uri.startsWith('/public')) {
      return `${API_URL}${uri}`;
    }

    return uri;
  };

  // If showing edit profile, render EditProfile component
  if (showEditProfile && user) {
    return <EditProfile onBack={() => setShowEditProfile(false)} />;
  }

  if (showWishlist) {
    return (
      <Wishlist
        onBack={() => setShowWishlist(false)}
        onSelectService={id => {
          setShowWishlist(false);
          if (onSelectService) onSelectService(id);
        }}
      />
    );
  }

  if (showOrderHistory) {
    return <OrderHistory onBack={() => setShowOrderHistory(false)} />;
  }

  // Show My Events screen
  if (showMyEvents) {
    return <MyEvents onBack={() => setShowMyEvents(false)} />;
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <>
        <StatusBar
          backgroundColor={colors.backgroundCard}
          barStyle="dark-content"
          translucent={false}
        />
        <View style={styles.primaryFlexContainer}>
          <View
            style={{ height: insets.top, backgroundColor: colors.backgroundCard }}
          />
          <View style={styles.fullPageContainer}>
            {/* Clean Header Bar */}
            <View
              style={[
                styles.cleanHeaderBar,
                isRTL && styles.cleanHeaderBarRTL,
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
                    color="#0F172A"
                  />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
                  {isRTL ? 'الملف الشخصي' : 'Profile'}
                </Text>
              )}
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Login Prompt Card */}
              <View style={styles.userInfoSection}>
                <View style={styles.profileCardFloating}>
                  <View style={styles.avatarWrapperAbsolute}>
                    <View style={styles.avatarOuterRing}>
                      <View style={styles.profilePlaceholderLogin}>
                        <Image
                          source={require('../../imgs/user.png')}
                          style={styles.profileIcon}
                        />
                      </View>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.loginPromptTitleBold,
                      isRTL && styles.loginPromptTitleRTL,
                    ]}
                  >
                    {isRTL ? 'مرحباً بك في مسرة!' : 'Welcome to Masarra!'}
                  </Text>

                  <Text
                    style={[
                      styles.loginPromptText,
                      isRTL && styles.loginPromptTextRTL,
                    ]}
                  >
                    {isRTL
                      ? 'سجل الدخول لاستكشاف حجز الفعاليات وإدارة طلباتك بسهولة'
                      : 'Log in to book events and manage your orders seamlessly'}
                  </Text>

                  <TouchableOpacity
                    style={styles.loginButtonRounded}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.loginButtonText}>
                      {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor={colors.backgroundCard}
        barStyle="dark-content"
        translucent={false}
      />
      <View style={styles.primaryFlexContainer}>
        <View style={{ height: insets.top, backgroundColor: colors.backgroundCard }} />
        <View style={styles.fullPageContainer}>
          {/* Top Clean Navigation Header Bar */}
          <View
            style={[
              styles.cleanHeaderBar,
              isRTL && styles.cleanHeaderBarRTL,
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
                  color="#0F172A"
                />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
                {isRTL ? 'الملف الشخصي' : 'Profile'}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.headerBackButtonCircle,
                styles.positionRelative,
              ]}
              onPress={handleOpenNotifications}
              activeOpacity={0.8}
            >
              <Icon
                name="notifications-outline"
                size={20}
                color="#0F172A"
              />
              {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Modern Floating Profile Card */}
            <View style={styles.userInfoSection}>
              <View style={styles.profileCardFloating}>
                {/* Double Concentric Ring Avatar */}
                <View style={styles.avatarWrapperAbsolute}>
                  <View style={styles.avatarOuterRing}>
                    <View style={styles.avatarInnerRing}>
                      {user.profilePicture || profilePicture ? (
                        <Image
                          source={{
                            uri:
                              getImageUri(user.profilePicture || profilePicture) ||
                              undefined,
                          }}
                          style={styles.profileImage}
                          resizeMode="cover"
                          onError={e => {
                            // eslint-disable-next-line no-console
                            console.log('Image load error:', e.nativeEvent.error);
                          }}
                        />
                      ) : (
                        <View style={styles.profileImagePlaceholder}>
                          <Text style={styles.profileImagePlaceholderText}>
                            {(user.name || userName || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Name */}
                <Text
                  style={[
                    styles.userNameCentered,
                    isRTL && styles.userNameCenteredRTL,
                  ]}
                >
                  {user.name || userName}
                </Text>

                {/* Email / Handle */}
                <Text
                  style={[
                    styles.userEmailCentered,
                    isRTL && styles.userEmailCenteredRTL,
                  ]}
                >
                  {user.email ||
                    _userEmail ||
                    (isRTL ? 'عميل مسرة المميز' : 'Masarra Member')}
                </Text>

                {/* Location Badge */}
                <View
                  style={[
                    styles.userLocationBadge,
                    isRTL && styles.userLocationBadgeRTL,
                  ]}
                >
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx={12} cy={10} r={3} />
                  </Svg>
                  <Text
                    style={[
                      styles.userLocationText,
                      isRTL && styles.userLocationTextRTL,
                    ]}
                  >
                    {defaultAddress || (isRTL ? 'الكويت' : 'Kuwait')}
                  </Text>
                </View>

                {/* Interactive Stats Row */}
                <View
                  style={[
                    styles.statsContainer,
                    isRTL && styles.statsContainerRTL,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.statBox}
                    onPress={handleOrderHistory}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statNumber}>{ordersCount}</Text>
                    <Text
                      style={[
                        styles.statLabel,
                        isRTL && styles.statLabelRTL,
                      ]}
                    >
                      {isRTL ? 'الطلبات' : 'Orders'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statBox}
                    onPress={handleMyEvents}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statNumber}>{eventsCount}</Text>
                    <Text
                      style={[
                        styles.statLabel,
                        isRTL && styles.statLabelRTL,
                      ]}
                    >
                      {isRTL ? 'الفعاليات' : 'Events'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statBox}
                    onPress={handleWishlist}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statNumber}>{wishlistCount}</Text>
                    <Text
                      style={[
                        styles.statLabel,
                        isRTL && styles.statLabelRTL,
                      ]}
                    >
                      {isRTL ? 'المفضلة' : 'Wishlist'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Section Title */}
            <View
              style={[
                styles.sectionHeaderRow,
                isRTL && styles.sectionHeaderRowRTL,
              ]}
            >
              <Text
                style={[styles.pageBodyTitle, isRTL && styles.pageBodyTitleRTL]}
              >
                {isRTL ? 'الملف الشخصي' : 'Profile'}
              </Text>
            </View>

            {/* Floating Menu Card Container */}
            <View style={styles.menuSection}>
              <View style={styles.menuContainer}>
                {/* Edit Profile */}
                <TouchableOpacity
                  style={[styles.menuItemRow, isRTL && styles.menuItemRowRTL]}
                  onPress={handleEditProfile}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemLeft,
                      isRTL && styles.menuItemLeftRTL,
                    ]}
                  >
                    <View style={styles.menuIconWrapper}>
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Path d="M12 20h9" />
                        <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </Svg>
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isRTL && styles.menuItemTextRTL,
                      ]}
                    >
                      {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                    </Text>
                  </View>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {/* Address */}
                <TouchableOpacity
                  style={[styles.menuItemRow, isRTL && styles.menuItemRowRTL]}
                  onPress={handleAddress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemLeft,
                      isRTL && styles.menuItemLeftRTL,
                    ]}
                  >
                    <View style={styles.menuIconWrapper}>
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <Circle cx={12} cy={10} r={3} />
                      </Svg>
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isRTL && styles.menuItemTextRTL,
                      ]}
                    >
                      {isRTL ? 'العنوان' : 'Address'}
                    </Text>
                  </View>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {/* Order History */}
                <TouchableOpacity
                  style={[styles.menuItemRow, isRTL && styles.menuItemRowRTL]}
                  onPress={handleOrderHistory}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemLeft,
                      isRTL && styles.menuItemLeftRTL,
                    ]}
                  >
                    <View style={styles.menuIconWrapper}>
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Rect x={4} y={4} width={16} height={16} rx={2} />
                        <Path d="M9 9h6M9 13h6M9 17h4" />
                      </Svg>
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isRTL && styles.menuItemTextRTL,
                      ]}
                    >
                      {isRTL ? 'سجل الطلبات' : 'Order History'}
                    </Text>
                  </View>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {/* My Events */}
                <TouchableOpacity
                  style={[styles.menuItemRow, isRTL && styles.menuItemRowRTL]}
                  onPress={handleMyEvents}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemLeft,
                      isRTL && styles.menuItemLeftRTL,
                    ]}
                  >
                    <View style={styles.menuIconWrapper}>
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                        <Line x1={16} y1={2} x2={16} y2={6} />
                        <Line x1={8} y1={2} x2={8} y2={6} />
                        <Line x1={3} y1={10} x2={21} y2={10} />
                      </Svg>
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isRTL && styles.menuItemTextRTL,
                      ]}
                    >
                      {isRTL ? 'فعالياتي' : 'My Events'}
                    </Text>
                  </View>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {/* Wishlist */}
                <TouchableOpacity
                  style={[styles.menuItemRow, isRTL && styles.menuItemRowRTL]}
                  onPress={handleWishlist}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemLeft,
                      isRTL && styles.menuItemLeftRTL,
                    ]}
                  >
                    <View style={styles.menuIconWrapper}>
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </Svg>
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isRTL && styles.menuItemTextRTL,
                      ]}
                    >
                      {isRTL ? 'قائمة الأمنيات' : 'Wishlist'}
                    </Text>
                  </View>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Separate Logout Card Container */}
              <View style={styles.logoutCardContainer}>
                <TouchableOpacity
                  style={[styles.menuItemRow, isRTL && styles.menuItemRowRTL]}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuItemLeft,
                      isRTL && styles.menuItemLeftRTL,
                    ]}
                  >
                    <View style={styles.logoutIconWrapper}>
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <Polyline points="16 17 21 12 16 7" />
                        <Line x1={21} y1={12} x2={9} y2={12} />
                      </Svg>
                    </View>
                    <Text
                      style={[
                        styles.menuItemTextLogout,
                        isRTL && styles.menuItemTextLogoutRTL,
                      ]}
                    >
                      {isRTL ? 'تسجيل الخروج' : 'Logout'}
                    </Text>
                  </View>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Notifications List Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNotifications}
        statusBarTranslucent={true}
      >
        <View style={notifStyles.overlay}>
          <View style={notifStyles.container}>
            {/* Header */}
            <View style={[notifStyles.header, isRTL && notifStyles.headerRTL]}>
              <Text style={notifStyles.headerTitle}>
                {isRTL ? 'الإشعارات' : 'Notifications'}
              </Text>

              <View
                style={[
                  notifStyles.headerActions,
                  isRTL && notifStyles.headerActionsRTL,
                ]}
              >
                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={notifStyles.clearButton}
                    onPress={clearNotifications}
                  >
                    <Text style={notifStyles.clearButtonText}>
                      {isRTL ? 'مسح الكل' : 'Clear All'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={notifStyles.closeButton}
                  onPress={handleCloseNotifications}
                >
                  <Icon name="close" size={24} color="#334155" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Enable/Disable Notifications Switch Removed */}

            {/* Content */}
            <ScrollView
              contentContainerStyle={notifStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length === 0 ? (
                <View style={notifStyles.emptyState}>
                  <Icon
                    name="notifications-off-outline"
                    size={64}
                    color="#cbd5e1"
                  />
                  <Text style={notifStyles.emptyText}>
                    {isRTL ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                  </Text>
                </View>
              ) : (
                notifications.map(notif => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      notifStyles.card,
                      !notif.read && notifStyles.unreadCard,
                      isRTL && notifStyles.cardRTL,
                    ]}
                    activeOpacity={0.8}
                    onPress={async () => {
                      setShowNotifications(false);
                      await handleNotificationPress(notif);
                    }}
                  >
                    {/* Status Icon */}
                    <View
                      style={[
                        notifStyles.cardIconContainer,
                        isRTL
                          ? notifStyles.iconMarginRTL
                          : notifStyles.iconMarginLTR,
                      ]}
                    >
                      <Icon
                        name={
                          notif.type === 'booking_confirmed_by_vendor' ||
                          notif.type === 'booking_confirmed'
                            ? 'checkmark-circle'
                            : notif.type === 'booking_payment_confirmed'
                            ? 'ribbon'
                            : notif.type === 'booking_rejected_by_vendor'
                            ? 'close-circle'
                            : notif.type === 'vendor_uploaded'
                            ? 'cloud-done'
                            : 'notifications'
                        }
                        size={24}
                        color={
                          notif.type === 'booking_confirmed_by_vendor' ||
                          notif.type === 'booking_confirmed'
                            ? '#0284C7'
                            : notif.type === 'booking_payment_confirmed'
                            ? '#16A34A'
                            : notif.type === 'booking_rejected_by_vendor'
                            ? '#DC2626'
                            : notif.type === 'vendor_uploaded'
                            ? '#CA8A04'
                            : colors.primary
                        }
                      />
                    </View>

                    {/* Title & Message */}
                    <View style={notifStyles.cardTextContainer}>
                      <View
                        style={[
                          notifStyles.cardHeaderRow,
                          isRTL && notifStyles.cardHeaderRowRTL,
                        ]}
                      >
                        <Text
                          style={[
                            notifStyles.cardTitle,
                            !notif.read && notifStyles.unreadText,
                            isRTL && notifStyles.textRight,
                          ]}
                        >
                          {isRTL ? notif.title : notif.titleEn}
                        </Text>
                        {!notif.read && <View style={notifStyles.unreadDot} />}
                      </View>
                      <Text
                        style={[
                          notifStyles.cardMessage,
                          isRTL && notifStyles.textRight,
                        ]}
                      >
                        {isRTL ? notif.message : notif.messageEn}
                      </Text>
                      <Text
                        style={[
                          notifStyles.cardTime,
                          isRTL && notifStyles.textRight,
                        ]}
                      >
                        {new Date(notif.createdAt).toLocaleDateString(
                          isRTL ? 'ar-KW' : 'en-KW',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserProfile;
