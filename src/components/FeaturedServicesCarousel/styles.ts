import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const styles = StyleSheet.create({
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: isTablet ? 340 : 260,
    position: 'relative',
    paddingVertical: isTablet ? 20 : 16,
  },
  loadingContainer: {
    width: SCREEN_WIDTH,
    height: isTablet ? 300 : 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundHome,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: isTablet ? 300 : 208,
    paddingHorizontal: isTablet ? 40 : 24,
  },
  imageCard: {
    width: '100%',
    height: '100%',
    borderRadius: isTablet ? 20 : 16,
    overflow: 'hidden',
    backgroundColor: colors.backgroundHome,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  placeholderSlide: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  pagination: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: isTablet ? 20 : 8,
  },
  paginationDot: {
    height: isTablet ? 12 : 8,
    borderRadius: isTablet ? 6 : 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
