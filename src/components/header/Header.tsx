import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { styles, imageStyles } from './Styles';
import Drawer from '../Drawer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { getImageUrl } from '../../services/api';

interface HeaderProps {
  onNavigate?: (route: string) => void;
  isBannerDismissed?: boolean;
  setIsBannerDismissed?: (val: boolean) => void;
  scrollY?: Animated.Value;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, scrollY }) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isFullTextModalVisible, setIsFullTextModalVisible] = useState(false);

  const { isRTL } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { data: siteSettings, isLoading, error } = useSiteSettings();

  // Scroll animations
  const logoSize = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [60, 42],
        extrapolate: 'clamp',
      })
    : 60;

  const paddingTop = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [6, 2],
        extrapolate: 'clamp',
      })
    : 6;

  const paddingBottom = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [10, 4],
        extrapolate: 'clamp',
      })
    : 10;

  const profileRingSize = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [44, 36],
        extrapolate: 'clamp',
      })
    : 44;

  const profileInnerSize = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [39, 31],
        extrapolate: 'clamp',
      })
    : 39;

  const menuScale = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
      })
    : 1;

  // Text below logo opacity and height fade-out on scroll
  const textOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 45],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : 1;

  const textMarginTop = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 45],
        outputRange: [3, -10],
        extrapolate: 'clamp',
      })
    : 3;

  const handleOpenDrawer = () => setIsDrawerVisible(true);
  const handleCloseDrawer = () => setIsDrawerVisible(false);

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route.toLowerCase());
    }
    handleCloseDrawer();
  };

  const handleUserIconPress = () => {
    if (isLoggedIn) {
      onNavigate?.('profile');
    } else {
      onNavigate?.('auth');
    }
  };

  // Menu hamburger icon
  const menuElement = (
    <TouchableOpacity
      onPress={handleOpenDrawer}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View
        style={[
          styles.actionIconButton,
          { transform: [{ scale: menuScale }] },
        ]}
      >
        <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 6H20M8 12H20M13 18H20"
            stroke="#FFFFFF"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );

  // Profile avatar ring element
  const profileElement = (
    <TouchableOpacity
      onPress={handleUserIconPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          styles.profileRing,
          {
            width: profileRingSize,
            height: profileRingSize,
            borderRadius: 22,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.profileInner,
            {
              width: profileInnerSize,
              height: profileInnerSize,
              borderRadius: 19.5,
            },
          ]}
        >
          {isLoggedIn && user?.profilePicture ? (
            <Image
              source={{ uri: getImageUrl(user.profilePicture) }}
              style={imageStyles.profilePhoto}
              resizeMode="cover"
            />
          ) : (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="12" cy="7" r="4" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );

  // Text sentence from database
  const bannerText = isRTL
    ? siteSettings?.bannerTextAr || siteSettings?.bannerText
    : siteSettings?.bannerText || siteSettings?.bannerTextAr;
  const activeText = bannerText || (isRTL ? 'مرحباً بكم في مسرة' : 'Welcome to Masarra');

  return (
    <>
      <View style={styles.headerWrapper}>
        {/* Wave background */}
        <View style={styles.headerBgLayer}>
          <Svg width="100%" height="100%" viewBox="0 0 400 90" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="hg" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00a19c" />
                <Stop offset="100%" stopColor="#009590" />
              </LinearGradient>
            </Defs>
            <Path d="M-20 20 C60 50 160 -5 280 30 T420 20" stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} fill="none" />
            <Path d="M-20 40 C70 70 170 5 290 50 T420 40" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} fill="none" />
            <Path d="M-20 60 C80 90 180 15 300 65 T420 60" stroke="rgba(255,255,255,0.1)" strokeWidth={2} fill="none" />
          </Svg>
        </View>

        <Animated.View style={[styles.headerContainer, { paddingTop, paddingBottom }]}>
          {/* LEFT SIDE (flex: 1) */}
          <View style={styles.leftSide}>
            {isRTL ? profileElement : menuElement}
          </View>

          {/* CENTER — Logo + DB Text below logo */}
          <View style={styles.logoContainer}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : error ? (
              <Animated.Image
                source={require('../../imgs/MasarraLogo.png')}
                style={[imageStyles.logoImage, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
              />
            ) : siteSettings?.headerLogo ? (
              <Animated.Image
                key={siteSettings.headerLogo}
                source={{ uri: getImageUrl(siteSettings.headerLogo) }}
                style={[imageStyles.logoImage, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
              />
            ) : (
              <Animated.Image
                source={require('../../imgs/MasarraLogo.png')}
                style={[imageStyles.logoImage, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
              />
            )}

            {/* DB Sentence text beneath logo: 1 line max with ... on overflow, opens full text modal on tap */}
            {siteSettings?.bannerEnabled !== false && activeText ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsFullTextModalVisible(true)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Animated.Text
                  style={[
                    styles.bannerText,
                    {
                      opacity: textOpacity,
                      marginTop: textMarginTop,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {activeText}
                </Animated.Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* RIGHT SIDE (flex: 1) */}
          <View style={styles.rightSide}>
            {isRTL ? menuElement : profileElement}
          </View>
        </Animated.View>
      </View>

      <Drawer isVisible={isDrawerVisible} onClose={handleCloseDrawer} onNavigate={handleNavigation} />

      {/* Full Sentence Modal Popup on Tap */}
      <Modal
        visible={isFullTextModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullTextModalVisible(false)}
      >
        <View style={styles.textModalOverlay}>
          <TouchableOpacity
            style={styles.textModalBackdrop}
            activeOpacity={1}
            onPress={() => setIsFullTextModalVisible(false)}
          />
          <View style={styles.textModalCard}>
            <TouchableOpacity
              style={styles.textModalCloseBtn}
              onPress={() => setIsFullTextModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#64748B"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.textModalTitle}>
              {isRTL ? 'إعلان مسرة' : 'Masarra Announcement'}
            </Text>

            <Text style={styles.textModalBody}>
              {activeText}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Header;
