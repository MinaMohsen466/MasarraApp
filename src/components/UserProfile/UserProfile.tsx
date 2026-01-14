import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import EditProfile from '../EditProfile';
import Wishlist from '../Wishlist/Wishlist';
import OrderHistory from '../../screens/OrderHistory';
import MyEvents from '../../screens/MyEvents';
import WriteReview from '../../screens/WriteReview';
import { API_URL } from '../../config/api.config';

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
  userPhone,
  userEmail: _userEmail,
  profilePicture,
}) => {
  const { isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewData, setReviewData] = useState<{
    bookingId: string;
    serviceId: string;
    serviceName: string;
  } | null>(null);

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
      return `${API_URL.replace('/api', '')}${uri}`;
    }

    return uri;
  };

  // If showing edit profile, render EditProfile component
  if (showEditProfile) {
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
    return (
      <OrderHistory
        onBack={() => setShowOrderHistory(false)}
        onWriteReview={(bookingId, serviceId, serviceName) => {
          setReviewData({ bookingId, serviceId, serviceName });
          setShowOrderHistory(false);
          setShowWriteReview(true);
        }}
      />
    );
  }

  if (showWriteReview && reviewData) {
    return (
      <WriteReview
        bookingId={reviewData.bookingId}
        serviceId={reviewData.serviceId}
        serviceName={reviewData.serviceName}
        onBack={() => {
          setShowWriteReview(false);
          setReviewData(null);
          setShowOrderHistory(true);
        }}
        onSuccess={() => {
          setShowWriteReview(false);
          setReviewData(null);
          setShowOrderHistory(true);
        }}
      />
    );
  }

  // Show My Events screen
  if (showMyEvents) {
    return <MyEvents onBack={() => setShowMyEvents(false)} />;
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <View style={styles.fullPageContainer}>
        {/* Header background that extends into the notch/status bar */}
        <View style={[styles.headerBackground, { height: insets.top + 77 }]} />

        {/* Header with Back Button */}
        <View
          style={[
            styles.headerBar,
            { paddingTop: insets.top + 22, paddingBottom: 22 },
          ]}
        >
          {onBack && (
            <TouchableOpacity
              style={[styles.headerBackButton, styles.headerBackInline]}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.headerBackIcon,
                  isRTL && styles.headerBackTextRTL,
                ]}
              >
                {'‹'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
            {isRTL ? 'الملف الشخصي' : 'Profile'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Login Prompt */}
        <View style={styles.loginPromptContainer}>
          <View style={styles.profilePlaceholder}>
            <Image
              source={require('../../imgs/user.png')}
              style={styles.profileIcon}
            />
          </View>

          <Text
            style={[
              styles.loginPromptTitle,
              isRTL && styles.loginPromptTitleRTL,
            ]}
          >
            {isRTL ? 'مرحباً بك!' : 'Welcome!'}
          </Text>

          <Text
            style={[styles.loginPromptText, isRTL && styles.loginPromptTextRTL]}
          >
            {isRTL
              ? 'الرجاء تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك'
              : 'Please log in to access your dashboard'}
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullPageContainer}>
      {/* Header background that extends into the notch/status bar */}
      <View style={[styles.headerBackground, { height: insets.top + 78 }]} />

      {/* Header with Back Button */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: insets.top + 22, paddingBottom: 22 },
        ]}
      >
        {onBack && (
          <TouchableOpacity
            style={[styles.headerBackButton, styles.headerBackInline]}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.headerBackIcon, isRTL && styles.headerBackTextRTL]}
            >
              {'‹'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Info Section (horizontal: icon + data) */}
        <View style={styles.userInfoSection}>
          <View style={styles.userInfoRow}>
            <View style={styles.profileImageContainer}>
              {user.profilePicture || profilePicture ? (
                <Image
                  source={{
                    uri:
                      getImageUri(
                        user.profilePicture || profilePicture,
                      ) || undefined,
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

            <View style={styles.userDataContainer}>
              <Text style={[styles.userName, isRTL && styles.userNameRTL]}>
                {user.name || userName}
              </Text>

              {user.phone || userPhone ? (
                <Text style={[styles.userPhone, isRTL && styles.userPhoneRTL]}>
                  {user.phone || userPhone}
                </Text>
              ) : (
                <Text style={[styles.noPhone, isRTL && styles.noPhoneRTL]}>
                  {isRTL ? 'لا يوجد رقم هاتف' : 'No phone number'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          {/* Edit Profile */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
              {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>

          {/* Address */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAddress}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
              {isRTL ? 'العنوان' : 'Address'}
            </Text>
          </TouchableOpacity>

          {/* Order History */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOrderHistory}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
              {isRTL ? 'سجل الطلبات' : 'Order History'}
            </Text>
          </TouchableOpacity>

          {/* My Events */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleMyEvents}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
              {isRTL ? 'فعالياتي' : 'My Events'}
            </Text>
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleWishlist}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
              {isRTL ? 'قائمة الأمنيات' : 'Wishlist'}
            </Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.menuTextLogout, isRTL && styles.menuTextLogoutRTL]}
            >
              {isRTL ? 'تسجيل الخروج' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserProfile;
