import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

// width not used; removed

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
  backButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: 60,
  },
  backButtonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonRTL: {
    transform: [{ scaleX: -1 }],
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textWhite,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroTitleRTL: {
    letterSpacing: 0,
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.textWhite,
    opacity: 0.9,
    textAlign: 'center',
    letterSpacing: 1,
  },
  contentContainer: {
    padding: 0,
    paddingBottom: 50,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 100,
    minHeight: 400,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 28,
    color: colors.textDark,
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  contentTextRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
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
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
