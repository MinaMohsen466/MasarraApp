import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { useServices } from '../hooks/useServices';
import { useOccasions } from '../hooks/useOccasions';
import { getServiceImageUrl } from '../services/servicesApi';
import { colors } from '../constants/colors';

interface SearchProps {
  onBack?: () => void;
  onSelectService?: (serviceId: string) => void;
  onSelectOccasion?: (occasion: any) => void;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 600;

const getServicePriceInfo = (item: any) => {
  const hasDiscount =
    item.isOnSale &&
    ((item.salePrice && item.salePrice > 0 && item.salePrice < item.price) ||
      (item.discountPercentage && item.discountPercentage > 0));

  let discountPercent = 0;
  let finalPrice = item.price;

  if (hasDiscount) {
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

  return { hasDiscount, finalPrice, discountPercent };
};

const Search: React.FC<SearchProps> = ({
  onBack,
  onSelectService,
  onSelectOccasion,
}) => {
  const { isRTL } = useLanguage();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: occasions, isLoading: occasionsLoading } = useOccasions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'all' | 'services' | 'occasions'>('all');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    if (searchType === 'all' || searchType === 'services') {
      services?.forEach(service => {
        const nameMatch = service.name?.toLowerCase().includes(query);
        const nameArMatch = service.nameAr?.toLowerCase().includes(query);
        const descMatch = service.description?.toLowerCase().includes(query);
        const descArMatch = service.descriptionAr?.toLowerCase().includes(query);
        const vendorMatch = service.vendor?.name?.toLowerCase().includes(query);

        if (nameMatch || nameArMatch || descMatch || descArMatch || vendorMatch) {
          results.push({
            ...service,
            type: 'service',
            displayName: isRTL ? service.nameAr : service.name,
            displaySubtitle: service.vendor?.name || (isRTL ? 'خدمة' : 'Service'),
            image: service.images?.[0],
          });
        }
      });
    }

    if (searchType === 'all' || searchType === 'occasions') {
      occasions?.forEach(occasion => {
        const nameMatch = occasion.name?.toLowerCase().includes(query);
        const nameArMatch = occasion.nameAr?.toLowerCase().includes(query);

        if (nameMatch || nameArMatch) {
          results.push({
            ...occasion,
            type: 'occasion',
            displayName: isRTL ? occasion.nameAr : occasion.name,
            displaySubtitle: isRTL ? 'مناسبة' : 'Occasion',
            image: occasion.image,
          });
        }
      });
    }

    setFilteredResults(results);
  }, [searchQuery, services, occasions, searchType, isRTL]);

  const handleResultPress = (item: any) => {
    if (item.type === 'service' && onSelectService) {
      onSelectService(item._id);
    } else if (item.type === 'occasion' && onSelectOccasion) {
      onSelectOccasion({ ...item, name: item.name, nameAr: item.nameAr, _id: item._id });
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => {
    const isOccasion = item.type === 'occasion';
    const { hasDiscount, finalPrice, discountPercent } = getServicePriceInfo(item);
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          style={[styles.resultCard, isRTL && styles.resultCardRTL]}
          onPress={() => handleResultPress(item)}
          activeOpacity={0.75}
        >
          {/* Image */}
          <View style={styles.resultImageWrapper}>
            {item.image ? (
              <Image
                source={{
                  uri: item.type === 'service'
                    ? getServiceImageUrl(item.image)
                    : item.image,
                }}
                style={styles.resultImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.resultImagePlaceholder, isOccasion && styles.occasionPlaceholder]}>
                <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                  {isOccasion ? (
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
                      fill={colors.primary}
                      opacity={0.7}
                    />
                  ) : (
                    <Path
                      d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                      stroke={colors.primary}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={[styles.resultContent, isRTL && styles.resultContentRTL]}>
            <View style={[styles.badgeRow, isRTL && styles.badgeRowRTL]}>
              <View style={[styles.typeBadge, isOccasion && styles.occasionBadge]}>
                <Text style={styles.typeBadgeText}>
                  {isOccasion
                    ? (isRTL ? 'مناسبة' : 'Occasion')
                    : (isRTL ? 'خدمة' : 'Service')}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.resultName, isRTL && styles.textRTL]}
              numberOfLines={1}
            >
              {item.displayName}
            </Text>
            <Text
              style={[styles.resultSubtitle, isRTL && styles.textRTL]}
              numberOfLines={1}
            >
              {item.displaySubtitle}
            </Text>
            {item.price && (
              <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
                {hasDiscount ? (
                  <>
                    <Text style={styles.resultPrice}>
                      {finalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                    </Text>
                    <Text style={styles.originalPriceCrossed}>
                      {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                    </Text>
                    {discountPercent > 0 && (
                      <View style={styles.discountBadgeMini}>
                        <Text style={styles.discountBadgeMiniText}>-{discountPercent}%</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.resultPrice}>
                    {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Arrow Button */}
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => handleResultPress(item)}
            activeOpacity={0.8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const isLoading = servicesLoading || occasionsLoading;

  const filterTabs = [
    { key: 'all', labelAr: 'الكل', labelEn: 'All' },
    { key: 'services', labelAr: 'الخدمات', labelEn: 'Services' },
    { key: 'occasions', labelAr: 'المناسبات', labelEn: 'Occasions' },
  ];

  // Trending: featured first, then sorted by rating desc, take top 8
  const trendingServices = React.useMemo(() => {
    if (!services) return [];
    return [...services]
      .sort((a, b) => {
        if (b.isFeatured !== a.isFeatured) return b.isFeatured ? 1 : -1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 8);
  }, [services]);

  const renderTrendingCard = ({ item }: { item: any }) => {
    const { hasDiscount, finalPrice } = getServicePriceInfo(item);
    return (
      <TouchableOpacity
        style={[styles.trendingCard, isRTL && styles.trendingCardRTL]}
        onPress={() => onSelectService && onSelectService(item._id)}
        activeOpacity={0.75}
      >
        {/* Image */}
        <View style={styles.trendingImageWrapper}>
          {item.images?.[0] ? (
            <Image
              source={{ uri: getServiceImageUrl(item.images[0]) }}
              style={styles.trendingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.trendingImagePlaceholder}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                  stroke={colors.primary}
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              </Svg>
            </View>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>★</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[styles.trendingInfo, isRTL && styles.trendingInfoRTL]}>
          <Text style={[styles.trendingName, isRTL && styles.textRTL]} numberOfLines={1}>
            {isRTL ? item.nameAr : item.name}
          </Text>
          <Text style={[styles.trendingVendor, isRTL && styles.textRTL]} numberOfLines={1}>
            {item.vendor?.name || ''}
          </Text>
          <View style={[styles.trendingMeta, isRTL && styles.trendingMetaRTL]}>
            {item.rating > 0 && (
              <View style={[styles.ratingRow, isRTL && styles.ratingRowRTL]}>
                <Text style={styles.ratingStarText}>★</Text>
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
            {hasDiscount ? (
              <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
                <Text style={styles.trendingPrice}>
                  {finalPrice.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                </Text>
                <Text style={styles.originalPriceCrossed}>
                  {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
                </Text>
              </View>
            ) : (
              <Text style={styles.trendingPrice}>
                {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
              </Text>
            )}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.trendingArrow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
              stroke="#FFFFFF"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNoResults = () => (
    <View style={styles.centerContent}>
      <View style={styles.emptyIconWrapper}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="7" stroke={colors.primary} strokeWidth={1.5} opacity={0.5} />
          <Path d="M21 21L16.5 16.5" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
          <Path d="M8.5 11.5h5" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
        </Svg>
      </View>
      <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>
        {isRTL ? 'لا توجد نتائج' : 'No Results Found'}
      </Text>
      <Text style={[styles.emptySubtitle, isRTL && styles.textRTL]}>
        {isRTL ? `لم نجد نتائج لـ "${searchQuery}"` : `No results for "${searchQuery}"`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle="dark-content"
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            isRTL && styles.headerRTL,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.backButtonInner}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isRTL ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
                  stroke={colors.primaryDark}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIconSvg}>
              <Circle cx="11" cy="11" r="7" stroke={colors.primary} strokeWidth={2} />
              <Path d="M21 21L16.5 16.5" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={[styles.searchInput, isRTL && styles.searchInputRTL]}
              placeholder={isRTL ? 'ابحث عن خدمات أو مناسبات...' : 'Search services, occasions...'}
              placeholderTextColor={colors.primary + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              selectionColor={colors.primary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.clearButtonInner}>
                  <Text style={styles.clearButtonText}>×</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Filter Chips ── */}
        <Animated.View
          style={[
            styles.filtersWrapper,
            isRTL && styles.filtersWrapperRTL,
            { opacity: fadeAnim },
          ]}
        >
          {filterTabs.map(tab => {
            const isActive = searchType === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSearchType(tab.key as any)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {isRTL ? tab.labelAr : tab.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── Results / Trending Area ── */}
        <View style={styles.resultsContainer}>
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </Text>
            </View>
          ) : searchQuery.trim() === '' ? (
            /* ── Trending Section (no query) ── */
            <FlatList
              data={trendingServices}
              renderItem={renderTrendingCard}
              keyExtractor={item => `trending-${item._id}`}
              contentContainerStyle={styles.trendingList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={[styles.trendingHeader, isRTL && styles.trendingHeaderRTL]}>
                  <View style={styles.trendingTitleRow}>
                    <Text style={[styles.trendingTitle, isRTL && styles.textRTL]}>
                      {isRTL ? 'الأكثر طلباً' : 'Top Picks'}
                    </Text>
                  </View>
                  <Text style={[styles.trendingSubtitle, isRTL && styles.textRTL]}>
                    {isRTL ? 'خدمات مميزة بأعلى تقييم' : 'Featured & highest rated services'}
                  </Text>
                </View>
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : filteredResults.length > 0 ? (
            /* ── Search Results ── */
            <>
              <View style={[styles.resultsHeader, isRTL && styles.resultsHeaderRTL]}>
                <Text style={[styles.resultsCount, isRTL && styles.textRTL]}>
                  {isRTL
                    ? `${filteredResults.length} نتيجة`
                    : `${filteredResults.length} result${filteredResults.length > 1 ? 's' : ''}`}
                </Text>
              </View>
              <FlatList
                data={filteredResults}
                renderItem={renderSearchResult}
                keyExtractor={item => `${item.type}-${item._id}`}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </>
          ) : renderNoResults()}
        </View>

      </SafeAreaView>
    </View>
  );
};

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconSvg: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 17 : 15,
    color: colors.primaryDark,
    padding: 0,
    fontWeight: '500',
  },
  searchInputRTL: {
    textAlign: 'right',
  },
  clearButton: {
    marginLeft: 8,
  },
  clearButtonInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: -2,
  },

  // ── Filter Chips ──
  filtersWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  filtersWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipText: {
    fontSize: isTablet ? 15 : 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // ── Results Area ──
  resultsContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  resultsHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  resultsCount: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  resultsList: {
    paddingHorizontal: 14,
    paddingBottom: isTablet ? 140 : 110,
  },
  separator: {
    height: 10,
  },

  // ── Result Card ──
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultCardRTL: {
    flexDirection: 'row-reverse',
  },

  // Image
  resultImageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultImage: {
    width: isTablet ? 80 : 68,
    height: isTablet ? 80 : 68,
    borderRadius: 14,
  },
  resultImagePlaceholder: {
    width: isTablet ? 80 : 68,
    height: isTablet ? 80 : 68,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionPlaceholder: {
    backgroundColor: colors.primaryLight + '60',
  },

  // Content
  resultContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  resultContentRTL: {
    marginLeft: 8,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  badgeRowRTL: {
    flexDirection: 'row-reverse',
  },
  typeBadge: {
    backgroundColor: colors.primary + '20',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  occasionBadge: {
    backgroundColor: '#FF6B6B20',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultName: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: isTablet ? 15 : 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // Arrow Button
  arrowButton: {
    width: isTablet ? 42 : 36,
    height: isTablet ? 42 : 36,
    borderRadius: isTablet ? 14 : 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },

  // Empty State
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: isTablet ? 15 : 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },


  // RTL
  textRTL: {
    textAlign: 'right',
  },

  // ── Trending Section ──
  trendingList: {
    paddingHorizontal: 14,
    paddingBottom: isTablet ? 140 : 110,
  },
  trendingHeader: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 4,
  },
  trendingHeaderRTL: {
    alignItems: 'flex-end',
  },
  trendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trendingTitle: {
    fontSize: isTablet ? 22 : 19,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.2,
  },
  trendingSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Trending Card
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendingCardRTL: {
    flexDirection: 'row-reverse',
  },
  trendingImageWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  trendingImage: {
    width: isTablet ? 76 : 64,
    height: isTablet ? 76 : 64,
    borderRadius: 14,
  },
  trendingImagePlaceholder: {
    width: isTablet ? 76 : 64,
    height: isTablet ? 76 : 64,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trendingInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  trendingInfoRTL: {
    marginLeft: 8,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  trendingName: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  trendingVendor: {
    fontSize: isTablet ? 13 : 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendingMetaRTL: {
    flexDirection: 'row-reverse',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingRowRTL: {
    flexDirection: 'row-reverse',
  },
  ratingStarText: {
    fontSize: 11,
    color: '#F59E0B',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  trendingPrice: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
    color: colors.primary,
  },
  trendingArrow: {
    width: isTablet ? 38 : 32,
    height: isTablet ? 38 : 32,
    borderRadius: isTablet ? 12 : 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceRowRTL: {
    flexDirection: 'row-reverse',
  },
  originalPriceCrossed: {
    fontSize: isTablet ? 12 : 10,
    color: '#999999',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountBadgeMini: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  discountBadgeMiniText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default Search;
