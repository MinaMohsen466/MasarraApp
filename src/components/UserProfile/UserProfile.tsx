import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import EditProfile from '../EditProfile';
import Wishlist from '../Wishlist/Wishlist';
import OrderHistory from '../../screens/OrderHistory';
import Chat from '../../screens/Chat';
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

const COUNTRY_CODES: { code: string; name: string; flag: string }[] = [
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+963', name: 'Syria', flag: '🇸🇾' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: '+970', name: 'Palestine', flag: '🇵🇸' }
];

const getCountryName = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  
  const country = COUNTRY_CODES.find(c => phoneNumber.startsWith(c.code));
  return country ? `${country.flag} ${country.code}` : '';
};

const getPhoneWithoutCode = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  
  const country = COUNTRY_CODES.find(c => phoneNumber.startsWith(c.code));
  if (country) {
    return phoneNumber.substring(country.code.length);
  }
  return phoneNumber;
};

const UserProfile: React.FC<UserProfileProps> = ({ 
  onBack, 
  onShowAuth,
  onNavigate,
  onSelectService,
  userName = 'User', 
  userPhone,
  userEmail: _userEmail,
  profilePicture 
}) => {
  const { isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewData, setReviewData] = useState<{bookingId: string; serviceId: string; serviceName: string} | null>(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(user?.profilePicture || null);

  // Fetch fresh user data from server on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();

          if (userData.profilePicture) {
            setCurrentProfilePicture(userData.profilePicture);
          }
        }
      } catch (error) {
        // Error fetching user data
      }
    };

    if (user) {
      fetchUserData();
    }
    
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

    checkOpenEdit();
  }, [user]);

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleAddress = () => {
    if (onNavigate) onNavigate('addresses');
  };

  const handleOrderHistory = () => {
    setShowOrderHistory(true);
  };

  const handleChat = () => {
    setShowChat(true);
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
    
    // If it's already a full URI, return as is
    if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://')) {
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
    return <Wishlist onBack={() => setShowWishlist(false)} onSelectService={(id) => { setShowWishlist(false); if (onSelectService) onSelectService(id); }} />;
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

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <View style={styles.fullPageContainer}>
        {/* Header background that extends into the notch/status bar */}
        <View style={[styles.headerBackground, { height: insets.top + 77 }]} />

        {/* Header with Back Button */}
        <View style={[styles.headerBar, { paddingTop: insets.top + 22, paddingBottom: 22 }]}>
          {onBack && (
            <TouchableOpacity 
              style={[styles.headerBackButton, styles.headerBackInline]}
              onPress={onBack}
              activeOpacity={0.8}>
              <Text style={[styles.headerBackIcon, isRTL && styles.headerBackTextRTL]}>
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
          
          <Text style={[styles.loginPromptTitle, isRTL && styles.loginPromptTitleRTL]}>
            {isRTL ? 'مرحباً بك!' : 'Welcome!'}
          </Text>
          
          <Text style={[styles.loginPromptText, isRTL && styles.loginPromptTextRTL]}>
            {isRTL ? 'الرجاء تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك' : 'Please log in to access your dashboard'}
          </Text>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}>
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
      <View style={[styles.headerBar, { paddingTop: insets.top + 22, paddingBottom: 22 }]}>
        {onBack && (
          <TouchableOpacity 
            style={[styles.headerBackButton, styles.headerBackInline]}
            onPress={onBack}
            activeOpacity={0.8}>
            <Text style={[styles.headerBackIcon, isRTL && styles.headerBackTextRTL]}>
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
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>

      {/* User Info Section (horizontal: icon + data) */}
      <View style={styles.userInfoSection}>
        <View style={styles.userInfoRow}>
          <View style={styles.profileImageContainer}>
            {currentProfilePicture || user.profilePicture || profilePicture ? (
              <Image 
                source={{ uri: getImageUri(currentProfilePicture || user.profilePicture || profilePicture) || undefined }} 
                style={styles.profileImage}
                onLoad={() => {}}
                onError={(e) => {
                  // Error loading image
                }}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Image 
                  source={require('../../imgs/user.png')} 
                  style={styles.profileIcon}
                />
              </View>
            )}
          </View>

          <View style={styles.userDataContainer}>
            <Text style={[styles.userName, isRTL && styles.userNameRTL]}>
              {user.name || userName}
            </Text>

            {user.phone || userPhone ? (
              <Text style={[styles.userPhone, isRTL && styles.userPhoneRTL]}>
                {getCountryName(user.phone || userPhone)} {getPhoneWithoutCode(user.phone || userPhone)}
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
          activeOpacity={0.7}>
          <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
            {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>

        {/* Address */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleAddress}
          activeOpacity={0.7}>
          <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
            {isRTL ? 'العنوان' : 'Address'}
          </Text>
        </TouchableOpacity>

        {/* Order History */}
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemPrimary]}
          onPress={handleOrderHistory}
          activeOpacity={0.7}>
          <Text style={[styles.menuTextWhite, isRTL && styles.menuTextWhiteRTL]}>
            {isRTL ? 'سجل الطلبات' : 'Order History'}
          </Text>
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleChat}
          activeOpacity={0.7}>
          <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
            {isRTL ? 'المحادثة' : 'Chat'}
          </Text>
        </TouchableOpacity>

        {/* Wishlist */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleWishlist}
          activeOpacity={0.7}>
          <Text style={[styles.menuText, isRTL && styles.menuTextRTL]}>
            {isRTL ? 'قائمة الأمنيات' : 'Wishlist'}
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={[styles.menuTextLogout, isRTL && styles.menuTextLogoutRTL]}>
            {isRTL ? 'تسجيل الخروج' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Chat Modal */}
    <Modal
      visible={showChat}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowChat(false)}>
      <Chat onBack={() => setShowChat(false)} />
    </Modal>

    </View>
  );
};

export default UserProfile;
