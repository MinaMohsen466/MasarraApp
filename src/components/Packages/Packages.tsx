import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { createStyles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  useInfinitePackages,
  flattenPackages,
  Package,
} from '../../hooks/usePackages';
import { getImageUrl } from '../../services/api';
import { getServiceReviews } from '../../services/reviewsApi';
import SortModal from '../SortModal/SortModal';
import FilterModal from '../FilterModal/FilterModal';
export type { Package };

interface PackagesProps {
  onSelectPackage?: (pkg: Package) => void;
  onBack?: () => void;
}

const Packages: React.FC<PackagesProps> = ({ onSelectPackage, onBack }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const styles = createStyles(screenWidth);
  const { isRTL } = useLanguage();
  const backIconSize = isTablet ? 18 : 20;

  // Local filter and sort states
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    bookingType?: string;
    onSale?: boolean;
  }>({});

  const [refreshing, setRefreshing] = useState(false);

  // Memoized query filters to pass to backend
  const queryFilters = useMemo(() => {
    const qf: any = {};
    if (filters.minPrice !== undefined) qf.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) qf.maxPrice = filters.maxPrice;
    return qf;
  }, [filters.minPrice, filters.maxPrice]);

  // Use infinite query for pagination with backend price filters
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfinitePackages(queryFilters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Flatten paginated data
  const packages = flattenPackages(data);

  // Client-side filtering (discount) and sorting
  const sortedAndFilteredPackages = useMemo(() => {
    let result = [...packages];

    // Apply client-side discount filter
    if (filters.onSale) {
      result = result.filter(pkg => pkg.discountPrice > 0);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aDisplayPrice =
        a.discountPrice > 0 ? a.totalPrice - a.discountPrice : a.totalPrice;
      const bDisplayPrice =
        b.discountPrice > 0 ? b.totalPrice - b.discountPrice : b.totalPrice;

      switch (sortBy) {
        case 'priceHigh':
          return bDisplayPrice - aDisplayPrice;
        case 'priceLow':
          return aDisplayPrice - bDisplayPrice;
        case 'nameAZ':
          return a.name.localeCompare(b.name);
        case 'nameZA':
          return b.name.localeCompare(a.name);
        case 'newest':
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return result;
  }, [packages, sortBy, filters.onSale]);

  const [packageRatings, setPackageRatings] = useState<{
    [key: string]: { rating: number; totalReviews: number };
  }>({});

  // Load ratings for loaded packages
  useEffect(() => {
    const loadRatings = async () => {
      if (!packages || packages.length === 0) return;

      const ratingsData: {
        [key: string]: { rating: number; totalReviews: number };
      } = {};

      for (const pkg of packages) {
        // Skip if already loaded
        if (packageRatings[pkg._id]) continue;

        if (pkg.service?._id) {
          try {
            const reviewsData = await getServiceReviews(pkg.service._id, 1, 1);
            ratingsData[pkg._id] = {
              rating: reviewsData.stats.averageRating || 0,
              totalReviews: reviewsData.stats.totalRatings || 0,
            };
          } catch {
            ratingsData[pkg._id] = { rating: 0, totalReviews: 0 };
          }
        }
      }

      if (Object.keys(ratingsData).length > 0) {
        setPackageRatings(prev => ({ ...prev, ...ratingsData }));
      }
    };

    loadRatings();
  }, [packages]);

  // Handle load more when reaching end of list
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Footer component showing loading indicator when fetching more
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderPackageCard = ({ item }: { item: Package }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const displayDescription = isRTL ? item.descriptionAr : item.description;
    // discountPrice is the discount amount (e.g., 20 KD off), not the final price
    // Final price = totalPrice - discountPrice
    const displayPrice =
      item.discountPrice > 0
        ? item.totalPrice - item.discountPrice
        : item.totalPrice;

    const rating = packageRatings[item._id]?.rating || 0;
    const totalReviews = packageRatings[item._id]?.totalReviews || 0;

    return (
      <TouchableOpacity
        style={styles.packageCard}
        onPress={() => onSelectPackage?.(item)}
        activeOpacity={0.8}
      >
        <View style={styles.packageImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: getImageUrl(item.images[0]) }}
              style={styles.packageImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage} />
          )}
          {item.discountPrice > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round((item.discountPrice / item.totalPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>
        <View style={styles.packageInfo}>
          <Text
            style={[styles.packageName, isRTL && styles.packageNameRTL]}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <Text
            style={[
              styles.packageDescription,
              isRTL && styles.packageDescriptionRTL,
            ]}
            numberOfLines={2}
          >
            {displayDescription}
          </Text>

          <View
            style={[styles.priceRatingRow, isRTL && styles.priceRatingRowRTL]}
          >
            <View style={styles.priceColumn}>
              <Text style={styles.packagePrice}>
                {displayPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
              {item.discountPrice > 0 && (
                <Text style={styles.originalPrice}>
                  {item.totalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                </Text>
              )}
            </View>
            <View style={[styles.ratingRow, isRTL && styles.ratingRowRTL]}>
              <Text style={styles.rating}>
                ★ {rating > 0 ? rating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.reviews}>({totalReviews})</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          {onBack && (
            <TouchableOpacity
              style={[styles.backButton, isRTL && styles.backButtonRTL]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Svg
                width={backIconSize}
                height={backIconSize}
                viewBox="0 0 24 24"
                fill="none"
              >
                <Path
                  d="M15 18L9 12L15 6"
                  stroke={colors.primary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {isRTL ? 'الباقات' : 'PACKAGES'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          {onBack && (
            <TouchableOpacity
              style={[styles.backButton, isRTL && styles.backButtonRTL]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Svg
                width={backIconSize}
                height={backIconSize}
                viewBox="0 0 24 24"
                fill="none"
              >
                <Path
                  d="M15 18L9 12L15 6"
                  stroke={colors.primary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {isRTL ? 'الباقات' : 'PACKAGES'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {isRTL ? 'فشل تحميل الباقات' : 'Failed to load packages'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        {onBack && (
          <TouchableOpacity
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Svg
              width={backIconSize}
              height={backIconSize}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M15 18L9 12L15 6"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {isRTL ? 'الباقات' : 'PACKAGES'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter and Sort Buttons - below header */}
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
          <Text style={[styles.filterSortButtonText, isRTL && styles.textRTL]}>
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
          <Text style={[styles.filterSortButtonText, isRTL && styles.textRTL]}>
            {isRTL ? 'ترتيب' : 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor="#ffffff"
          />
        }
        data={sortedAndFilteredPackages}
        renderItem={renderPackageCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        key={numColumns}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<View style={{ width: '100%' }} />}
        ListFooterComponent={renderFooter}
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

export default Packages;
