import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (screenWidth: number) => {
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const horizontalPadding = 16;
  const totalGap = (numColumns - 1) * 16;
  const cardWidth =
    (screenWidth - horizontalPadding * 2 - totalGap) / numColumns;

  return StyleSheet.create({
    pageContainer: {
      flex: 1,
      backgroundColor: colors.backgroundHome,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRTL: {
      flexDirection: 'row-reverse',
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0, 161, 156, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
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
      paddingBottom: isTablet ? 160 : 110,
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
      height: isTablet ? 200 : 130,
      backgroundColor: colors.backgroundCard,
      overflow: 'hidden',
      borderRadius: 16,
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
      padding: 8,
      minHeight: isTablet ? 180 : 105,
    },
    serviceName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 4,
      minHeight: 20,
    },
    serviceNameRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    vendorName: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    vendorNameRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    serviceDescription: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 16,
      marginBottom: 6,
      minHeight: 32,
      flex: 1,
    },
    serviceDescriptionRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    priceRatingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 4,
      marginTop: 'auto',
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
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      gap: 2,
      flexShrink: 0,
    },
    ratingRowRTL: {
      flexDirection: 'row-reverse',
    },
    rating: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: 'bold',
    },
    reviews: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
    },
    priceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    priceContainerRTL: {
      alignItems: 'flex-end',
    },
    priceLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    priceLabelRTL: {
      textAlign: 'right',
    },
    priceValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    priceValueRTL: {
      textAlign: 'right',
    },
    originalPrice: {
      fontSize: 12,
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
