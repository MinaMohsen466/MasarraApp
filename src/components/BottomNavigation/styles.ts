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
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: 16,
    paddingBottom: isTablet ? 24 : 18,
    borderTopWidth: 0,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 16 : 12,
    minWidth: isTablet ? 70 : 50,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  navItemActive: {
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.textWhite,
    fontSize: 9,
    fontWeight: '700',
  },
});
