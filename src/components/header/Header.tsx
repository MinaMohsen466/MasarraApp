import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { styles, imageStyles } from './Styles';
import Drawer from '../Drawer';
import Banner from './Banner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/colors';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { getImageUrl } from '../../services/api';

interface HeaderProps {
  onNavigate?: (route: string) => void;
  isBannerDismissed?: boolean;
  setIsBannerDismissed?: (val: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  onNavigate,
  isBannerDismissed,
  setIsBannerDismissed,
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const { isRTL } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { data: siteSettings, isLoading, error } = useSiteSettings();

  const handleOpenDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route.toLowerCase());
    }
    handleCloseDrawer();
  };

  const handleUserIconPress = () => {
    if (isLoggedIn) {
      if (onNavigate) {
        onNavigate('profile');
      }
    } else {
      if (onNavigate) {
        onNavigate('auth');
      }
    }
  };

  return (
    <>
      <Banner
        isDismissed={isBannerDismissed}
        setIsDismissed={setIsBannerDismissed}
      />
      <View
        style={[styles.headerContainer, isRTL && styles.headerContainerRTL]}
      >
        {/* Menu Button - Left in LTR, Right in RTL */}
        <TouchableOpacity
          style={[styles.menuButton, isRTL && styles.menuButtonRTL]}
          onPress={handleOpenDrawer}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 6H20M4 12H14M4 18H9"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Center - Masarra Logo */}
        <View style={styles.logoContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : error ? (
            <Image
              source={require('../../imgs/MasarraLogo.png')}
              style={imageStyles.logoImage}
              resizeMode="contain"
            />
          ) : siteSettings?.headerLogo ? (
            <Image
              key={siteSettings.headerLogo}
              source={{ uri: getImageUrl(siteSettings.headerLogo) }}
              style={imageStyles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../../imgs/MasarraLogo.png')}
              style={imageStyles.logoImage}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Right - User Profile Icon */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleUserIconPress}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          {isLoggedIn && user?.profilePicture ? (
            <Image
              source={{
                uri: getImageUrl(user.profilePicture),
              }}
              style={imageStyles.profileIcon}
              resizeMode="cover"
              onError={() => {}}
            />
          ) : (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx="12"
                cy="7"
                r="4"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </TouchableOpacity>
      </View>

      {/* Drawer Component */}
      <Drawer
        isVisible={isDrawerVisible}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigation}
      />
    </>
  );
};

export default Header;
