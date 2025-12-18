import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Show 2 full cards + small piece of 3rd card (2.3 cards visible)
const CARD_WIDTH = (SCREEN_WIDTH - 0) / 2.3;

export const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: colors.backgroundHome,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  sectionTitleRTL: {
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewAllButton: {
    fontSize: 14,
    color: colors.textWhite,
    fontWeight: '700',
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewAllButtonRTL: {
    textAlign: 'left',
  },
  filterSortContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterSortContainerRTL: {
    flexDirection: 'row-reverse',
  },
  filterSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  filterSortButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  textRTL: {
    textAlign: 'right',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  horizontalListRTL: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  serviceCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.textWhite,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 170,
    backgroundColor: colors.backgroundLight,
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
    fontSize: 14,
  },
  infoContainer: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  serviceNameRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    minHeight: 40,
  },
  serviceDescriptionRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceContainerRTL: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  priceLabelRTL: {
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  priceValueRTL: {
    textAlign: 'right',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  originalPriceRTL: {
    textAlign: 'right',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
