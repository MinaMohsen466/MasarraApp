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
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
      flex: 1,
      textAlign: 'center',
    },
    titleRTL: {
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
      backgroundColor: colors.background,
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
    textRTL: {
      textAlign: 'right',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    listContainer: {
      padding: 8,
      paddingBottom: isTablet ? 160 : 110,
    },
    row: {
      justifyContent: 'flex-start',
      paddingHorizontal: 8,
      gap: 8,
    },
    packageCard: {
      width: cardWidth,
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      marginBottom: 16,
      marginHorizontal: 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    packageImageContainer: {
      width: '100%',
      height: 150,
      position: 'relative',
    },
    packageImage: {
      width: '100%',
      height: '100%',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.border,
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    discountText: {
      color: colors.background,
      fontSize: 10,
      fontWeight: 'bold',
    },
    packageInfo: {
      padding: 8,
    },
    packageName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    packageNameRTL: {
      textAlign: 'right',
    },
    packageDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
      minHeight: 36,
    },
    packageDescriptionRTL: {
      textAlign: 'right',
    },
    priceRatingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    priceRatingRowRTL: {
      flexDirection: 'row-reverse',
    },
    priceColumn: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    packagePrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 2,
    },
    originalPrice: {
      fontSize: 12,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      gap: 2,
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
  });
};
