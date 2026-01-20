import React, { useState, useEffect } from 'react';
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
  const [searchType, setSearchType] = useState<
    'all' | 'services' | 'occasions'
  >('all');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    // Search in services
    if (searchType === 'all' || searchType === 'services') {
      services?.forEach(service => {
        const nameMatch = service.name?.toLowerCase().includes(query);
        const nameArMatch = service.nameAr?.toLowerCase().includes(query);
        const descMatch = service.description?.toLowerCase().includes(query);
        const descArMatch = service.descriptionAr
          ?.toLowerCase()
          .includes(query);
        const vendorMatch = service.vendor?.name?.toLowerCase().includes(query);

        if (
          nameMatch ||
          nameArMatch ||
          descMatch ||
          descArMatch ||
          vendorMatch
        ) {
          results.push({
            ...service,
            type: 'service',
            displayName: isRTL ? service.nameAr : service.name,
            displaySubtitle:
              service.vendor?.name || (isRTL ? 'خدمة' : 'Service'),
            image: service.images?.[0],
          });
        }
      });
    }

    // Search in occasions
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
      onSelectOccasion({
        ...item,
        name: item.name,
        nameAr: item.nameAr,
        _id: item._id,
      });
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.resultCard, isRTL && styles.resultCardRTL]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.resultImageWrapper}>
        {item.image ? (
          <Image
            source={{
              uri:
                item.type === 'service'
                  ? getServiceImageUrl(item.image)
                  : item.image,
            }}
            style={styles.resultImage}
          />
        ) : (
          <View style={styles.resultImagePlaceholder}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                stroke={colors.primary}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
        {/* Type Badge */}
        <View style={[styles.typeBadge, item.type === 'occasion' && styles.occasionBadge]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'service' ? (isRTL ? 'خدمة' : 'Service') : (isRTL ? 'مناسبة' : 'Occasion')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.resultContent, isRTL && styles.resultContentRTL]}>
        <Text style={[styles.resultName, isRTL && styles.textRTL]} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={[styles.resultSubtitle, isRTL && styles.textRTL]} numberOfLines={1}>
          {item.displaySubtitle}
        </Text>
        {item.price && (
          <Text style={styles.resultPrice}>
            {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
          </Text>
        )}
      </View>

      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
            stroke="#BDBDBD"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );

  const isLoading = servicesLoading || occasionsLoading;

  const filterTabs = [
    { key: 'all', labelAr: 'الكل', labelEn: 'All' },
    { key: 'services', labelAr: 'الخدمات', labelEn: 'Services' },
    { key: 'occasions', labelAr: 'المناسبات', labelEn: 'Occasions' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Search */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d={isRTL ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
                stroke="#212121"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
              <Circle cx="11" cy="11" r="7" stroke="#9E9E9E" strokeWidth={2} />
              <Path d="M21 21L16.5 16.5" stroke="#9E9E9E" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={[styles.searchInput, isRTL && styles.searchInputRTL]}
              placeholder={isRTL ? 'ابحث عن خدمات، مناسبات...' : 'Search services, occasions...'}
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
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
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filtersWrapper, isRTL && styles.filtersWrapperRTL]}>
          {filterTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterChip,
                searchType === tab.key && styles.filterChipActive,
              ]}
              onPress={() => setSearchType(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  searchType === tab.key && styles.filterChipTextActive,
                ]}
              >
                {isRTL ? tab.labelAr : tab.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Results Area */}
        <View style={styles.resultsContainer}>
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                {isRTL ? 'جاري البحث...' : 'Searching...'}
              </Text>
            </View>
          ) : searchQuery.trim() === '' ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyTitle}>
                {isRTL ? 'ابدأ البحث' : 'Start Searching'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isRTL
                  ? 'ابحث عن خدمات، مناسبات، أو مقدمي خدمات'
                  : 'Search for services, occasions, or vendors'}
              </Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyTitle}>
                {isRTL ? 'لا توجد نتائج' : 'No Results Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isRTL
                  ? `لم نجد أي نتائج لـ "${searchQuery}"`
                  : `We couldn't find any results for "${searchQuery}"`}
              </Text>
            </View>
          ) : (
            <>
              {/* Results Count */}
              <View style={styles.resultsHeader}>
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
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
    padding: 0,
    fontWeight: '400',
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
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: -1,
  },
  filtersWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filtersWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  resultsContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#757575',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  resultsList: {
    paddingBottom: isTablet ? 120 : 100,
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  resultCardRTL: {
    flexDirection: 'row-reverse',
  },
  resultImageWrapper: {
    position: 'relative',
  },
  resultImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  resultImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    backgroundColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  occasionBadge: {
    backgroundColor: '#FF6B6B',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  resultContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  resultContentRTL: {
    marginLeft: 8,
    marginRight: 14,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  textRTL: {
    textAlign: 'right',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Search;
