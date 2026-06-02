import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
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
}

const Home: React.FC<HomeProps> = ({
  onNavigate,
  currentRoute,
  onSelectService,
  onSelectOccasion,
  isBannerDismissed,
  setIsBannerDismissed,
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
  const fadeAnim = useRef(new Animated.Value(0.3)).current;
  const refreshFadeAnim = useRef(new Animated.Value(0.3)).current;

  // Touch-based pull-to-refresh states
  const [isPulling, setIsPulling] = useState(false);
  const isPullingRef = useRef(false);
  const touchStartY = useRef(0);
  const pullAnim = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  const pullTimeout = useRef<any>(null);

  const collapseHeader = useCallback(() => {
    if (pullTimeout.current) {
      clearTimeout(pullTimeout.current);
      pullTimeout.current = null;
    }
    isPullingRef.current = false;
    setIsPulling(false);
    if (!refreshing) {
      Animated.timing(pullAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [refreshing, pullAnim]);

  const handleScroll = (e: any) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  };

  const handleTouchStart = (e: any) => {
    touchStartY.current = e.nativeEvent.pageY;
  };

  const handleTouchMove = (e: any) => {
    if (refreshing) return;
    const currentY = e.nativeEvent.pageY;
    const dy = currentY - touchStartY.current;

    // Only animate if we are at the top of the list and pulling down
    if (scrollOffset.current <= 5 && dy > 0) {
      if (!isPullingRef.current) {
        isPullingRef.current = true;
        setIsPulling(true);
      }
      const resistance = 0.55;
      const pullDistance = Math.min(dy * resistance, 110);
      pullAnim.setValue(pullDistance);

      // Safety timeout: if no move event occurs for 800ms, collapse the header
      if (pullTimeout.current) {
        clearTimeout(pullTimeout.current);
      }
      pullTimeout.current = setTimeout(() => {
        if (isPullingRef.current && !refreshing) {
          collapseHeader();
        }
      }, 800);
    }
  };

  const handleTouchEnd = () => {
    collapseHeader();
  };

  const handleScrollEndDrag = () => {
    collapseHeader();
  };

  useEffect(() => {
    if (refreshing) {
      Animated.timing(pullAnim, {
        toValue: 110,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (!isPulling) {
      Animated.timing(pullAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [refreshing, isPulling]);

  useEffect(() => {
    return () => {
      if (pullTimeout.current) {
        clearTimeout(pullTimeout.current);
      }
    };
  }, []);

  const hasFeaturedServices =
    services?.some(service => service.isFeatured) || false;
  const isLoading = occasionsLoading || servicesLoading;

  // Pulsing animation for logo (initial loading)
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

  // Pulsing animation for refresh logo
  useEffect(() => {
    if (refreshing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(refreshFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(refreshFadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    return undefined;
  }, [refreshing, refreshFadeAnim]);

  // Set initial loading to false when query is finished
  useEffect(() => {
    if (!isLoading && initialLoading) {
      // Add small delay for smooth transition
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, initialLoading]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOccasions(), refetchServices()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchOccasions, refetchServices]);

  // Show loading screen with logo while initial data is loading
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

  // If showing user profile screen
  if (showUserProfile) {
    return (
      <UserProfile
        userName={user?.name}
        userEmail={user?.email}
        userPhone={user?.phone}
        profilePicture={user?.profilePicture}
        onBack={() => {
          if (onNavigate) {
            onNavigate('home');
          }
        }}
        onShowAuth={() => {
          if (onNavigate) {
            onNavigate('auth');
          }
        }}
        onNavigate={route => {
          if (onNavigate) onNavigate(route);
        }}
        onSelectService={(serviceId: string) => {
          // close profile and forward service selection to parent
          if (onSelectService) onSelectService(serviceId);
        }}
      />
    );
  }

  // If showing auth screen
  if (showAuth) {
    return (
      <Auth
        onBack={() => {
          if (onNavigate) {
            onNavigate('home');
          }
        }}
      />
    );
  }

  const renderOccasionCard = ({ item }: { item: Occasion }) => {
    const displayName = isRTL ? item.nameAr : item.name;

    return (
      <TouchableOpacity
        style={styles.occasionCard}
        activeOpacity={0.8}
        onPress={() => {
          if (onSelectOccasion) onSelectOccasion(item);
        }}
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
          numberOfLines={2}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="transparent"
          colors={['transparent']}
          progressBackgroundColor="transparent"
          progressViewOffset={10000}
        />
      }
      scrollEnabled={!isPulling && !refreshing}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={handleScroll}
      onScrollEndDrag={handleScrollEndDrag}
      scrollEventThrottle={16}
    >
      {/* Custom Pull-to-Refresh Header with dynamic slide down */}
      <Animated.View
        style={{
          width: '100%',
          height: pullAnim,
          overflow: 'hidden',
          backgroundColor: colors.primary,
        }}
      >
        <View
          style={{
            width: '100%',
            height: 110,
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: 10,
          }}
        >
          <Animated.Image
            source={require('../imgs/logo.png')}
            style={{ width: 80, height: 80, opacity: refreshFadeAnim }}
            resizeMode="contain"
          />
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#ffffff',
              fontWeight: '600',
            }}
          >
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      </Animated.View>

      {/* Header inside ScrollView so it slides down with pull-to-refresh */}
      <Header
        onNavigate={onNavigate}
        isBannerDismissed={isBannerDismissed}
        setIsBannerDismissed={setIsBannerDismissed}
      />

      {/* Conditional Welcome Section or Featured Services Carousel */}
      {hasFeaturedServices ? (
        <>
          <FeaturedServicesCarousel
            onSelectService={service => {
              if (onSelectService) {
                onSelectService(service._id);
              }
            }}
          />
          <SearchSection
            onSelectOccasion={(occasion, selectedDate) => {
              if (onSelectOccasion) onSelectOccasion(occasion, selectedDate);
            }}
          />
        </>
      ) : (
        <MasarraWelcome
          onBrowseServices={() => {
            if (onNavigate) {
              onNavigate('occasions');
            }
          }}
          onGetStarted={() => {
            if (onNavigate) {
              onNavigate('auth');
            }
          }}
        />
      )}

      <Services
        onSelectService={service => {
          if (onSelectService) {
            onSelectService(service._id);
          }
        }}
        onViewAll={() => {
          if (onNavigate) {
            onNavigate('services');
          }
        }}
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
    </ScrollView>
  );
};

export default Home;
