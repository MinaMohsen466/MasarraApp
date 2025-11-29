import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { Service, getServiceImageUrl } from '../../services/servicesApi';
import { Vendor, fetchVendors } from '../../services/vendorsApi';
import { getServiceReviews } from '../../services/reviewsApi';
import VendorHeader from '../VendorHeader/VendorHeader';
import SortModal from '../SortModal/SortModal';
import FilterModal from '../FilterModal/FilterModal';

interface ServicesPageProps {
  onSelectService?: (service: Service) => void;
  onBack?: () => void;
  vendorId?: string; // Optional vendor filter
  vendorName?: string; // Optional vendor name for display
  occasionId?: string; // Optional occasion filter
  occasionName?: string; // Optional occasion name for display
}

const ServicesPage: React.FC<ServicesPageProps> = ({
  onSelectService,
  onBack,
  vendorId,
  vendorName,
  occasionId,
  occasionName,
}) => {
  const { isRTL } = useLanguage();
  const { data: services, isLoading, error } = useServices();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filters, setFilters] = useState<{ minPrice?: number; maxPrice?: number; bookingType?: string }>({});
  const [vendorRating, setVendorRating] = useState<{ rating: number; totalReviews: number }>({ rating: 0, totalReviews: 0 });

  // Fetch vendor rating from reviews API
  useEffect(() => {
    if (!services || !vendorId) return;
    
    const vendorServices = services.filter(s => s.vendor?._id === vendorId);
    if (vendorServices.length === 0) return;

    const fetchAllReviews = async () => {
      let totalRating = 0;
      let totalReviewsCount = 0;

      for (const service of vendorServices) {
        try {
          const reviewsData = await getServiceReviews(service._id, 1, 1000);
          if (reviewsData.stats.totalRatings > 0) {
            totalRating += reviewsData.stats.averageRating * reviewsData.stats.totalRatings;
            totalReviewsCount += reviewsData.stats.totalRatings;
          }
        } catch (error) {
          // Silently handle error
        }
      }

      const averageRating = totalReviewsCount > 0 ? Math.round((totalRating / totalReviewsCount) * 10) / 10 : 0;
      setVendorRating({ rating: averageRating, totalReviews: totalReviewsCount });
    };

    fetchAllReviews();
  }, [services, vendorId]);

  // Fetch vendor details when vendorId is provided
  useEffect(() => {
    if (!vendorId || vendor) return;
    
    setLoadingVendor(true);
    fetchVendors()
      .then((vendors) => {
        const found = vendors.find(v => v._id === vendorId);
        if (found) setVendor(found);
      })
      .catch(() => {})
      .finally(() => setLoadingVendor(false));
  }, [vendorId, vendor]);

  // Filter services by vendor or occasion
  const filteredServices = useMemo(() => {
    let result = services;
    
    if (vendorId) {
      result = result?.filter(service => service.vendor?._id === vendorId);
    }
    
    if (occasionId) {
      result = result?.filter(service => 
        service.occasions.some(occ => occ.occasion._id === occasionId)
      );
    }
    
    return result;
  }, [services, vendorId, occasionId]);

  // Extract unique occasions from filtered vendor services
  const vendorOccasions = useMemo(() => {
    if (vendorId && filteredServices && filteredServices.length > 0) {
      const occasions = new Map<string, { _id: string; name: string; nameAr: string }>();
      
      filteredServices.forEach(service => {
        service.occasions.forEach(occ => {
          if (occ.occasion && !occasions.has(occ.occasion._id)) {
            occasions.set(occ.occasion._id, {
              _id: occ.occasion._id,
              name: occ.occasion.name,
              nameAr: occ.occasion.nameAr || occ.occasion.name
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
        const minOk = filters.minPrice === undefined || price >= filters.minPrice;
        const maxOk = filters.maxPrice === undefined || price <= filters.maxPrice;
        return minOk && maxOk;
      });
    }

    // Apply booking type filter
    if (filters.bookingType) {
      result = result.filter(service => service.bookingType === filters.bookingType);
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
    const imageUrl = item.images && item.images.length > 0 
      ? getServiceImageUrl(item.images[0]) 
      : null;
    
    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onSelectService && onSelectService(item)}
        activeOpacity={0.8}>
        
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
        </View>

        {/* Service Info */}
        <View style={styles.infoContainer}>
          {/* Service Name */}
          <Text 
            style={[styles.serviceName, isRTL && styles.serviceNameRTL]} 
            numberOfLines={1}>
            {displayName}
          </Text>

          {/* Vendor Name */}
          {item.vendor && (
            <Text 
              style={[styles.vendorName, isRTL && styles.vendorNameRTL]} 
              numberOfLines={1}>
              {item.vendor.name}
            </Text>
          )}

          {/* Service Description */}
          <Text 
            style={[styles.serviceDescription, isRTL && styles.serviceDescriptionRTL]} 
            numberOfLines={2}>
            {displayDescription}
          </Text>

          {/* Price */}
          <View style={[styles.priceContainer, isRTL && styles.priceContainerRTL]}>
            <Text style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}>
              {isRTL ? 'السعر يبدأ من' : 'Price starts from'}
            </Text>
            <Text style={[styles.priceValue, isRTL && styles.priceValueRTL]}>
              {item.price.toFixed(3)} {isRTL ? 'د.ك' : 'KD'} {isRTL ? 'يومياً' : 'per day'}
            </Text>
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
          activeOpacity={0.7}>
          <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none">
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
        <View style={[styles.filterSortContainer, isRTL && styles.filterSortContainerRTL]}>
          <TouchableOpacity 
            onPress={() => setShowFilter(true)}
            style={styles.filterSortButton}>
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
            style={styles.filterSortButton}>
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
      )}

      {/* Services Grid */}
      <FlatList
        data={sortedAndFilteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
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
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
              {isRTL ? 'لا توجد خدمات لهذا المورد' : 'No services for this vendor'}
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
