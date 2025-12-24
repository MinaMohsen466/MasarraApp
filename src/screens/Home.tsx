import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { colors } from '../constants/colors';
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

interface HomeProps {
  onNavigate?: (route: string) => void;
  currentRoute?: string;
  onSelectService?: (serviceId: string) => void;
  onSelectOccasion?: (occasion: any) => void;
  onShowChat?: () => void;
  onHideChat?: () => void;
}

const Home: React.FC<HomeProps> = ({
  onNavigate,
  currentRoute,
  onSelectService,
  onSelectOccasion,
  onShowChat,
  onHideChat,
}) => {
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const {
    data: occasions,
    isLoading: occasionsLoading,
    error,
  } = useOccasions();
  const { data: services, isLoading: servicesLoading } = useServices();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  const hasFeaturedServices =
    services?.some(service => service.isFeatured) || false;
  const isLoading = occasionsLoading || servicesLoading;

  // Pulsing animation for logo
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
  }, [initialLoading, isLoading, fadeAnim]);

  // Hide initial loading screen when data is ready
  useEffect(() => {
    if (!isLoading && initialLoading) {
      // Add small delay for smooth transition
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, initialLoading]);

  useEffect(() => {
    if (currentRoute === 'auth') {
      setShowAuth(true);
      setShowUserProfile(false);
    } else if (currentRoute === 'profile') {
      setShowUserProfile(true);
      setShowAuth(false);
    } else {
      setShowAuth(false);
      setShowUserProfile(false);
    }
  }, [currentRoute]);

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
          setShowUserProfile(false);
          if (onNavigate) {
            onNavigate('home');
          }
        }}
        onShowAuth={() => {
          setShowUserProfile(false);
          setShowAuth(true);
        }}
        onNavigate={route => {
          setShowUserProfile(false);
          if (onNavigate) onNavigate(route);
        }}
        onSelectService={(serviceId: string) => {
          // close profile and forward service selection to parent
          setShowUserProfile(false);
          if (onSelectService) onSelectService(serviceId);
        }}
        onShowChat={onShowChat}
        onHideChat={onHideChat}
      />
    );
  }

  // If showing auth screen
  if (showAuth) {
    return (
      <Auth
        onBack={() => {
          setShowAuth(false);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            onSelectOccasion={occasion => {
              if (onSelectOccasion) onSelectOccasion(occasion);
            }}
          />
        </>
      ) : (
        <MasarraWelcome
          onBrowseServices={() => {
            // Navigate to occasions page
            if (onNavigate) {
              onNavigate('occasions');
            }
          }}
          onGetStarted={() => setShowAuth(true)}
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
