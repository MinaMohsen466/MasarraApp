import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (SCREEN_WIDTH: number) => {
  const isTablet = SCREEN_WIDTH >= 600;
  const imageHeight = isTablet ? 500 : 380;

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
      backgroundColor: colors.backgroundLight,
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
      width: 44,
      height: 44,
      borderRadius: 0,
      justifyContent: 'center',
      alignItems: 'center',
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
      top: 16,
      right: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    discountText: {
      color: colors.textWhite,
      fontSize: 14,
      fontWeight: 'bold',
    },
    paginationContainer: {
      position: 'absolute',
      bottom: 16,
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
      padding: 20,
    },
    packageBadgeContainer: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginBottom: 12,
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
      marginBottom: 8,
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
    
    // Reviews Section
    reviewsContainer: {
      marginTop: 20,
    },
    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    viewAllButton: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    viewAllText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    reviewCard: {
      backgroundColor: colors.backgroundCard,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    reviewerInfo: {
      flex: 1,
    },
    reviewerName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    reviewDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    reviewRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reviewRatingValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
    },
    reviewRatingStar: {
      fontSize: 12,
      color: colors.primary,
    },
    reviewComment: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    noReviewsText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 20,
    },
    reviewRatingLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      width: 25,
    },
    reviewRatingBar: {
      flex: 1,
      height: 8,
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    reviewRatingFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    reviewRatingPercentage: {
      fontSize: 12,
      color: colors.textSecondary,
      width: 35,
      textAlign: 'right',
    },
    reviewRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    reviewStatsContainer: {
      backgroundColor: colors.backgroundCard,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      flexDirection: 'row',
    },
    reviewStatsLeft: {
      alignItems: 'center',
      paddingRight: 20,
      borderRightWidth: 1,
      borderColor: '#e0e0e0',
    },
    reviewStatsAverageRating: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
    },
    reviewStatsStars: {
      fontSize: 18,
      color: colors.primary,
      marginVertical: 4,
    },
    reviewStatsTotalText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    reviewStatsRight: {
      flex: 1,
      paddingLeft: 20,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    userAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userAvatarText: {
      color: colors.textWhite,
      fontSize: 18,
      fontWeight: 'bold',
    },
    userInfoRow: {
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
    dateSeparator: {
      fontSize: 12,
      color: '#999',
      marginHorizontal: 6,
    },
    reviewDateText: {
      fontSize: 12,
      color: '#999',
    },
    verifiedBadge: {
      fontSize: 11,
      color: colors.primary,
      marginTop: 2,
    },
    vendorReplyContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    vendorReplyTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    vendorReplyText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    showMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: colors.backgroundCard,
      borderRadius: 8,
      marginTop: 8,
    },
    showMoreText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    showMoreIcon: {
      marginLeft: 8,
    },
    
    // Bottom Actions
    bottomActions: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundLight,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    addToCartButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    addToCartButtonDisabled: {
      backgroundColor: '#ccc',
    },
    addToCartButtonText: {
      color: colors.textWhite,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    addToCartIcon: {
      marginRight: 8,
    },
    backButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
      marginBottom: 10,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    flyingIconContainer: {
      position: 'absolute',
      zIndex: 9999,
    },
  });
};
