import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal,
  Switch,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
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

interface UserProfileProps {
  onBack?: () => void;
  onShowAuth?: () => void;
  onNavigate?: (route: string) => void;
  onSelectService?: (serviceId: string) => void;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  profilePicture?: string;
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
}) => {
  const { isRTL } = useLanguage();
  const { user, logout, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const {
    notifications,
    unreadCount,
    notificationsEnabled,
    toggleNotificationsEnabled,
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
      } catch (e) {
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
      } catch (e) {
        // Error checking flag
      }
    };

    checkOpenEdit();
    checkOpenOrderHistory();
  }, []);

  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (!token) return;
      try {
        const data = await fetchAddresses(token);
        if (data && data.length > 0) {
          const def = data.find((a: any) => a.isDefault) || data[0];
          if (def) {
            setDefaultAddress(def.city || null);
          }
        }
      } catch (e) {
        // Silent catch
      }
    };

    loadDefaultAddress();
  }, [token]);

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
    } catch (error) {
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
          backgroundColor="#00a19c"
          barStyle="light-content"
          translucent={false}
        />
        <View style={{ flex: 1, backgroundColor: colors.primary }}>
          <View
            style={{ height: insets.top, backgroundColor: colors.primary }}
          />
          <View style={styles.fullPageContainer}>
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Curved Header Background Block with topographic waves & integrated navigation */}
              <View style={styles.profileHeaderBlock}>
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 375 130"
                  preserveAspectRatio="none"
                  style={styles.topographicSvg}
                >
                  <Path
                    d="M-20 25 C80 70 180 15 300 60 T400 40"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1.5}
                    fill="none"
                  />
                  <Path
                    d="M-20 45 C80 90 180 25 300 80 T400 60"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={1.5}
                    fill="none"
                  />
                  <Path
                    d="M-20 65 C80 110 180 35 300 100 T400 80"
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
                  height="40"
                  width="100%"
                  viewBox="0 0 375 40"
                  preserveAspectRatio="none"
                >
                  <Path
                    d="M0,25 C100,55 250,0 375,25 L375,40 L0,40 Z"
                    fill={colors.backgroundCard}
                  />
                </Svg>
              </View>

              {/* Login Prompt Section */}
              <View style={[styles.loginPromptContainer, { paddingTop: 0 }]}>
                <View
                  style={[
                    styles.profilePlaceholder,
                    {
                      marginTop: -50,
                      borderWidth: 3,
                      borderColor: '#FFFFFF',
                      backgroundColor: '#E2E8F0',
                    },
                  ]}
                >
                  <Image
                    source={require('../../imgs/user.png')}
                    style={styles.profileIcon}
                  />
                </View>

                <Text
                  style={[
                    styles.loginPromptTitle,
                    isRTL && styles.loginPromptTitleRTL,
                    { color: colors.primaryDark, fontWeight: '700' },
                  ]}
                >
                  {isRTL ? 'مرحباً بك!' : 'Welcome!'}
                </Text>

                <Text
                  style={[
                    styles.loginPromptText,
                    isRTL && styles.loginPromptTextRTL,
                  ]}
                >
                  {isRTL
                    ? 'الرجاء تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك'
                    : 'Please log in to access your dashboard'}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      borderRadius: 24,
                      height: 46,
                      justifyContent: 'center',
                      paddingVertical: 0,
                    },
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
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
        backgroundColor="#00a19c"
        barStyle="light-content"
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <View style={{ height: insets.top, backgroundColor: colors.primary }} />
        <View style={styles.fullPageContainer}>
          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Curved Header Background Block with topographic waves & integrated navigation */}
            <View style={styles.profileHeaderBlock}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 375 130"
                preserveAspectRatio="none"
                style={styles.topographicSvg}
              >
                <Path
                  d="M-20 25 C80 70 180 15 300 60 T400 40"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M-20 45 C80 90 180 25 300 80 T400 60"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M-20 65 C80 110 180 35 300 100 T400 80"
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
                {onBack ? (
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
                ) : (
                  <View style={styles.headerSpacer} />
                )}

                <TouchableOpacity
                  style={[
                    styles.headerBackButtonCircle,
                    { position: 'relative' },
                  ]}
                  onPress={handleOpenNotifications}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="notifications-outline"
                    size={20}
                    color={colors.textWhite}
                  />
                  {unreadCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 9,
                        height: 9,
                        borderRadius: 4.5,
                        backgroundColor: '#EF4444',
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      }}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Curved Wave Divider (Transitions header to card background) */}
            <View style={styles.profileCurveDivider}>
              <Svg
                height="40"
                width="100%"
                viewBox="0 0 375 40"
                preserveAspectRatio="none"
              >
                <Path
                  d="M0,25 C100,55 250,0 375,25 L375,40 L0,40 Z"
                  fill={colors.backgroundCard}
                />
              </Svg>
            </View>

            {/* User Info Section (centered: avatar, name, email, address) */}
            <View style={styles.userInfoSection}>
              <View style={styles.profileImageContainer}>
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
                      console.log('Image load error:', e.nativeEvent.error);
                    }}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImagePlaceholderText}>
                      {(user.name || userName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.userNameCentered,
                  isRTL && styles.userNameCenteredRTL,
                ]}
              >
                {user.name || userName}
              </Text>

              <Text
                style={[
                  styles.userEmailCentered,
                  isRTL && styles.userEmailCenteredRTL,
                ]}
              >
                {user.email ||
                  _userEmail ||
                  (isRTL ? 'لا يوجد بريد إلكتروني' : 'No email address')}
              </Text>

              {/* Location row */}
              <View
                style={[
                  styles.userLocationRow,
                  isRTL && styles.userLocationRowRTL,
                ]}
              >
                <Svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666666"
                  strokeWidth={2}
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
            </View>

            <Text
              style={[styles.pageBodyTitle, isRTL && styles.pageBodyTitleRTL]}
            >
              {isRTL ? 'الملف الشخصي' : 'Profile'}
            </Text>

            {/* Menu Options */}
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
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M12 20h9" />
                      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </Svg>
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
                    stroke="#A0AEC0"
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
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <Circle cx={12} cy={10} r={3} />
                    </Svg>
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
                    stroke="#A0AEC0"
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
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Rect x={4} y={4} width={16} height={16} rx={2} />
                      <Path d="M9 9h6M9 13h6M9 17h4" />
                    </Svg>
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
                    stroke="#A0AEC0"
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
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                      <Line x1={16} y1={2} x2={16} y2={6} />
                      <Line x1={8} y1={2} x2={8} y2={6} />
                      <Line x1={3} y1={10} x2={21} y2={10} />
                    </Svg>
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
                    stroke="#A0AEC0"
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
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </Svg>
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
                    stroke="#A0AEC0"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Logout Separate Card Container */}
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
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#E53935"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <Polyline points="16 17 21 12 16 7" />
                      <Line x1={21} y1={12} x2={9} y2={12} />
                    </Svg>
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
                    stroke="#E53935"
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
                        isRTL ? { marginLeft: 12 } : { marginRight: 12 },
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

const notifStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionsRTL: {
    flexDirection: 'row-reverse',
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toggleRowRTL: {
    flexDirection: 'row-reverse',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabelContainerRTL: {
    flexDirection: 'row-reverse',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardRTL: {
    flexDirection: 'row-reverse',
  },
  unreadCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  cardIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeaderRowRTL: {
    flexDirection: 'row-reverse',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  unreadText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  cardMessage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  textRight: {
    textAlign: 'right',
  },
});

export default UserProfile;
