import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

export const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.backgroundLight,
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
    backgroundColor: colors.backgroundLight,
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
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: colors.backgroundLight,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundLight,
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
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceContainerRTL: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
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
    writingDirection: 'rtl',
  },
});
