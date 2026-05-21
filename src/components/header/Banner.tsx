import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../constants/colors';

const Banner: React.FC = () => {
  const { data: siteSettings } = useSiteSettings();
  const { isRTL } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!siteSettings?.bannerEnabled || isDismissed) {
    return null;
  }

  // Get banner text directly from site settings
  const bannerText = isRTL ? siteSettings.bannerTextAr : siteSettings.bannerText;
  
  if (!bannerText) {
    return null;
  }

  const closeButton = (
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => setIsDismissed(true)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.closeButtonText}>✕</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.bannerContainer}>
      {isRTL && closeButton}
      <View style={styles.contentArea}>
        <View style={styles.staticRow}>
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>
      </View>
      {!isRTL && closeButton}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: colors.primary,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 40,
  },
  staticRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  bannerText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Banner;
