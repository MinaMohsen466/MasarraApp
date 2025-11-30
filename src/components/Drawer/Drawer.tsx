import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/colors';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { getImageUrl } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Drawer Props Interface
interface DrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate?: (route: string, title: string) => void;
}

// Drawer Component
const Drawer: React.FC<DrawerProps> = ({ 
  isVisible, 
  onClose, 
  onNavigate 
}) => {
  const { language, isRTL, setLanguage, t } = useLanguage();
  const { isLoggedIn, logout } = useAuth();
  const { data: siteSettings, isLoading } = useSiteSettings();
  
  // Animation value for sliding drawer
  const slideAnim = useRef(new Animated.Value(isRTL ? SCREEN_WIDTH : -SCREEN_WIDTH)).current;

  // Animate drawer in/out based on visibility
  useEffect(() => {
    if (isVisible) {
      // Slide in from left (LTR) or right (RTL)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to left (LTR) or right (RTL)
      Animated.timing(slideAnim, {
        toValue: isRTL ? SCREEN_WIDTH : -SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, isRTL, slideAnim]);

  // Reset animation when RTL changes
  useEffect(() => {
    slideAnim.setValue(isRTL ? SCREEN_WIDTH : -SCREEN_WIDTH);
  }, [isRTL, slideAnim]);
  
  // Menu Items Configuration with translations
  const menuItems = [
    { id: 'home', titleKey: 'home', route: 'Home' },
    { id: 'occasions', titleKey: 'occasions', route: 'Occasions' },
    { id: 'about', titleKey: 'aboutUs', route: 'About' },
    { id: 'account', titleKey: 'myAccount', route: 'Account' },
    { id: 'terms', titleKey: 'termsConditions', route: 'Terms' },
    { id: 'privacy', titleKey: 'privacyPolicy', route: 'Privacy' },
    { id: 'contact', titleKey: 'contact', route: 'contact' },
    { id: 'settings', titleKey: 'settings', route: 'Settings' },
    { id: 'language', titleKey: language === 'en' ? 'switchToArabic' : 'switchToEnglish', route: 'Language' },
    { id: isLoggedIn ? 'logout' : 'login', titleKey: isLoggedIn ? 'logOut' : 'logIn', route: isLoggedIn ? 'Logout' : 'Login' },
  ];

  // Handle menu item press
  const handleMenuItemPress = (route: string, titleKey: string, id: string) => {
    console.log('🧭 Drawer item clicked:', t(titleKey), '→', route);
    
    // Handle language switching
    if (id === 'language') {
      const newLang = language === 'en' ? 'ar' : 'en';
      console.log('🌐 Switching language to:', newLang);
      setLanguage(newLang);
      
      // Close drawer after language change with a small delay for smooth transition
      setTimeout(() => {
        onClose();
      }, 300);
      return;
    }
    
    // Handle login navigation - navigate to auth page
    if (id === 'login') {
      console.log('🔐 Opening sign in page...');
      if (onNavigate) {
        onNavigate('auth', t(titleKey));
      }
      onClose();
      return;
    }
    
    // Handle logout
    if (id === 'logout') {
      console.log('🚪 Logging out...');
      logout();
      onClose();
      return;
    }
    
    // Handle My Account - navigate to Edit Profile
    if (id === 'account') {
      console.log('👤 Opening Profile page (request Edit)...');
      // Set a short-lived flag so the Profile screen opens EditProfile automatically
      try {
        AsyncStorage.setItem('openEditProfile', '1');
      } catch (e) {
        console.warn('Could not set openEditProfile flag', e);
      }
      if (onNavigate) {
        onNavigate('profile', t(titleKey));
      }
      onClose();
      return;
    }
    
    // Handle Settings - navigate to Profile
    if (id === 'settings') {
      console.log('⚙️ Opening Profile page...');
      if (onNavigate) {
        onNavigate('profile', t(titleKey));
      }
      onClose();
      return;
    }
    
    // Call navigation callback if provided
    if (onNavigate) {
      onNavigate(route, t(titleKey));
    }
    
    // Close drawer after selection
    onClose();
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      
      <View style={[styles.overlay, isRTL && styles.overlayRTL]}>
        
        {/* Animated Drawer Panel with SafeAreaView */}
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
          }}>
          <SafeAreaView 
            style={[styles.drawerPanel, isRTL && styles.drawerPanelRTL]}
            edges={['top', 'bottom', isRTL ? 'right' : 'left']}>
            
            <View style={styles.drawerContent}>
            
            {/* Close Button (X icon) */}
            <TouchableOpacity 
              style={[styles.closeButtonContainer, isRTL && styles.closeButtonContainerRTL]} 
              onPress={onClose}
              activeOpacity={0.7}>
              <Svg
                width={26}
                height={26}
                viewBox="0 0 24 24"
                fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke={colors.primary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Menu Items List */}
            <View style={[styles.menuItemsContainer, isRTL && styles.menuItemsContainerRTL]}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                  onPress={() => handleMenuItemPress(item.route, item.titleKey, item.id)}
                  activeOpacity={0.6}>
                  <Text 
                    style={[
                      styles.menuItemText,
                      isRTL && styles.menuItemTextRTL
                    ]}>
                    {t(item.titleKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Logo Section at Bottom */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : siteSettings?.footerLogo ? (
                  <Image 
                    key={siteSettings.headerLogo}
                    source={{ uri: getImageUrl(siteSettings.headerLogo) }} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={require('../../imgs/MasarraLogo.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
            
          </View>
        </SafeAreaView>
        </Animated.View>

        {/* Overlay Touchable - Close drawer when tapping outside */}
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          onPress={onClose}
          activeOpacity={1}
        />
        
      </View>
    </Modal>
  );
};

export default Drawer;