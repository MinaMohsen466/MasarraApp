import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (screenWidth: number) => {
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const horizontalPadding = 16;
  const totalGap = (numColumns - 1) * 16;
  const cardWidth = (screenWidth - (horizontalPadding * 2) - totalGap) / numColumns;

  return StyleSheet.create({
    pageContainer: {
      flex: 1,
      backgroundColor: colors.backgroundHome,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.backgroundHome,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRTL: {
      flexDirection: 'row-reverse',
    },
    backButton: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
    },
    backButtonRTL: {
      transform: [{ scaleX: -1 }],
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
      flex: 1,
      textAlign: 'center',
    },
    headerTitleRTL: {
      letterSpacing: 0,
    },
    headerSpacer: {
      width: 40,
    },
    filterSortContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.backgroundHome,
    },
    filterSortContainerRTL: {
      flexDirection: 'row-reverse',
    },
    filterSortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: colors.primary,
      backgroundColor: '#fff',
      width: 'auto',
      justifyContent: 'center',
    },
    filterSortButtonText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      paddingBottom: 100,
    },
    row: {
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    rowRTL: {
      flexDirection: 'row-reverse',
    },
    serviceCard: {
      width: cardWidth,
      backgroundColor: colors.backgroundCard,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    imageContainer: {
      width: '100%',
      height: 150,
      backgroundColor: colors.backgroundCard,
      overflow: 'hidden',
      position: 'relative',
    },
    serviceImage: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.backgroundLight,
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    discountText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    infoContainer: {
      padding: 12,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 4,
    },
    serviceNameRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    vendorName: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    vendorNameRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    serviceDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 16,
      minHeight: 32,
    },
    serviceDescriptionRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    priceRatingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: isTablet ? 8 : 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: isTablet ? 8 : 4,
      flexWrap: 'wrap',
    },
    priceRatingRowRTL: {
      flexDirection: 'row-reverse',
    },
    priceColumn: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: 1,
      minWidth: 0,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: isTablet ? 6 : 4,
      paddingVertical: isTablet ? 3 : 2,
      borderRadius: 6,
      gap: 1,
      flexShrink: 0,
    },
    ratingRowRTL: {
      flexDirection: 'row-reverse',
    },
    rating: {
      fontSize: isTablet ? 12 : 11,
      color: colors.primary,
      fontWeight: 'bold',
    },
    reviews: {
      fontSize: isTablet ? 10 : 9,
      color: colors.primary,
      fontWeight: '600',
    },
    priceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingTop: isTablet ? 8 : 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    priceContainerRTL: {
      alignItems: 'flex-end',
    },
    priceLabel: {
      fontSize: isTablet ? 10 : 9,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    priceLabelRTL: {
      textAlign: 'right',
    },
    priceValue: {
      fontSize: isTablet ? 14 : 13,
      fontWeight: '700',
      color: colors.primary,
    },
    priceValueRTL: {
      textAlign: 'right',
    },
    originalPrice: {
      fontSize: isTablet ? 12 : 11,
      fontWeight: '600',
      color: '#999',
      textDecorationLine: 'line-through',
    },
    originalPriceRTL: {
      textAlign: 'right',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundLight,
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.error,
      marginBottom: 8,
    },
    errorSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    textRTL: {
      textAlign: 'right',
    },
  });
};
