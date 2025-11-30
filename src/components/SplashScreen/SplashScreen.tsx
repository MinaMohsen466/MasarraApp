import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { getImageUrl } from '../../services/api';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { data: siteSettings, isLoading } = useSiteSettings();

  useEffect(() => {
    // Wait for settings to load, then show splash for 2 seconds
    if (!isLoading) {
      const timer = setTimeout(() => {
        onFinish();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Show logo from database if available */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.textWhite} />
        ) : siteSettings?.headerLogo ? (
          <Image
            source={{ uri: getImageUrl(siteSettings.headerLogo) }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.title, { fontSize: 48, marginBottom: 20 }]}>
            {siteSettings?.siteTitle || 'MASARRA'}
          </Text>
        )}
      </View>
    </View>
  );
};

export default SplashScreen;
