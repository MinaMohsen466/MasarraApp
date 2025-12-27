import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  useWindowDimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { createStyles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { Service, getServiceImageUrl } from '../../services/servicesApi';

interface FeaturedServicesCarouselProps {
  onSelectService?: (service: Service) => void;
}

const FeaturedServicesCarousel: React.FC<FeaturedServicesCarouselProps> = ({
  onSelectService,
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const styles = createStyles(SCREEN_WIDTH);
  useLanguage();
  const { data: services, isLoading } = useServices();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const dotAnimations = useRef<Animated.Value[]>([]).current;

  // Filter only featured services
  const featuredServices =
    services?.filter(service => service.isFeatured) || [];

  // Initialize dot animations
  if (dotAnimations.length !== featuredServices.length) {
    dotAnimations.length = 0;
    featuredServices.forEach(() => {
      dotAnimations.push(new Animated.Value(0));
    });
  }

  // Animate dots when currentIndex changes
  useEffect(() => {
    dotAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === currentIndex ? 1 : 0,
        useNativeDriver: false,
        friction: 5,
        tension: 100,
      }).start();
    });
  }, [currentIndex, dotAnimations]);

  // Auto-scroll effect
  useEffect(() => {
    if (featuredServices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % featuredServices.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000); // Change slide every 5 seconds

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
    const imageUrl =
      item.images && item.images.length > 0
        ? getServiceImageUrl(item.images[0])
        : null;

    // Calculate discount percentage or use provided one
    const hasDiscount =
      item.isOnSale &&
      ((item.salePrice && item.salePrice > 0 && item.salePrice < item.price) ||
        (item.discountPercentage && item.discountPercentage > 0));

    let discountPercent = 0;
    if (hasDiscount) {
      // Priority: use salePrice if available, otherwise use discountPercentage
      if (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) {
        discountPercent = Math.round(
          ((item.price - item.salePrice) / item.price) * 100,
        );
      } else if (item.discountPercentage && item.discountPercentage > 0) {
        discountPercent = item.discountPercentage;
      }
    }

    return (
      <TouchableOpacity
        style={styles.slideContainer}
        onPress={() => onSelectService && onSelectService(item)}
        activeOpacity={0.9}
      >
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
        keyExtractor={item => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        onMomentumScrollEnd={event => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
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
          {featuredServices.map((_, index) => {
            const isActive = index === currentIndex;
            const animValue = dotAnimations[index] || new Animated.Value(0);
            
            const width = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 20],
            });

            const scale = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.paginationDot,
                  isActive && styles.paginationDotActive,
                  {
                    width: width,
                    transform: [{ scale: scale }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

export default FeaturedServicesCarousel;
