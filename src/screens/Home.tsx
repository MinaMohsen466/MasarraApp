import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  RefreshControl,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { useOccasions } from '../hooks/useOccasions';
import { useServices } from '../hooks/useServices';
import { Occasion, getImageUrl } from '../services/api';
import MasarraWelcome from '../components/MasarraWelcome';
import FeaturedServicesCarousel from '../components/FeaturedServicesCarousel';
import SearchSection from '../components/SearchSection';
import Services from '../components/Services';
import Auth from '../components/Auth';
import UserProfile from '../components/UserProfile';
import { useAuth } from '../contexts/AuthContext';
import { styles } from './styles';
import { colors } from '../constants/colors';
import Header from '../components/header/Header';

interface HomeProps {
  onNavigate?: (route: string) => void;
  currentRoute?: string;
  onSelectService?: (serviceId: string) => void;
  onSelectOccasion?: (occasion: any, selectedDate?: Date) => void;
  isBannerDismissed?: boolean;
  setIsBannerDismissed?: (val: boolean) => void;
  initialShowSignup?: boolean;
  navigationKey?: number;
}

const Home: React.FC<HomeProps> = ({
  onNavigate,
  currentRoute,
  onSelectService,
  onSelectOccasion,
  isBannerDismissed,
  setIsBannerDismissed,
  initialShowSignup,
  navigationKey,
}) => {
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const {
    data: occasions,
    isLoading: occasionsLoading,
    error,
    refetch: refetchOccasions,
  } = useOccasions();
  const {
    data: services,
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useServices();

  const showAuth = currentRoute === 'auth';
  const showUserProfile = currentRoute === 'profile';

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated value for the initial loading logo pulse
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  const hasFeaturedServices =
    services?.some(service => service.isFeatured) || false;
  const isLoading = occasionsLoading || servicesLoading;

  // Pulsing animation for logo during initial loading
  useEffect(() => {
    if (initialLoading && isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    return undefined;
  }, [initialLoading, isLoading, fadeAnim]);

  // Hide initial loading screen once data is ready
  useEffect(() => {
    if (!isLoading && initialLoading) {
      const timer = setTimeout(() => setInitialLoading(false), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, initialLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOccasions(), refetchServices()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchOccasions, refetchServices]);

  const renderOccasionCard = useCallback(
    ({ item }: { item: Occasion }) => {
      const displayName = isRTL ? item.nameAr : item.name;
      const truncatedName =
        displayName && displayName.length > 13
          ? `${displayName.substring(0, 13)}...`
          : displayName;
      return (
        <TouchableOpacity
          style={styles.occasionCard}
          activeOpacity={0.8}
          onPress={() => onSelectOccasion && onSelectOccasion(item)}
        >
          <View style={styles.iconContainer}>
            {item.image ? (
              item.image.toLowerCase().endsWith('.svg') ? (
                <SvgUri
                  uri={getImageUrl(item.image)}
                  width="80%"
                  height="80%"
                  fill="#d2ded6"
                />
              ) : (
                <Image
                  source={{ uri: getImageUrl(item.image) }}
                  style={styles.occasionImage}
                />
              )
            ) : (
              <View style={styles.placeholderIcon} />
            )}
          </View>
          <Text
            style={[styles.occasionText, isRTL && styles.occasionTextRTL]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {truncatedName}
          </Text>
        </TouchableOpacity>
      );
    },
    [isRTL, onSelectOccasion],
  );

  // ── Early returns ────────────────────────────────────────────────

  if (initialLoading && isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Animated.Image
          source={require('../imgs/logo.png')}
          style={[styles.loadingLogo, { opacity: fadeAnim }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (showUserProfile) {
    return (
      <UserProfile
        userName={user?.name}
        userEmail={user?.email}
        userPhone={user?.phone}
        profilePicture={user?.profilePicture}
        onBack={() => onNavigate && onNavigate('home')}
        onShowAuth={() => onNavigate && onNavigate('auth')}
        onNavigate={route => onNavigate && onNavigate(route)}
        onSelectService={(serviceId: string) =>
          onSelectService && onSelectService(serviceId)
        }
        navigationKey={navigationKey}
      />
    );
  }

  if (showAuth) {
    return (
      <Auth
        onBack={() => onNavigate && onNavigate('home')}
        onNavigate={onNavigate}
        initialShowSignup={initialShowSignup}
      />
    );
  }

  // ── Main render ──────────────────────────────────────────────────

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor="#ffffff"
        />
      }
      scrollEventThrottle={16}
    >
      <Header
        onNavigate={onNavigate}
        isBannerDismissed={isBannerDismissed}
        setIsBannerDismissed={setIsBannerDismissed}
      />

      {hasFeaturedServices ? (
        <>
          <FeaturedServicesCarousel
            onSelectService={service =>
              onSelectService && onSelectService(service._id)
            }
          />
          <SearchSection
            onSelectOccasion={(occasion, selectedDate) =>
              onSelectOccasion && onSelectOccasion(occasion, selectedDate)
            }
          />
        </>
      ) : (
        <MasarraWelcome
          onBrowseServices={() => onNavigate && onNavigate('occasions')}
          onGetStarted={() => onNavigate && onNavigate('auth')}
        />
      )}

      <Services
        onSelectService={service =>
          onSelectService && onSelectService(service._id)
        }
        onViewAll={() => onNavigate && onNavigate('services')}
      />

      {/* Occasions Section */}
      <View style={styles.occasionsSection}>
        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
            {t('occasions').toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate('occasions')}
          >
            <Text
              style={[styles.viewAllButton, isRTL && styles.viewAllButtonRTL]}
            >
              {isRTL ? 'عرض الكل' : 'View All'}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('failedToLoad')}</Text>
          </View>
        ) : (
          <FlatList
            data={occasions}
            renderItem={renderOccasionCard}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalList,
              isRTL && styles.horizontalListRTL,
            ]}
            inverted={isRTL}
          />
        )}
      </View>
    </Animated.ScrollView>
  );
};

export default Home;
