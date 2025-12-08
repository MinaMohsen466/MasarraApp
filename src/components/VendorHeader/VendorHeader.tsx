import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import { Vendor } from '../../services/vendorsApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_BASE_URL } from '../../config/api.config';
import { colors } from '../../constants/colors';

interface Occasion {
  _id: string;
  name: string;
  nameAr: string;
}

interface VendorHeaderProps {
  vendor: Vendor;
  occasions?: Occasion[];
  onFilterPress?: () => void;
  onSortPress?: () => void;
  overrideRating?: number;
  overrideTotalReviews?: number;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ vendor, occasions = [], onFilterPress, onSortPress, overrideRating, overrideTotalReviews }) => {
  const { isRTL } = useLanguage();
  const [imageError, setImageError] = React.useState(false);
  const rating = overrideRating !== undefined ? overrideRating : (vendor.vendorProfile?.rating || 0);
  const totalReviews = overrideTotalReviews !== undefined ? overrideTotalReviews : (vendor.vendorProfile?.totalReviews || 0);
  const description = isRTL 
    ? vendor.vendorProfile?.description_ar 
    : vendor.vendorProfile?.description;
  const businessName = isRTL 
    ? vendor.vendorProfile?.businessName_ar 
    : vendor.vendorProfile?.businessName;

  // Generate letter avatar if no image
  // profilePicture is inside vendorProfile
  const vendorImage = vendor.vendorProfile?.profilePicture || vendor.profilePicture || vendor.image;
  const imageUrl = vendorImage ? (vendorImage.startsWith('http') ? vendorImage : `${API_BASE_URL}${vendorImage}`) : null;
  const letterAvatar = vendor.name.charAt(0).toUpperCase();

  const renderStars = () => {
    if (rating === 0) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalfStar) stars += '★';
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    return stars;
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Main Card Container */}
      <View style={styles.card}>
        {/* Top Row: Image and Info */}
        <View style={[styles.topRow, isRTL && styles.topRowRTL]}>
          {/* Vendor Image */}
          <View style={styles.imageContainer}>
            {imageUrl && !imageError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.vendorImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.letterAvatar}>
                <Text style={styles.letterAvatarText}>{letterAvatar}</Text>
              </View>
            )}
          </View>

          {/* Vendor Info */}
          <View style={[styles.infoContainer, isRTL && styles.infoContainerRTL]}>
            {/* Vendor Name/Business Name */}
            <Text style={[styles.vendorName, isRTL && styles.textRTL]} numberOfLines={2}>
              {businessName || vendor.name}
            </Text>

            {/* Occasions Tags */}
            {occasions && occasions.length > 0 && (
              <View style={[styles.occasionsTags, isRTL && styles.occasionsTagsRTL]}>
                {occasions.slice(0, 2).map((occ, index) => (
                  <Text 
                    key={occ._id} 
                    style={[styles.occasionTag, isRTL && styles.textRTL]}>
                    {isRTL ? occ.nameAr : occ.name}
                    {index < occasions.slice(0, 2).length - 1 && ', '}
                  </Text>
                ))}
                {occasions.length > 2 && (
                  <Text style={[styles.occasionTag, isRTL && styles.textRTL]}>
                    ...
                  </Text>
                )}
              </View>
            )}

            {/* Rating and Reviews */}
            <View style={[styles.ratingContainer, isRTL && styles.ratingContainerRTL]}>
              <Text style={[styles.ratingText, isRTL && styles.textRTL]}>
                {renderStars()}
              </Text>
              <Text style={[styles.reviewsText, isRTL && styles.textRTL]}>
                {totalReviews > 0 ? `${rating.toFixed(1)} (${totalReviews} ${isRTL ? 'تقييم' : 'reviews'})` : (isRTL ? 'لا توجد تقييمات' : 'No reviews yet')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description Section - Separate */}
      {description && (
        <View style={styles.descriptionSection}>
          <Text 
            style={[styles.description, isRTL && styles.textRTL]} 
            numberOfLines={4}>
            {description}
          </Text>
        </View>
      )}

      {/* Filter and Sort Buttons */}
      <View style={[styles.filterSortContainer, isRTL && styles.filterSortContainerRTL]}>
        <TouchableOpacity 
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={onFilterPress}>
          <Text style={[styles.filterButtonText, isRTL && styles.textRTL]}>
            {isRTL ? 'تصفية' : 'Filter'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton}
          activeOpacity={0.7}
          onPress={onSortPress}>
          <Text style={[styles.sortButtonText, isRTL && styles.textRTL]}>
            {isRTL ? 'ترتيب' : 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VendorHeader;
