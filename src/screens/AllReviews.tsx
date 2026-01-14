import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Review, ReviewStats, deleteReview } from '../services/reviewsApi';
import { getImageUrl } from '../services/api';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert/CustomAlert';

interface AllReviewsProps {
  reviews: Review[];
  reviewStats: ReviewStats;
  serviceName: string;
  onBack: () => void;
  onReviewDeleted?: () => void;
}

const AllReviews: React.FC<AllReviewsProps> = ({
  reviews,
  reviewStats,
  serviceName,
  onBack,
  onReviewDeleted,
}) => {
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const { isRTL } = useLanguage();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  // Get current user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
    };
    getUserId();
  }, []);



  const handleDeleteReview = (review: Review) => {
    setAlertConfig({
      visible: true,
      title: isRTL ? 'حذف التقييم' : 'Delete Review',
      message: isRTL
        ? 'هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this review? This action cannot be undone.',
      buttons: [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteReview(review._id);
              setAlertConfig({
                visible: true,
                title: isRTL ? 'تم الحذف' : 'Deleted',
                message: isRTL ? 'تم حذف تقييمك بنجاح' : 'Your review has been deleted successfully',
                buttons: [{
                  text: isRTL ? 'حسناً' : 'OK',
                  style: 'default',
                  onPress: () => {
                    if (onReviewDeleted) {
                      onReviewDeleted();
                    }
                  }
                }],
              });
            } catch (error: any) {
              setAlertConfig({
                visible: true,
                title: isRTL ? 'خطأ' : 'Error',
                message: error.message || (isRTL ? 'فشل حذف التقييم' : 'Failed to delete review'),
                buttons: [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }],
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d={isRTL ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
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
        }}
      >
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
            {[5, 4, 3, 2, 1].map(star => {
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
          {reviews.map(review => (
            <View key={review._id} style={styles.reviewCard}>
              {/* Header: Avatar + Name + Date + Rating + Delete in one row */}
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUserSection}>
                  {review.user.profilePicture &&
                    !imageErrors.has(review._id) ? (
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
                        numberOfLines={1}
                      >
                        {review.user.name}
                      </Text>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString(
                          isRTL ? 'ar-EG' : 'en-US',
                          { month: 'short', day: 'numeric' },
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

              {/* Comment with Delete Button in same row */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text style={[styles.comment, isRTL && styles.commentRTL, { flex: 1 }]}>
                  {review.comment}
                </Text>

                {/* Delete Button - Only show for current user's reviews */}
                {currentUserId && review.user._id === currentUserId && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReview(review)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#e57373" />
                    ) : (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                          stroke="#e57373"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                )}
              </View>

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
                    ]}
                  >
                    {review.vendorReply.text}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
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
  // Delete button styles
  deleteButton: {
    marginLeft: 8,
    padding: 6,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 6,
  },
});

export default AllReviews;
