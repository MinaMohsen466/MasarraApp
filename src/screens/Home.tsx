import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
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

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeProps {
  onNavigate?: (route: string) => void;
  currentRoute?: string;
  onSelectService?: (serviceId: string) => void;
  onSelectOccasion?: (occasion: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, currentRoute, onSelectService, onSelectOccasion }) => {
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const { data: occasions, isLoading, error } = useOccasions();
  const { data: services } = useServices();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Check if there are any featured services
  const hasFeaturedServices = services?.some(service => service.isFeatured) || false;

  // Listen for 'auth' or 'profile' route from external navigation (like header)
  useEffect(() => {
    console.log('📍 Home.tsx - currentRoute changed to:', currentRoute);
    if (currentRoute === 'auth') {
      console.log('✅ Showing Auth screen');
      setShowAuth(true);
      setShowUserProfile(false);
    } else if (currentRoute === 'profile') {
      console.log('✅ Showing Profile screen');
      // Always show profile page (it will handle logged-in vs logged-out state)
      setShowUserProfile(true);
      setShowAuth(false);
    } else {
      console.log('❌ Route not auth or profile, hiding both screens');
      setShowAuth(false);
      setShowUserProfile(false);
    }
  }, [currentRoute]);

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
        onNavigate={(route) => {
          setShowUserProfile(false);
          if (onNavigate) onNavigate(route);
        }}
        onSelectService={(serviceId: string) => {
          // close profile and forward service selection to parent
          setShowUserProfile(false);
          if (onSelectService) onSelectService(serviceId);
        }}
      />
    );
  }

  // If showing auth screen
  if (showAuth) {
    return (
      <Auth onBack={() => {
        setShowAuth(false);
        if (onNavigate) {
          onNavigate('home');
        }
      }} />
    );
  }

  const renderOccasionCard = ({ item }: { item: Occasion }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    
    return (
      <TouchableOpacity
        style={styles.occasionCard}
        activeOpacity={0.8}
        onPress={() => {
          console.log('Occasion pressed:', item);
          if (onSelectOccasion) onSelectOccasion(item);
        }}>
        <View style={styles.iconContainer}>
          {item.image ? (
            <Image
              source={{ uri: getImageUrl(item.image) }}
              style={styles.occasionImage}
            />
          ) : (
            <View style={styles.placeholderIcon} />
          )}
        </View>
        <Text style={[styles.occasionText, isRTL && styles.occasionTextRTL]} numberOfLines={2}>
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
            onSelectService={(service) => {
              console.log('Selected featured service:', service);
              if (onSelectService) {
                onSelectService(service._id); // App treats Home-origin separately
              }
            }}
          />
          {/* Search Section - Only shown when featured services exist */}
          <SearchSection
            onSearch={() => {
              console.log('Search clicked from home');
              // Search will handle occasion selection
            }}
            onSelectOccasion={(occasion) => {
              console.log('🎉 Occasion selected from search section:', occasion._id, occasion.name);
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

      {/* Services Section */}
      <Services 
        onSelectService={(service) => {
          console.log('Selected service:', service);
          if (onSelectService) {
            onSelectService(service._id); // App will receive this as Home-origin
          }
        }}
        onViewAll={() => {
          console.log('View All Services clicked');
          // TODO: Navigate to services page
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
          <TouchableOpacity onPress={() => onNavigate && onNavigate('occasions')}>
            <Text style={[styles.viewAllButton, isRTL && styles.viewAllButtonRTL]}>
              {isRTL ? 'عرض الكل' : 'View All'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('failedToLoad')}</Text>
          </View>
        ) : (
          <FlatList
            data={occasions}
            renderItem={renderOccasionCard}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList, isRTL && styles.horizontalListRTL]}
            inverted={isRTL}
          />
        )}
      </View>
    </ScrollView>
  );
};


export default Home;
