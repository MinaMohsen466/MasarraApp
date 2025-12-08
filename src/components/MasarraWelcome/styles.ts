import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundHome,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  titleRTL: {
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  subtitleRTL: {
    fontFamily: 'System',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  browseButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  getStartedButton: {
    backgroundColor: colors.backgroundHome,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  getStartedButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
