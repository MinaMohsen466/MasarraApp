import { StyleSheet, ImageStyle } from 'react-native';
import { colors } from '../../constants/colors';

export const imageStyles = {
  logoImage: {
    height: 60,
    width: 60,
    tintColor: '#FFFFFF',
  } as ImageStyle,
  profilePhoto: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
  } as ImageStyle,
};

export const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    marginBottom: 0,
  },
  headerBgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  leftSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rightSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 210,
  },
  profileRing: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(0, 55, 53, 0.55)',
    backgroundColor: 'transparent',
  },
  profileInner: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal styles for full text display on tap
  textModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  textModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  textModalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  textModalBody: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '600',
  },
});
