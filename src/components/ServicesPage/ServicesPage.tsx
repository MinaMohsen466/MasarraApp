import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { createStyles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { Service, getServiceImageUrl } from '../../services/servicesApi';
import { getServiceReviews } from '../../services/reviewsApi';
import { Vendor, fetchVendors } from '../../services/vendorsApi';
import { useVendorPackages } from '../../hooks/usePackages';
import { Package } from '../Packages/Packages';
import { getImageUrl } from '../../services/api';
import VendorHeader from '../VendorHeader/VendorHeader';
import SortModal from '../SortModal/SortModal';
import FilterModal from '../FilterModal/FilterModal';

interface ServicesPageProps {
  onSelectService?: (service: Service) => void;
  onSelectPackage?: (pkg: Package) => void;
  onBack?: () => void;
  vendorId?: string; // Optional vendor filter
  vendorName?: string; // Optional vendor name for display
  occasionId?: string; // Optional occasion filter
  occasionName?: string; // Optional occasion name for display
  preSelectedDate?: Date; // Pre-selected date from search (for filtering availability)
}

const ServicesPage: React.FC<ServicesPageProps> = ({
  onSelectService,
  onSelectPackage,
  onBack,
  vendorId,
  vendorName,
  occasionId,
  occasionName,
  preSelectedDate,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const styles = createStyles(screenWidth);
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient(); // For prefetching
  const { data: services, isLoading, error } = useServices();
  const { data: packages } = useVendorPackages(vendorId || '');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(!!vendorId);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    bookingType?: string;
    onSale?: boolean;
  }>({});
  const [vendorRating, setVendorRating] = useState<{
    rating: number;
    totalReviews: number;
  }>({ rating: 0, totalReviews: 0 });
  const [serviceRatings, setServiceRatings] = useState<{
    [key: string]: { rating: number; totalReviews: number };
  }>({});

  // Prefetch reviews for visible services - optimized approach
  useEffect(() => {
    const prefetchReviews = async () => {
      if (!services || services.length === 0) return;

      // Only prefetch first 10 services (visible ones)
      const visibleServices = services.slice(0, 10);

      visibleServices.forEach(service => {
        // Prefetch using React Query cache
        queryClient.prefetchQuery({
          queryKey: ['service-reviews', service._id],
          queryFn: () => getServiceReviews(service._id, 1, 10),
          staleTime: 10 * 60 * 1000,
        });
      });
    };

    // Delay prefetch slightly to not block UI
    const timer = setTimeout(prefetchReviews, 300);
    return () => clearTimeout(timer);
  }, [services, queryClient]);

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

  // Fetch vendor rating from reviews API
  useEffect(() => {
    if (!services || !vendorId) return;

    const vendorServices = services.filter(s => s.vendor?._id === vendorId);
    if (vendorServices.length === 0) return;

    const fetchAllReviews = async () => {
      try {
        // Fetch all reviews in parallel for better performance
        const reviewsPromises = vendorServices.map(service =>
          getServiceReviews(service._id, 1, 1000).catch(() => ({
            stats: { averageRating: 0, totalRatings: 0 },
          })),
        );

        const reviewsResults = await Promise.all(reviewsPromises);

        let totalRating = 0;
        let totalReviewsCount = 0;

        reviewsResults.forEach(reviewsData => {
          if (reviewsData.stats.totalRatings > 0) {
            totalRating +=
              reviewsData.stats.averageRating * reviewsData.stats.totalRatings;
            totalReviewsCount += reviewsData.stats.totalRatings;
          }
        });

        const averageRating =
          totalReviewsCount > 0
            ? Math.round((totalRating / totalReviewsCount) * 10) / 10
            : 0;

        setVendorRating({
          rating: averageRating,
          totalReviews: totalReviewsCount,
        });
      } catch (error) {
      }
    };

    fetchAllReviews();
  }, [services, vendorId]);

  // Fetch vendor details when vendorId is provided
  useEffect(() => {
    if (!vendorId) return;

    const fetchVendor = async () => {
      try {
        const vendors = await fetchVendors();
        const found = vendors.find(v => v._id === vendorId);
        if (found) setVendor(found);
      } catch (error) {
        // Silently handle error
      } finally {
        setLoadingVendor(false);
      }
    };

    fetchVendor();
  }, [vendorId]);

  // Filter services by vendor or occasion
  const filteredServices = useMemo(() => {
    let result = services;

    if (vendorId) {
      result = result?.filter(service => service.vendor?._id === vendorId);
    }

    if (occasionId) {
      result = result?.filter(service =>
        service.occasions.some(occ => occ.occasion._id === occasionId),
      );
    }

    return result;
  }, [services, vendorId, occasionId]);

  // Extract unique occasions from filtered vendor services
  const vendorOccasions = useMemo(() => {
    if (vendorId && filteredServices && filteredServices.length > 0) {
      const occasions = new Map<
        string,
        { _id: string; name: string; nameAr: string }
      >();

      filteredServices.forEach(service => {
        service.occasions.forEach(occ => {
          if (occ.occasion && !occasions.has(occ.occasion._id)) {
            occasions.set(occ.occasion._id, {
              _id: occ.occasion._id,
              name: occ.occasion.name,
              nameAr: occ.occasion.name,
            });
          }
        });
      });

      return Array.from(occasions.values());
    }
    return [];
  }, [vendorId, filteredServices]);

  // Apply sorting and filtering
  const sortedAndFilteredServices = useMemo(() => {
    let result = [...(filteredServices || [])];

    // Apply price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      result = result.filter(service => {
        const price = service.price;
        const minOk =
          filters.minPrice === undefined || price >= filters.minPrice;
        const maxOk =
          filters.maxPrice === undefined || price <= filters.maxPrice;
        return minOk && maxOk;
      });
    }

    // Apply booking type filter based on maxBookingsPerSlot
    // -1 = unlimited, positive number = limited
    if (filters.bookingType) {
      result = result.filter(service => {
        const maxSlots = service.maxBookingsPerSlot;
        if (filters.bookingType === 'unlimited') {
          return maxSlots === -1;
        } else if (filters.bookingType === 'limited') {
          return maxSlots !== undefined && maxSlots !== -1 && maxSlots > 0;
        }
        return true;
      });
    }

    // Apply discount filter
    if (filters.onSale) {
      result = result.filter(service => {
        const hasSalePrice =
          service.salePrice &&
          service.salePrice > 0 &&
          service.salePrice < service.price;
        const hasDiscountPercentage =
          service.discountPercentage && service.discountPercentage > 0;
        return service.isOnSale && (hasSalePrice || hasDiscountPercentage);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priceHigh':
          return b.price - a.price;
        case 'priceLow':
          return a.price - b.price;
        case 'nameAZ':
          return a.name.localeCompare(b.name);
        case 'nameZA':
          return b.name.localeCompare(a.name);
        case 'newest':
        default:
          return 0;
      }
    });

    return result;
  }, [filteredServices, sortBy, filters]);

  const renderServiceCard = ({ item }: { item: Service }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const displayDescription = isRTL ? item.descriptionAr : item.description;
    const imageUrl =
      item.images && item.images.length > 0
        ? getServiceImageUrl(item.images[0])
        : null;

    // Calculate discount
    let finalPrice = item.price;
    let originalPrice = item.price;
    let discountPercent = 0;

    if (item.salePrice && item.salePrice > 0 && item.salePrice < item.price) {
      finalPrice = item.salePrice;
      discountPercent = Math.round(
        ((item.price - item.salePrice) / item.price) * 100,
      );
    } else if (item.discountPercentage && item.discountPercentage > 0) {
      discountPercent = item.discountPercentage;
      finalPrice = item.price * (1 - item.discountPercentage / 100);
    }

    const hasDiscount = discountPercent > 0;

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onSelectService && onSelectService(item)}
        activeOpacity={0.8}
      >
        {/* Service Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              key={item.images[0]}
              source={{ uri: imageUrl }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
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

          {/* Vendor Name */}
          {item.vendor && (
            <Text
              style={[styles.vendorName, isRTL && styles.vendorNameRTL]}
              numberOfLines={1}
            >
              {item.vendor.name}
            </Text>
          )}

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
                      ? `${originalPrice.toFixed(3)} د.ك`
                      : `${originalPrice.toFixed(3)} KD`}
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

  const renderPackageCard = ({ item }: { item: Package }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const displayPrice =
      item.discountPrice > 0 ? item.discountPrice : item.totalPrice;

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onSelectPackage && onSelectPackage(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: getImageUrl(item.images[0]) }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {item.discountPrice > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text
                style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}
              >
                {Math.round(
                  ((item.totalPrice - item.discountPrice) / item.totalPrice) *
                  100,
                )}
                % OFF
              </Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text
            style={[styles.serviceName, isRTL && styles.serviceNameRTL]}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: colors.primary,
                fontWeight: 'bold',
                backgroundColor: colors.primary + '15',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              {isRTL ? 'باقة' : 'PACKAGE'}
            </Text>
          </View>
          <View
            style={[
              styles.priceContainer,
              isRTL && styles.priceContainerRTL,
              { marginTop: 8 },
            ]}
          >
            {item.discountPrice > 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color: '#999',
                  textDecorationLine: 'line-through',
                  marginRight: 6,
                }}
              >
                {item.totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            )}
            <Text style={[styles.priceValue, isRTL && styles.priceValueRTL]}>
              {displayPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
            </Text>
          </View>
          {item.totalReviews > 0 && (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                marginTop: 4,
              }}
            >
              <Text style={{ color: '#FFB800', fontSize: 12 }}>★</Text>
              <Text style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>
                {item.rating.toFixed(1)} ({item.totalReviews})
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if ((isLoading || loadingVendor) && vendorId) {
    return (
      <View style={styles.pageContainer}>
        {/* Custom Header with Back Button */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <TouchableOpacity
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18L9 12L15 6"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
            {occasionName || vendorName || (isRTL ? 'الخدمات' : 'SERVICES')}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Show vendor header while services are loading */}
        {vendor && (
          <VendorHeader
            vendor={vendor}
            occasions={vendorOccasions}
            onFilterPress={() => { }}
            onSortPress={() => { }}
            overrideRating={vendorRating.rating}
            overrideTotalReviews={vendorRating.totalReviews}
          />
        )}

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
            {isRTL ? 'جاري تحميل الخدمات...' : 'Loading services...'}
          </Text>
        </View>
      </View>
    );
  }

  // Show loading state for general services (without vendor filter)
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
        <Text style={[styles.errorSubtext, isRTL && styles.textRTL]}>
          {error.message}
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

  return (
    <View style={styles.pageContainer}>
      {/* Custom Header with Back Button */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity
          style={[styles.backButton, isRTL && styles.backButtonRTL]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {occasionName || vendorName || (isRTL ? 'الخدمات' : 'SERVICES')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Filter and Sort Buttons - below header */}
      {!vendorId && (
        <View
          style={[
            styles.filterSortContainer,
            isRTL && styles.filterSortContainerRTL,
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowFilter(true)}
            style={styles.filterSortButton}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 7H21M6 12H18M9 17H15"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <Text
              style={[styles.filterSortButtonText, isRTL && styles.textRTL]}
            >
              {isRTL ? 'تصفية' : 'Filter'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSort(true)}
            style={styles.filterSortButton}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6H16M3 12H13M3 18H10"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <Text
              style={[styles.filterSortButtonText, isRTL && styles.textRTL]}
            >
              {isRTL ? 'ترتيب' : 'Sort'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Services Grid */}
      <FlatList
        data={sortedAndFilteredServices}
        renderItem={renderServiceCard}
        keyExtractor={item => item._id}
        key={numColumns}
        numColumns={numColumns}
        columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          vendor ? (
            <VendorHeader
              vendor={vendor}
              occasions={vendorOccasions}
              onFilterPress={() => setShowFilter(true)}
              onSortPress={() => setShowSort(true)}
              overrideRating={vendorRating.rating}
              overrideTotalReviews={vendorRating.totalReviews}
            />
          ) : null
        }
        ListFooterComponent={
          <>
            {vendorId && packages && packages.length > 0 && (
              <View>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    marginTop: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: colors.primary,
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {isRTL ? 'الباقات' : 'Packages'}
                  </Text>
                  <View
                    style={{
                      height: 3,
                      width: 50,
                      backgroundColor: colors.primary,
                      marginTop: 8,
                      alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    flexWrap: 'wrap',
                    paddingHorizontal: 0,
                  }}
                >
                  {packages.map(pkg => (
                    <View key={pkg._id} style={{ width: '50%', paddingHorizontal: 4, paddingVertical: 8 }}>
                      {renderPackageCard({ item: pkg })}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
              {vendorId
                ? isRTL
                  ? 'لا توجد خدمات أو باقات لهذا المورد'
                  : 'No services or packages for this vendor'
                : isRTL
                  ? 'لا توجد خدمات متاحة'
                  : 'No services available'}
            </Text>
          </View>
        }
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSort}
        onClose={() => setShowSort(false)}
        selectedSort={sortBy}
        onSortSelect={setSortBy}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilter={setFilters}
      />
    </View>
  );
};

export default ServicesPage;
