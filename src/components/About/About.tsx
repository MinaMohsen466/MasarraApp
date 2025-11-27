import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_URL } from '../../config/api.config';

interface AboutProps {
  onBack?: () => void;
}

interface AboutData {
  _id: string;
  contentEn: string;
  contentAr: string;
  lastUpdated: string;
}

const BASE_URL = API_URL;

const About: React.FC<AboutProps> = ({ onBack }) => {
  const { isRTL, language } = useLanguage();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/settings/about`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      setAboutData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching about data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
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
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>
          {isRTL ? 'فشل في تحميل البيانات' : 'Failed to load data'}
        </Text>
        <Text style={[styles.errorSubtext, isRTL && styles.textRTL]}>
          {error}
        </Text>
      </View>
    );
  }

  // Get content based on language
  const content = language === 'ar' ? aboutData?.contentAr : aboutData?.contentEn;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          
          {/* Hero Section with Title */}
          <View style={styles.heroSection}>
            {/* Back Button Container */}
            <View style={[styles.backButtonContainer, isRTL && styles.backButtonContainerRTL]}>
              <TouchableOpacity 
                style={[styles.backButton, isRTL && styles.backButtonRTL]}
                onPress={onBack}
                activeOpacity={0.7}>
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none">
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
    </SafeAreaView>
  );
};

export default About;
