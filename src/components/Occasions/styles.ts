import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (screenWidth: number, numColumns: number) => {
  const isTablet = screenWidth >= 600;
  const horizontalPadding = isTablet ? 40 : 16;
  const totalGaps = (numColumns - 1) * 4;
  const cardWidth = (screenWidth - (horizontalPadding * 2) - totalGaps) / numColumns;
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 0,
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
    fontSize: isTablet ? 20 : 18,
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
  listContent: {
    paddingHorizontal: isTablet ? 40 : 16,
    paddingVertical: isTablet ? 28 : 20,
  },
  row: {
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  occasionCard: {
    width: cardWidth,
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: cardWidth - 16,
    height: cardWidth - 16,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTablet ? 14 : 12,
    marginBottom: isTablet ? 12 : 8,
  },
  occasionImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
  },
  occasionText: {
    color: colors.textDark,
    fontSize: isTablet ? 14 : 12,
    fontWeight: isTablet ? '700' : '600',
    textAlign: 'center',
    marginTop: isTablet ? 4 : 2,
    width: '100%',
  },
  occasionTextRTL: {
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
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  });
};
