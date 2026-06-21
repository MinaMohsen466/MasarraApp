import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';

interface BannerProps {
  isDismissed?: boolean;
  setIsDismissed?: (val: boolean) => void;
}

const Banner: React.FC<BannerProps> = ({
  isDismissed = false,
  setIsDismissed,
}) => {
  const { data: siteSettings } = useSiteSettings();
  const { isRTL } = useLanguage();

  if (!siteSettings?.bannerEnabled || isDismissed) {
    return null;
  }

  // Get banner text directly from site settings
  const bannerText = isRTL
    ? siteSettings.bannerTextAr
    : siteSettings.bannerText;

  if (!bannerText) {
    return null;
  }

  const closeButton = (
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => setIsDismissed?.(true)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 6L6 18M6 6l12 12"
          stroke={colors.textWhite}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );

  const couponIcon = (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      style={isRTL ? styles.iconRTL : styles.iconLTR}
    >
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={colors.textWhite}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={colors.textWhite} />
    </Svg>
  );

  return (
    <View style={styles.bannerWrap}>
      {/* Premium Background with Gradient and Topographic Wave Lines */}
      <View style={styles.backgroundContainer}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 375 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="bannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#00a19c" />
              <Stop offset="100%" stopColor="#00807b" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="375" height="100" fill="url(#bannerGrad)" />
          {/* Topographic Lines */}
          <Path
            d="M-20 30 C80 70 180 -10 300 40 T400 30"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 45 C80 85 180 5 300 55 T400 45"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M-20 60 C80 100 180 20 300 70 T400 60"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth={2}
            fill="none"
          />
        </Svg>
      </View>

      <View style={styles.bannerContainer}>
        {isRTL && closeButton}
        <View style={styles.contentArea}>
          <View style={[styles.staticRow, isRTL && styles.staticRowRTL]}>
            {couponIcon}
            <Text style={styles.bannerText} numberOfLines={2}>
              {bannerText}
            </Text>
          </View>
        </View>
        {!isRTL && closeButton}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerWrap: {
    position: 'relative',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },
  bannerContainer: {
    backgroundColor: 'transparent',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 44,
  },
  staticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  staticRowRTL: {
    flexDirection: 'row-reverse',
  },
  iconLTR: {
    marginRight: 8,
    flexShrink: 0,
  },
  iconRTL: {
    marginLeft: 8,
    flexShrink: 0,
  },
  bannerText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
});

export default Banner;
