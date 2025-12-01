import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { Service, getServiceImageUrl } from '../../services/servicesApi';

interface ServicesProps {
  onSelectService?: (service: Service) => void;
  onViewAll?: () => void;
}

const Services: React.FC<ServicesProps> = ({ onSelectService, onViewAll }) => {
  const { isRTL } = useLanguage();
  const { data: services, isLoading, error } = useServices();

  const renderServiceCard = ({ item }: { item: Service }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const displayDescription = isRTL ? item.descriptionAr : item.description;
    
    // Try to get image URL
    let imageUrl = null;
    if (item.images && item.images.length > 0) {
      imageUrl = getServiceImageUrl(item.images[0]);
    }
    
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
              onError={(e) => {}}
              onLoad={() => {}}
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
              {isRTL ? `${item.price.toFixed(3)} د.ك` : `${item.price.toFixed(3)} KD`}
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
    <View style={styles.container}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
        <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
          {isRTL ? 'الخدمات الشائعة' : 'TRENDING'}
        </Text>
        <TouchableOpacity onPress={() => {
          onViewAll && onViewAll();
        }}>
          <Text style={[styles.viewAllButton, isRTL && styles.viewAllButtonRTL]}>
            {isRTL ? 'عرض الكل' : 'View All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.horizontalList, isRTL && styles.horizontalListRTL]}
        inverted={isRTL}
      />
    </View>
  );
};

export default Services;
