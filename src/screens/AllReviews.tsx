import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';
import { Review, ReviewStats } from '../services/reviewsApi';
import { getImageUrl } from '../services/api';
import { colors } from '../constants/colors';

interface AllReviewsProps {
  reviews: Review[];
  reviewStats: ReviewStats;
  serviceName: string;
  onBack: () => void;
}

const AllReviews: React.FC<AllReviewsProps> = ({
  reviews,
  reviewStats,
  serviceName,
  onBack,
}) => {
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const { isRTL } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}
              stroke={colors.primary}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {isRTL ? 'التقييمات' : 'Reviews'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Dimensions.get('window').width >= 600 ? 120 : 20,
        }}>
        {/* Service Name */}
        <View style={styles.serviceNameContainer}>
          <Text style={[styles.serviceName, isRTL && styles.serviceNameRTL]}>
            {serviceName}
          </Text>
        </View>

        {/* Review Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statsLeft}>
            <Text style={styles.averageRating}>
              {reviewStats.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.starsText}>
              {'★'.repeat(Math.round(reviewStats.averageRating))}
              {'☆'.repeat(5 - Math.round(reviewStats.averageRating))}
            </Text>
            <Text style={styles.totalReviews}>
              {reviewStats.totalRatings} {isRTL ? 'تقييم' : 'reviews'}
            </Text>
          </View>

          {/* Rating Distribution */}
          <View style={styles.statsRight}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                reviewStats.ratingDistribution[
                  star as keyof typeof reviewStats.ratingDistribution
                ] || 0;
              const percentage =
                reviewStats.totalRatings > 0
                  ? (count / reviewStats.totalRatings) * 100
                  : 0;
              return (
                <View key={star} style={styles.distributionRow}>
                  <Text style={styles.distributionStar}>{star}★</Text>
                  <View style={styles.distributionBar}>
                    <View
                      style={[
                        styles.distributionFill,
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              {/* Header: Avatar + Name + Date + Rating in one row */}
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUserSection}>
                  {review.user.profilePicture && !imageErrors.has(review._id) ? (
                    <Image
                      source={{ uri: getImageUrl(review.user.profilePicture) }}
                      style={styles.avatar}
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(review._id));
                      }}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {review.user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfoColumn}>
                    <View style={styles.nameAndDateRow}>
                      <Text
                        style={[styles.userName, isRTL && styles.userNameRTL]}
                        numberOfLines={1}>
                        {review.user.name}
                      </Text>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString(
                          isRTL ? 'ar-EG' : 'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </Text>
                    </View>
                    {review.isVerifiedPurchase && (
                      <Text style={styles.verifiedBadge}>
                        ✓ {isRTL ? 'مشترٍ موثق' : 'Verified'}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>
                    {review.rating.toFixed(1)}★
                  </Text>
                </View>
              </View>

              {/* Comment */}
              <Text style={[styles.comment, isRTL && styles.commentRTL]}>
                {review.comment}
              </Text>

              {/* Vendor Reply */}
              {review.vendorReply && (
                <View style={styles.vendorReply}>
                  <Text style={styles.vendorReplyLabel}>
                    {isRTL ? 'رد البائع:' : 'Vendor Reply:'}
                  </Text>
                  <Text
                    style={[
                      styles.vendorReplyText,
                      isRTL && styles.vendorReplyTextRTL,
                    ]}>
                    {review.vendorReply.text}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerTitleRTL: {
    fontFamily: 'Arial',
  },
  placeholder: {
    width: 40,
  },
  serviceNameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundLight,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'left',
  },
  serviceNameRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    minWidth: 100,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  starsText: {
    fontSize: 18,
    color: colors.primary,
    marginTop: 4,
  },
  totalReviews: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  distributionStar: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 28,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 11,
    color: colors.textSecondary,
    width: 24,
    textAlign: 'right',
  },
  reviewsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  userInfoColumn: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: '50%',
  },
  userNameRTL: {
    fontFamily: 'Arial',
  },
  separator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textWhite,
  },
  comment: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    textAlign: 'left',
  },
  commentRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
  vendorReply: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  vendorReplyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  vendorReplyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'left',
  },
  vendorReplyTextRTL: {
    textAlign: 'right',
    fontFamily: 'Arial',
  },
});

export default AllReviews;
