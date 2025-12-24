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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
      // Pass the full occasion object with both name and nameAr
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
      style={[styles.resultItem, isRTL && styles.resultItemRTL]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View
        style={[
          styles.resultImageContainer,
          isRTL && styles.resultImageContainerRTL,
        ]}
      >
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
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.resultContent, isRTL && styles.resultContentRTL]}>
        <Text style={[styles.resultName, isRTL && styles.resultNameRTL]}>
          {item.displayName}
        </Text>
        <Text
          style={[styles.resultSubtitle, isRTL && styles.resultSubtitleRTL]}
        >
          {item.displaySubtitle}
        </Text>
        {item.price && (
          <Text style={styles.resultPrice}>
            {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'}
          </Text>
        )}
      </View>

      {/* Arrow */}
      <Svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        style={{ marginLeft: 8 }}
      >
        <Path
          d={isRTL ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );

  const isLoading = servicesLoading || occasionsLoading;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundHome }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        edges={['top', 'bottom']}
      >
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, isRTL && styles.backButtonRTL]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isRTL ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <View style={styles.searchInputContainer}>
              <Svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                style={styles.searchIcon}
              >
                <Path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="#9E9E9E"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <TextInput
                style={[styles.searchInput, isRTL && styles.searchInputRTL]}
                placeholder={
                  isRTL
                    ? 'ابحث عن خدمات، مناسبات...'
                    : 'Search services, occasions...'
                }
                placeholderTextColor="#9E9E9E"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                searchType === 'all' && styles.filterTabActive,
              ]}
              onPress={() => setSearchType('all')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  searchType === 'all' && styles.filterTabTextActive,
                ]}
              >
                {isRTL ? 'الكل' : 'All'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                searchType === 'services' && styles.filterTabActive,
              ]}
              onPress={() => setSearchType('services')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  searchType === 'services' && styles.filterTabTextActive,
                ]}
              >
                {isRTL ? 'الخدمات' : 'Services'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                searchType === 'occasions' && styles.filterTabActive,
              ]}
              onPress={() => setSearchType('occasions')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  searchType === 'occasions' && styles.filterTabTextActive,
                ]}
              >
                {isRTL ? 'المناسبات' : 'Occasions'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : searchQuery.trim() === '' ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {isRTL ? 'ابدأ البحث...' : 'Start searching...'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isRTL
                  ? 'ابحث عن خدمات، مناسبات، أو مقدمي خدمات'
                  : 'Search for services, occasions, or vendors'}
              </Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {isRTL ? 'لا توجد نتائج' : 'No results found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isRTL
                  ? `لم نجد أي نتائج لـ "${searchQuery}"`
                  : `We couldn't find any results for "${searchQuery}"`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredResults}
              renderItem={renderSearchResult}
              keyExtractor={item => `${item.type}-${item._id}`}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundHome,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.backgroundHome,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
    padding: 0,
  },
  searchInputRTL: {
    textAlign: 'right',
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#9E9E9E',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.backgroundHome,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  noResultsIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultsList: {
    paddingVertical: 8,
    paddingBottom: Dimensions.get('window').width >= 600 ? 120 : 80,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultItemRTL: {
    flexDirection: 'row-reverse',
  },
  resultImageContainer: {
    marginRight: 12,
  },
  resultImageContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  resultImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    marginRight: 12,
  },
  resultContentRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  resultNameRTL: {
    textAlign: 'right',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  resultSubtitleRTL: {
    textAlign: 'right',
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default Search;
