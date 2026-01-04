import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (screenWidth: number) => {
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const horizontalPadding = 16;
  const totalGap = (numColumns - 1) * 16;
  const cardWidth = (screenWidth - (horizontalPadding * 2) - totalGap) / numColumns;
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  backButtonRTL: {
    left: undefined,
    right: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  titleRTL: {
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
})
};
