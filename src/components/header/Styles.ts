import { StyleSheet, ImageStyle } from 'react-native';
import { colors } from '../../constants/colors';

// Image styles defined separately to avoid type issues
export const imageStyles = {
  logoImage: {
    height: 84,
    width: 84,
    tintColor: colors.primary,
  } as ImageStyle,
  profileIcon: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
};

export const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.backgroundHome,
  },
  menuButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // RTL menu rotation (flip icon for Arabic)
  menuButtonRTL: {
    transform: [{ rotate: '180deg' }, { scaleY: -1 }],
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  // RTL Styles
  headerContainerRTL: {
    flexDirection: 'row-reverse',
  },
});
