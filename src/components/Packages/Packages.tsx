import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePackages } from '../../hooks/usePackages';
import { getImageUrl } from '../../services/api';
import { getServiceReviews } from '../../services/reviewsApi';

export interface Package {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  occasion: string;
  vendor: any;
  service: any;
  customPrice: number;
  additionalServices: Array<{
    service: string;
    customPrice: number;
    _id: string;
  }>;
  totalPrice: number;
  discountPrice: number;
  isActive: boolean;
  images: string[];
  rating: number;
  totalReviews: number;
  createdAt: string;
}

interface PackagesProps {
  onSelectPackage?: (pkg: Package) => void;
  onBack?: () => void;
}

const Packages: React.FC<PackagesProps> = ({ onSelectPackage, onBack }) => {
  const { isRTL, t } = useLanguage();
  const { data: packages, isLoading, error } = usePackages();
  const [packageRatings, setPackageRatings] = useState<{
    [key: string]: { rating: number; totalReviews: number };
  }>({});

  // Load ratings for all packages
  useEffect(() => {
    const loadRatings = async () => {
      if (!packages) return;

      const ratingsData: {
        [key: string]: { rating: number; totalReviews: number };
      } = {};

      for (const pkg of packages) {
        if (pkg.service?._id) {
          try {
            const reviewsData = await getServiceReviews(pkg.service._id, 1, 1);
            ratingsData[pkg._id] = {
              rating: reviewsData.stats.averageRating || 0,
              totalReviews: reviewsData.stats.totalRatings || 0,
            };
          } catch (error) {
            ratingsData[pkg._id] = { rating: 0, totalReviews: 0 };
          }
        }
      }

      setPackageRatings(ratingsData);
    };

    loadRatings();
  }, [packages]);

  const renderPackageCard = ({ item }: { item: Package }) => {
    const displayName = isRTL ? item.nameAr : item.name;
    const displayDescription = isRTL ? item.descriptionAr : item.description;
    const displayPrice =
      item.discountPrice > 0 ? item.discountPrice : item.totalPrice;

    // Get rating from loaded data
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
                {Math.round(
                  ((item.totalPrice - item.discountPrice) / item.totalPrice) *
                    100,
                )}
                % OFF
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
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, isRTL && styles.backButtonRTL]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isRTL ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {isRTL ? 'الباقات' : 'Packages'}
          </Text>
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
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, isRTL && styles.backButtonRTL]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isRTL ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {isRTL ? 'الباقات' : 'Packages'}
          </Text>
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
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d={isRTL ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {isRTL ? 'الباقات' : 'Packages'}
        </Text>
      </View>

      <FlatList
        data={packages}
        renderItem={renderPackageCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Packages;
