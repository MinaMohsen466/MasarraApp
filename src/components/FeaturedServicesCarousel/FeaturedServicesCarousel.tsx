import React, { useRef, useEffect } from 'react';
import { View, Text, Image, Dimensions, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { Service, getServiceImageUrl } from '../../services/servicesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeaturedServicesCarouselProps {
  onSelectService?: (service: Service) => void;
}

const FeaturedServicesCarousel: React.FC<FeaturedServicesCarouselProps> = ({ onSelectService }) => {
  useLanguage();
  const { data: services, isLoading } = useServices();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Filter only featured services
  const featuredServices = services?.filter(service => service.isFeatured) || [];

  // Auto-scroll effect
  useEffect(() => {
    if (featuredServices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredServices.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [featuredServices.length]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (featuredServices.length === 0) {
    return null;
  }

  const renderServiceSlide = ({ item }: { item: Service }) => {
    const imageUrl = item.images && item.images.length > 0 
      ? getServiceImageUrl(item.images[0]) 
      : null;

    // Calculate discount percentage or use provided one
    const hasDiscount = item.isOnSale && (
      (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) || 
      (item.discountPercentage && item.discountPercentage > 0)
    );
    
    let discountPercent = 0;
    if (hasDiscount) {
      // Priority: use salePrice if available, otherwise use discountPercentage
      if (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) {
        discountPercent = Math.round(((item.price - item.salePrice) / item.price) * 100);
      } else if (item.discountPercentage && item.discountPercentage > 0) {
        discountPercent = item.discountPercentage;
      }
    }

    return (
      <TouchableOpacity
        style={styles.slideContainer}
        onPress={() => onSelectService && onSelectService(item)}
        activeOpacity={0.9}>
        <View style={styles.imageCard}>
          {imageUrl ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              {hasDiscount && discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discountPercent}%</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderSlide}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={featuredServices}
        renderItem={renderServiceSlide}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      
      {/* Pagination Dots */}
      {featuredServices.length > 1 && (
        <View style={styles.pagination}>
          {featuredServices.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default FeaturedServicesCarousel;
