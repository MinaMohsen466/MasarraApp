import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (SCREEN_WIDTH: number) => {
  const isTablet = SCREEN_WIDTH >= 600;
  const imageHeight = isTablet ? 480 : 380;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Loading & Error
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      color: colors.textPrimary,
      fontSize: 16,
      marginBottom: 20,
    },
    errorButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    errorButtonText: {
      color: colors.textWhite,
      fontSize: 16,
      fontWeight: '600',
    },

    // Header Actions
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      backgroundColor: 'transparent',
      zIndex: 50,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
    },
    headerRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
    },
    headerButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      flexShrink: 1,
      maxWidth: SCREEN_WIDTH - 150,
    },

    // ScrollView Content
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 56,
    },

    // Image Gallery
    imageGalleryContainer: {
      position: 'relative',
    },
    galleryImage: {
      width: SCREEN_WIDTH,
      height: imageHeight,
    },
    discountBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    discountText: {
      color: colors.textWhite,
      fontSize: 14,
      fontWeight: 'bold',
    },
    paginationContainer: {
      position: 'absolute',
      bottom: 36,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    paginationDot: {
      height: 8,
      borderRadius: 4,
    },
    paginationDotInactive: {
      width: 8,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },

    // Package Info Section
    infoSection: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -24,
    },
    packageNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    packageBadgeContainer: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    packageBadgeText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 12,
    },
    packageName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    packageDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    vendorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    vendorText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    priceRatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    originalPrice: {
      fontSize: 14,
      color: '#999',
      textDecorationLine: 'line-through',
    },
    currentPrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    ratingValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: 'bold',
    },
    ratingStar: {
      fontSize: 14,
      color: colors.primary,
    },
    ratingCount: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },

    // Date & Time Selection
    dateTimeSection: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 14,
      marginTop: 0,
      marginBottom: 20,
    },
    dateTimeTitle: {
      alignSelf: 'center',
      backgroundColor: colors.background,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 12,
      letterSpacing: 0.6,
    },
    dateTimeInputsContainer: {
      width: '100%',
      backgroundColor: 'transparent',
      borderRadius: 8,
      paddingBottom: 6,
    },
    dateTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    dateTimeIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1.4,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    dateTimeIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1.4,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateTimeText: {
      flex: 1,
      fontSize: 15,
      color: colors.textDark,
      fontWeight: '500',
    },
    availabilityButton: {
      alignSelf: 'center',
      backgroundColor: colors.primaryDark,
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 22,
      marginTop: 4,
    },
    availabilityText: {
      color: colors.textWhite,
      fontSize: 14,
      fontWeight: '700',
    },
    unavailableText: {
      color: '#ff3b30',
      fontSize: 14,
      marginTop: 8,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: '#e0e0e0',
      marginVertical: 20,
    },

    // Section Title
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 12,
    },

    // Description Section
    descriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },

    // Service Card
    serviceCard: {
      backgroundColor: colors.backgroundCard,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    serviceCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    serviceCardContent: {
      flex: 1,
    },
    serviceCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    serviceCardPrice: {
      fontSize: 14,
      color: colors.primary,
    },
    serviceCardExpanded: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    serviceCardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    serviceImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginRight: 8,
    },

    // Main Service specific
    mainServiceCard: {
      backgroundColor: colors.backgroundCard,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },

    // Reviews Section Styles
    reviewsSection: {
      marginTop: 20,
      marginBottom: 16,
    },
    reviewsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    reviewsTitleRTL: {
      textAlign: 'right',
      fontFamily: 'Arial',
    },
    reviewStatsCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      marginBottom: 16,
    },
    averageRatingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingRight: 16,
    },
    averageRatingNumber: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.primary,
    },
    averageRatingStars: {
      fontSize: 18,
      color: colors.primary,
      marginVertical: 4,
    },
    averageRatingText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    ratingDistribution: {
      flex: 2,
      paddingLeft: 16,
    },
    distributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    distributionStar: {
      width: 30,
      fontSize: 12,
      color: colors.textSecondary,
    },
    distributionBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginHorizontal: 8,
      overflow: 'hidden',
    },
    distributionFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    distributionCount: {
      width: 30,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    reviewsListHorizontal: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 6,
      paddingHorizontal: 2,
    },
    reviewCardHorizontal: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 12,
      padding: 10,
      width: SCREEN_WIDTH * 0.58,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    reviewUserInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      gap: 8,
      marginRight: 12,
    },
    reviewUserAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    reviewUserAvatarPlaceholder: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reviewUserAvatarText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '600',
    },
    reviewUserName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    verifiedBadge: {
      fontSize: 11,
      color: colors.success,
      marginTop: 2,
    },
    reviewRating: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    reviewRatingText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    reviewComment: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 4,
    },
    reviewCommentRTL: {
      textAlign: 'right',
      fontFamily: 'Arial',
    },
    reviewDate: {
      fontSize: 12,
      color: '#999',
    },
    vendorReply: {
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
    },
    vendorReplyLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    vendorReplyText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    vendorReplyTextRTL: {
      textAlign: 'right',
      fontFamily: 'Arial',
    },
    showMoreReviewsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.primary,
      marginTop: 16,
      marginHorizontal: 16,
    },
    showMoreReviewsText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 0.3,
    },

    // Bottom Actions
    bottomActions: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addToCartButton: {
      backgroundColor: colors.primaryDark,
      borderRadius: 12,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    addToCartButtonText: {
      color: colors.textWhite,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    backButtonBottom: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    flyingIconContainer: {
      position: 'absolute',
      zIndex: 9999,
    },
  });
};
