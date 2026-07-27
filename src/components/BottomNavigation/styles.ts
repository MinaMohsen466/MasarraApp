import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#E8F0F0',
    paddingTop: isTablet ? 6 : 4,
    paddingBottom: isTablet ? 18 : 10,
    paddingHorizontal: isTablet ? 24 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
    // No border radius — flat bottom edge, curves only on the header
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    width: isTablet ? 56 : 44,
    height: isTablet ? 56 : 44,
    borderRadius: isTablet ? 28 : 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    opacity: 0.78,
  },
  iconWrapperActive: {
    backgroundColor: colors.primary + '2C',
    borderRadius: isTablet ? 28 : 22,
    opacity: 1,
  },
  // Cart badge
  cartBadge: {
    position: 'absolute',
    top: isTablet ? 10 : 6,
    right: isTablet ? 8 : 4,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 10 : 9.5,
    minWidth: isTablet ? 20 : 17,
    height: isTablet ? 20 : 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#E8F0F0',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 11 : 9.5,
    fontWeight: '800',
    lineHeight: isTablet ? 14 : 12,
  },
});
