import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { createStyles } from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/colors';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { getImageUrl } from '../../services/api';

// Helper function to return outline SVG icons for menu items
const getMenuItemIcon = (id: string, color: string, size: number) => {
  switch (id) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'occasions':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="9"
            width="18"
            height="12"
            rx="2"
            stroke={color}
            strokeWidth={2}
          />
          <Path
            d="M2 9h20M12 9v12M12 9c0-2.5 1-4.5 3.5-4.5s2.5 2 0 4.5M12 9c0-2.5-1-4.5-3.5-4.5S6 6.5 8.5 9"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'packages':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L2 7l10 5 10-5-10-5z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2 17l10 5 10-5M2 12l10 5 10-5"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'about':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
          <Path
            d="M12 16v-4M12 8h.01"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'account':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="12"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'policies':
    case 'refund':
    case 'terms':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'privacy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'contact':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            stroke={color}
            strokeWidth={2}
          />
          <Path
            d="M22 6l-10 7L2 6"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
          <Path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'language':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
          <Path
            d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'login':
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 3H7a2 2 0 00-2 2v14a2 2 0 002 2h8M19 12H9M16 15l3-3-3-3"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
};

// Drawer Props Interface
interface DrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate?: (route: string, title: string) => void;
}

// Drawer Component
const Drawer: React.FC<DrawerProps> = ({ isVisible, onClose, onNavigate }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const styles = createStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const { language, isRTL, setLanguage, t } = useLanguage();
  const { isLoggedIn, logout } = useAuth();
  const { data: siteSettings, isLoading } = useSiteSettings();

  const isSmallScreen = SCREEN_HEIGHT < 700;
  const isMediumScreen = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT <= 800;

  // Calculate drawer width using the exact same formula to keep animations in sync
  const drawerWidth = Math.min(Math.max(SCREEN_WIDTH * 0.75, 270), 320);
  const iconSize = isSmallScreen ? 18 : isMediumScreen ? 20 : 22;
  const closeButtonSize = isSmallScreen ? 22 : isMediumScreen ? 24 : 26;

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showPoliciesDropdown, setShowPoliciesDropdown] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to the end of the menu when dropdown is opened to prevent vertical clipping
  useEffect(() => {
    if (showLanguageDropdown || showPoliciesDropdown) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [showLanguageDropdown, showPoliciesDropdown]);

  // Animation value for sliding drawer using actual drawerWidth
  const slideAnim = useRef(
    new Animated.Value(isRTL ? drawerWidth : -drawerWidth),
  ).current;

  // Reset dropdown when drawer closes
  useEffect(() => {
    if (!isVisible) {
      setShowLanguageDropdown(false);
      setShowPoliciesDropdown(false);
    }
  }, [isVisible]);

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
        toValue: isRTL ? drawerWidth : -drawerWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, isRTL, slideAnim, drawerWidth]);

  // Reset animation when RTL or drawerWidth changes
  useEffect(() => {
    slideAnim.setValue(isRTL ? drawerWidth : -drawerWidth);
  }, [isRTL, slideAnim, drawerWidth]);

  // Menu Items Configuration with translations
  const menuItems = [
    { id: 'home', titleKey: 'home', route: 'Home' },
    { id: 'occasions', titleKey: 'occasions', route: 'Occasions' },
    { id: 'packages', titleKey: 'packages', route: 'Packages' },
    { id: 'account', titleKey: 'myAccount', route: 'Account' },
    { id: 'settings', titleKey: 'settings', route: 'Settings' },
    { id: 'contact', titleKey: 'contact', route: 'contact' },
    { id: 'about', titleKey: 'aboutUs', route: 'About' },
    { id: 'policies', titleKey: 'policiesTerms', route: 'Policies' },
    {
      id: 'language',
      titleKey: language === 'en' ? 'switchToArabic' : 'switchToEnglish',
      route: 'Language',
    },
    ...(!isLoggedIn
      ? [{ id: 'login', titleKey: 'logIn', route: 'Login' }]
      : []),
  ];

  // Handle menu item press
  const handleMenuItemPress = (route: string, titleKey: string, id: string) => {
    // Handle language switching
    if (id === 'language') {
      const newLang = language === 'en' ? 'ar' : 'en';
      setLanguage(newLang);

      // Close drawer after language change with a small delay for smooth transition
      setTimeout(() => {
        onClose();
      }, 300);
      return;
    }

    // Handle login navigation - navigate to auth page
    if (id === 'login') {
      if (onNavigate) {
        onNavigate('auth', t(titleKey));
      }
      onClose();
      return;
    }

    // Handle logout
    if (id === 'logout') {
      logout();
      onClose();
      return;
    }

    // Handle My Account - navigate to Edit Profile
    if (id === 'account') {
      if (isLoggedIn) {
        // Set a short-lived flag so the Profile screen opens EditProfile automatically
        try {
          AsyncStorage.setItem('openEditProfile', '1');
        } catch {
          // Error handling
        }
      }
      if (onNavigate) {
        onNavigate('profile', t(titleKey));
      }
      onClose();
      return;
    }

    // Handle Settings - navigate to Profile
    if (id === 'settings') {
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
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, isRTL && styles.overlayRTL]}>
        {/* Animated Drawer Panel with SafeAreaView */}
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
          }}
        >
          <SafeAreaView
            style={[styles.drawerPanel, isRTL && styles.drawerPanelRTL]}
            edges={['top', 'bottom', isRTL ? 'right' : 'left']}
          >
            <View style={styles.drawerContent}>
              {/* Close Button (X icon) */}
              <TouchableOpacity
                style={[
                  styles.closeButtonContainer,
                  isRTL && styles.closeButtonContainerRTL,
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Svg width={closeButtonSize} height={closeButtonSize} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6L18 18"
                    stroke={colors.primary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Scrollable Menu Items */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.flexContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Menu Items List */}
                <View
                  style={[
                    styles.menuItemsContainer,
                    isRTL && styles.menuItemsContainerRTL,
                  ]}
                >
                  {menuItems.map(item => {
                    if (item.id === 'policies') {
                      return (
                        <View key="policies-group" style={styles.languageGroupContainer}>
                          {/* Main Policies Toggle Item */}
                          <TouchableOpacity
                            style={[
                              styles.menuItem,
                              isRTL && styles.menuItemRTL,
                            ]}
                            onPress={() => {
                              const nextState = !showPoliciesDropdown;
                              setShowPoliciesDropdown(nextState);
                              if (nextState) {
                                setShowLanguageDropdown(false);
                              }
                            }}
                            activeOpacity={0.6}
                          >
                            <View
                              style={[
                                styles.menuIconContainer,
                                isRTL && styles.menuIconContainerRTL,
                              ]}
                            >
                              {getMenuItemIcon('policies', colors.primary, iconSize)}
                            </View>

                            <Text
                              style={[
                                styles.menuItemText,
                                isRTL && styles.menuItemTextRTL,
                              ]}
                            >
                              {t('policiesTerms')}
                            </Text>

                            <View style={styles.menuChevronContainer}>
                              <Svg
                                width={14}
                                height={14}
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{
                                  transform: [
                                    {
                                      rotate: showPoliciesDropdown
                                        ? '180deg'
                                        : '0deg',
                                    },
                                  ],
                                }}
                              >
                                <Path
                                  d="M6 9l6 6 6-6"
                                  stroke={colors.textLight}
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            </View>
                          </TouchableOpacity>

                          {/* Policies Options Dropdown */}
                          {showPoliciesDropdown && (
                            <View style={styles.dropdownContainer}>
                              {/* Terms & Conditions */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuItem,
                                  isRTL && styles.subMenuItemRTL,
                                ]}
                                onPress={() =>
                                  handleMenuItemPress('Terms', 'termsConditions', 'terms')
                                }
                                activeOpacity={0.6}
                              >
                                <Text
                                  style={[
                                    styles.subMenuItemText,
                                    isRTL && styles.subMenuItemTextRTL,
                                  ]}
                                >
                                  {t('termsConditions')}
                                </Text>
                              </TouchableOpacity>

                              {/* Privacy Policy */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuItem,
                                  isRTL && styles.subMenuItemRTL,
                                ]}
                                onPress={() =>
                                  handleMenuItemPress('Privacy', 'privacyPolicy', 'privacy')
                                }
                                activeOpacity={0.6}
                              >
                                <Text
                                  style={[
                                    styles.subMenuItemText,
                                    isRTL && styles.subMenuItemTextRTL,
                                  ]}
                                >
                                  {t('privacyPolicy')}
                                </Text>
                              </TouchableOpacity>

                              {/* Refund Policy */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuItem,
                                  isRTL && styles.subMenuItemRTL,
                                ]}
                                onPress={() =>
                                  handleMenuItemPress('Refund', 'refundPolicy', 'refund')
                                }
                                activeOpacity={0.6}
                              >
                                <Text
                                  style={[
                                    styles.subMenuItemText,
                                    isRTL && styles.subMenuItemTextRTL,
                                  ]}
                                >
                                  {t('refundPolicy')}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    }

                    if (item.id === 'language') {
                      const languageLabel = isRTL ? 'اللغة' : 'Language';
                      const activeLanguageName =
                        language === 'en'
                          ? 'English'
                          : isRTL
                          ? 'العربية'
                          : 'Arabic';
                      const languageItemText = `${languageLabel} (${activeLanguageName})`;

                      return (
                        <View key="language-group" style={styles.languageGroupContainer}>
                          {/* Main Language Toggle Item */}
                          <TouchableOpacity
                            style={[
                              styles.menuItem,
                              isRTL && styles.menuItemRTL,
                            ]}
                            onPress={() => {
                              const nextState = !showLanguageDropdown;
                              setShowLanguageDropdown(nextState);
                              if (nextState) {
                                setShowPoliciesDropdown(false);
                              }
                            }}
                            activeOpacity={0.6}
                          >
                            <View
                              style={[
                                styles.menuIconContainer,
                                isRTL && styles.menuIconContainerRTL,
                              ]}
                            >
                              {getMenuItemIcon('language', colors.primary, iconSize)}
                            </View>

                            <Text
                              style={[
                                styles.menuItemText,
                                isRTL && styles.menuItemTextRTL,
                              ]}
                            >
                              {languageItemText}
                            </Text>

                            <View style={styles.menuChevronContainer}>
                              <Svg
                                width={14}
                                height={14}
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{
                                  transform: [
                                    {
                                      rotate: showLanguageDropdown
                                        ? '180deg'
                                        : '0deg',
                                    },
                                  ],
                                }}
                              >
                                <Path
                                  d="M6 9l6 6 6-6"
                                  stroke={colors.textLight}
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            </View>
                          </TouchableOpacity>

                          {/* Language Options Dropdown */}
                          {showLanguageDropdown && (
                            <View style={styles.dropdownContainer}>
                              {/* English Option */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuItem,
                                  isRTL && styles.subMenuItemRTL,
                                  language === 'en' && styles.subMenuItemActive,
                                ]}
                                onPress={() => {
                                  if (language !== 'en') {
                                    setLanguage('en');
                                  }
                                  setTimeout(() => onClose(), 300);
                                }}
                                activeOpacity={0.6}
                              >
                                <Text
                                  style={[
                                    styles.subMenuItemText,
                                    isRTL && styles.subMenuItemTextRTL,
                                    language === 'en' &&
                                      styles.subMenuItemTextActive,
                                  ]}
                                >
                                  English
                                </Text>
                                {language === 'en' && (
                                  <Svg
                                    width={16}
                                    height={16}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <Path
                                      d="M20 6L9 17L4 12"
                                      stroke={colors.primary}
                                      strokeWidth={2.5}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </Svg>
                                )}
                              </TouchableOpacity>

                              {/* Arabic Option */}
                              <TouchableOpacity
                                style={[
                                  styles.subMenuItem,
                                  isRTL && styles.subMenuItemRTL,
                                  language === 'ar' && styles.subMenuItemActive,
                                ]}
                                onPress={() => {
                                  if (language !== 'ar') {
                                    setLanguage('ar');
                                  }
                                  setTimeout(() => onClose(), 300);
                                }}
                                activeOpacity={0.6}
                              >
                                <Text
                                  style={[
                                    styles.subMenuItemText,
                                    isRTL && styles.subMenuItemTextRTL,
                                    language === 'ar' &&
                                      styles.subMenuItemTextActive,
                                  ]}
                                >
                                  العربية
                                </Text>
                                {language === 'ar' && (
                                  <Svg
                                    width={16}
                                    height={16}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <Path
                                      d="M20 6L9 17L4 12"
                                      stroke={colors.primary}
                                      strokeWidth={2.5}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </Svg>
                                )}
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    }

                    const isLogout = item.id === 'logout';
                    const iconColor = isLogout ? colors.error : colors.primary;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                        onPress={() =>
                          handleMenuItemPress(
                            item.route,
                            item.titleKey,
                            item.id,
                          )
                        }
                        activeOpacity={0.6}
                      >
                        {/* Menu Item Icon */}
                        <View
                          style={[
                            styles.menuIconContainer,
                            isRTL && styles.menuIconContainerRTL,
                          ]}
                        >
                          {getMenuItemIcon(item.id, iconColor, iconSize)}
                        </View>

                        {/* Menu Item Text */}
                        <Text
                          style={[
                            styles.menuItemText,
                            isRTL && styles.menuItemTextRTL,
                            isLogout && styles.logoutText,
                          ]}
                        >
                          {t(item.titleKey)}
                        </Text>

                        {/* Dropdown/Navigation Chevron Arrow */}
                        <View style={styles.menuChevronContainer}>
                          <Svg
                            width={14}
                            height={14}
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <Path
                              d={isRTL ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
                              stroke={colors.textLight}
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Logo Section at Bottom - Fixed at bottom */}
              <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : siteSettings?.footerLogo ? (
                    <Image
                      key={siteSettings.footerLogo}
                      source={{ uri: getImageUrl(siteSettings.footerLogo) }}
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
