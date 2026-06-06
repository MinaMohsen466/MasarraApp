import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAboutSettings } from '../../hooks/useSiteSettings';

interface AboutProps {
  onBack?: () => void;
}



const About: React.FC<AboutProps> = ({ onBack }) => {
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { data: aboutData, isLoading, error } = useAboutSettings();

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar backgroundColor="#00a19c" barStyle="light-content" translucent={false} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar backgroundColor="#00a19c" barStyle="light-content" translucent={false} />
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>
          {isRTL ? 'فشل في تحميل البيانات' : 'Failed to load data'}
        </Text>
        <Text style={[styles.errorSubtext, isRTL && styles.textRTL]}>
          {error.message}
        </Text>
      </View>
    );
  }

  // Get content based on language
  const content =
    language === 'ar' ? aboutData?.contentAr : aboutData?.contentEn;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundLight }}>
      <StatusBar backgroundColor="#00a19c" barStyle="light-content" translucent={false} />
      <View style={{ height: insets.top, backgroundColor: colors.primary }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section with Title */}
          <View style={styles.heroSection}>
            {/* Back Button Container */}
            <View
              style={[
                styles.backButtonContainer,
                isRTL && styles.backButtonContainerRTL,
              ]}
            >
              <TouchableOpacity
                style={[styles.backButton, isRTL && styles.backButtonRTL]}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 18L9 12L15 6"
                    stroke={colors.textWhite}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.heroTitle, isRTL && styles.heroTitleRTL]}>
              {isRTL ? 'عن التطبيق' : 'ABOUT'}
            </Text>

            {/* Subtitle */}
            <Text style={styles.heroSubtitle}>
              {isRTL ? 'تعرف على المزيد عنا' : 'LEARN MORE ABOUT US'}
            </Text>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={[styles.contentText, isRTL && styles.contentTextRTL]}>
              {content}
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default About;
