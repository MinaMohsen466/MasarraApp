import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { createStyles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { Service, getServiceImageUrl } from '../../services/servicesApi';
import { getServiceReviews } from '../../services/reviewsApi';

interface ServicesProps {
  onSelectService?: (service: Service) => void;
  onViewAll?: () => void;
}

const Services: React.FC<ServicesProps> = ({ onSelectService, onViewAll }) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const styles = createStyles(SCREEN_WIDTH);
  const { isRTL } = useLanguage();
  const { data: services, isLoading, error } = useServices();
  const [serviceRatings, setServiceRatings] = useState<{
    [key: string]: { rating: number; totalReviews: number };
  }>({});

  // Load ratings for all services
  useEffect(() => {
    const loadRatings = async () => {
      if (!services || services.length === 0) return;

      try {
        // Load all ratings in parallel for better performance
        const ratingsPromises = services.map(async service => {
          try {
            const reviewsData = await getServiceReviews(service._id, 1, 1);
            return {
              serviceId: service._id,
              rating: reviewsData.stats.averageRating || 0,
              totalReviews: reviewsData.stats.totalRatings || 0,
            };
          } catch (error) {
            return {
              serviceId: service._id,
              rating: 0,
              totalReviews: 0,
            };
          }
        });

        const ratingsResults = await Promise.all(ratingsPromises);

        const ratingsData: {
          [key: string]: { rating: number; totalReviews: number };
        } = {};

        ratingsResults.forEach(result => {
          ratingsData[result.serviceId] = {
            rating: result.rating,
            totalReviews: result.totalReviews,
          };
        });

        setServiceRatings(ratingsData);
      } catch (error) {
      }
    };

    loadRatings();
  }, [services]);

  const renderServiceCard = ({ item }: { item: Service }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const displayDescription = isRTL ? item.descriptionAr : item.description;

    // Calculate discount and final price
    const hasDiscount =
      item.isOnSale &&
      ((item.salePrice && item.salePrice > 0 && item.salePrice < item.price) ||
        (item.discountPercentage && item.discountPercentage > 0));

    let discountPercent = 0;
    let finalPrice = item.price;

    if (hasDiscount) {
      // Priority: use salePrice if available, otherwise use discountPercentage
      if (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) {
        finalPrice = item.salePrice;
        discountPercent = Math.round(
          ((item.price - item.salePrice) / item.price) * 100,
        );
      } else if (item.discountPercentage && item.discountPercentage > 0) {
        discountPercent = item.discountPercentage;
        finalPrice = item.price * (1 - item.discountPercentage / 100);
      }
    }

    // Try to get image URL
    let imageUrl = null;
    if (item.images && item.images.length > 0) {
      imageUrl = getServiceImageUrl(item.images[0]);
    }

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onSelectService && onSelectService(item)}
        activeOpacity={0.8}
      >
        {/* Service Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <>
              <Image
                key={item.images[0]}
                source={{ uri: imageUrl }}
                style={styles.serviceImage}
                resizeMode="cover"
                onError={e => {}}
                onLoad={() => {}}
              />
              {hasDiscount && discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discountPercent}%</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.infoContainer}>
          {/* Service Name */}
          <Text
            style={[styles.serviceName, isRTL && styles.serviceNameRTL]}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          {/* Service Description */}
          <Text
            style={[
              styles.serviceDescription,
              isRTL && styles.serviceDescriptionRTL,
            ]}
            numberOfLines={2}
          >
            {displayDescription}
          </Text>

          {/* Price and Rating Row */}
          <View
            style={[styles.priceRatingRow, isRTL && styles.priceRatingRowRTL]}
          >
            <View style={styles.priceColumn}>
              <Text style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}>
                {isRTL ? 'السعر يبدأ من' : 'Price starts from'}
              </Text>
              {hasDiscount ? (
                <View style={{ gap: 2 }}>
                  <Text
                    style={[styles.priceValue, isRTL && styles.priceValueRTL]}
                  >
                    {isRTL
                      ? `${finalPrice.toFixed(3)} د.ك`
                      : `${finalPrice.toFixed(3)} KD`}
                  </Text>
                  <Text
                    style={[
                      styles.originalPrice,
                      isRTL && styles.originalPriceRTL,
                    ]}
                  >
                    {isRTL
                      ? `${item.price.toFixed(3)} د.ك`
                      : `${item.price.toFixed(3)} KD`}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.priceValue, isRTL && styles.priceValueRTL]}
                >
                  {isRTL
                    ? `${item.price.toFixed(3)} د.ك`
                    : `${item.price.toFixed(3)} KD`}
                </Text>
              )}
            </View>
            <View style={[styles.ratingRow, isRTL && styles.ratingRowRTL]}>
              <Text style={styles.rating}>
                ★{' '}
                {(serviceRatings[item._id]?.rating || 0) > 0
                  ? (serviceRatings[item._id]?.rating || 0).toFixed(1)
                  : '0.0'}
              </Text>
              <Text style={styles.reviews}>
                ({serviceRatings[item._id]?.totalReviews || 0})
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
          {isRTL ? 'جاري تحميل الخدمات...' : 'Loading services...'}
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>
          {isRTL ? 'فشل في تحميل الخدمات' : 'Failed to load services'}
        </Text>
      </View>
    );
  }

  // Show empty state
  if (!services || services.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
          {isRTL ? 'لا توجد خدمات متاحة' : 'No services available'}
        </Text>
      </View>
    );
  }

  // Get only the first 10 services (most recent from API)
  const trendingServices = services.slice(0, 10);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
        <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
          {isRTL ? 'الخدمات الشائعة' : 'TRENDING'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            onViewAll && onViewAll();
          }}
        >
          <Text
            style={[styles.viewAllButton, isRTL && styles.viewAllButtonRTL]}
          >
            {isRTL ? 'عرض الكل' : 'View All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <FlatList
        data={trendingServices}
        renderItem={renderServiceCard}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.horizontalList,
          isRTL && styles.horizontalListRTL,
        ]}
        inverted={isRTL}
      />
    </View>
  );
};

export default Services;
