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
    paddingBottom: 8,
  },
  paginationDot: {
    width: isTablet ? 10 : 8,
    height: isTablet ? 10 : 8,
    borderRadius: isTablet ? 5 : 4,
    backgroundColor: colors.textSecondary,
    opacity: 0.4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: isTablet ? 10 : 8,
    opacity: 1,
  },
});
