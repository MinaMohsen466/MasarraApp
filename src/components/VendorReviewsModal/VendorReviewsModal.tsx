import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { styles } from './styles';
import { useLanguage } from '../../contexts/LanguageContext';
import { Review } from '../../services/reviewsApi';
import { getImageUrl } from '../../services/api';

export interface ExtendedReview extends Review {
  serviceName?: string;
  serviceNameAr?: string;
}

interface VendorReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  vendorName: string;
  rating: number;
  totalReviews: number;
  reviews: ExtendedReview[];
  ratingDistribution?: { [key: number]: number };
  isLoading?: boolean;
}

export const VendorReviewsModal: React.FC<VendorReviewsModalProps> = ({
  visible,
  onClose,
  vendorName,
  rating,
  totalReviews,
  reviews,
  ratingDistribution,
  isLoading = false,
}) => {
  const { isRTL } = useLanguage();

  if (!visible) return null;

  const renderStars = (score: number) => {
    if (score <= 0) return '☆☆☆☆☆';
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalfStar) stars += '★';
    const emptyStars = 5 - Math.ceil(score);
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    return stars;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Compute distribution if not provided
  const dist = ratingDistribution || {
    5: reviews.filter(r => Math.round(r.rating) === 5).length,
    4: reviews.filter(r => Math.round(r.rating) === 4).length,
    3: reviews.filter(r => Math.round(r.rating) === 3).length,
    2: reviews.filter(r => Math.round(r.rating) === 2).length,
    1: reviews.filter(r => Math.round(r.rating) === 1).length,
  };

  const renderReviewCard = ({ item }: { item: ExtendedReview }) => {
    const userName = item.user?.name || (isRTL ? 'مستخدم مسرة' : 'Masarra User');
    const userAvatar = item.user?.profilePicture;
    const initial = userName.charAt(0).toUpperCase();

    return (
      <View style={styles.reviewCard}>
        {/* Top row: Avatar, Name, Rating */}
        <View style={[styles.cardTopRow, isRTL && styles.cardTopRowRTL]}>
          <View style={[styles.userInfo, isRTL && styles.userInfoRTL]}>
            <View style={styles.userAvatar}>
              {userAvatar ? (
                <Image
                  source={{ uri: getImageUrl(userAvatar) }}
                  style={styles.userAvatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, isRTL && styles.textRTL]}>
                {userName}
              </Text>
              <Text style={[styles.reviewDate, isRTL && styles.textRTL]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <Text style={styles.reviewStars}>{renderStars(item.rating)}</Text>
        </View>

        {/* Comment Text */}
        {item.comment ? (
          <Text style={[styles.commentText, isRTL && styles.textRTL]}>
            {item.comment}
          </Text>
        ) : null}

        {/* Simpler, smaller Vendor Reply */}
        {item.vendorReply && item.vendorReply.text ? (
          <View style={[styles.vendorReplyBox, isRTL && styles.vendorReplyBoxRTL]}>
            <Text style={[styles.vendorReplyTitle, isRTL && styles.textRTL]}>
              {isRTL ? 'رد المزود:' : 'Vendor Reply:'}
            </Text>
            <Text style={[styles.vendorReplyText, isRTL && styles.textRTL]}>
              {item.vendorReply.text}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.fullScreenContainer} edges={['top', 'left', 'right', 'bottom']}>
        <View style={s.contentWrapper}>
          {/* Header Row */}
          <View style={[s.headerRow, isRTL && s.headerRowRTL]}>
            <View>
              <Text style={[s.headerTitle, isRTL && s.textRTL]}>
                {isRTL ? 'تقييمات وآراء العملاء' : 'Customer Reviews'}
              </Text>
              <Text style={[s.headerSubtitle, isRTL && s.textRTL]}>
                {vendorName}
              </Text>
            </View>

            <TouchableOpacity style={s.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#334155"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Rating Summary Card */}
          <View style={[s.summaryContainer, isRTL && s.summaryContainerRTL]}>
            <View style={s.scoreSection}>
              <Text style={s.scoreNumber}>{rating > 0 ? rating.toFixed(1) : '0.0'}</Text>
              <Text style={s.starsRow}>{renderStars(rating)}</Text>
              <Text style={s.totalReviewsLabel}>
                {totalReviews} {isRTL ? 'تقييم' : 'reviews'}
              </Text>
            </View>

            <View style={s.barsSection}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = dist[star] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <View
                    key={star}
                    style={[s.distributionRow, isRTL && s.distributionRowRTL]}
                  >
                    <Text style={s.starLabel}>{star}★</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.countLabel}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* List of Reviews */}
          {isLoading ? (
            <View style={s.emptyContainer}>
              <ActivityIndicator size="large" color="#00a19c" />
            </View>
          ) : (
            <FlatList
              data={reviews}
              renderItem={renderReviewCard}
              keyExtractor={item => item._id}
              contentContainerStyle={s.reviewsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.emptyContainer}>
                  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#94A3B8"
                      strokeWidth={1.5}
                    />
                    <Path
                      d="M8 12H16M12 8V16"
                      stroke="#94A3B8"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text style={s.emptyTitle}>
                    {isRTL ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                  </Text>
                  <Text style={s.emptySubtitle}>
                    {isRTL
                      ? 'لم يقم أي عميل بتقييم خدمات هذا المزود حتى الآن'
                      : 'No customers have reviewed this vendor services yet'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const s = styles;
