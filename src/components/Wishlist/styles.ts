import { StyleSheet, Dimensions } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const createStyles = (screenWidth: number) => {
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const horizontalPadding = 12;
  const gap = 10;
  const totalGap = (numColumns - 1) * gap;
  const cardWidth = (screenWidth - (horizontalPadding * 2) - totalGap) / numColumns;

  return StyleSheet.create({
    container: { flex: 1, padding: horizontalPadding, backgroundColor: colors.background },
    list: { flex: 1 },
    listContent: { paddingBottom: 96 },
    row: {
      justifyContent: 'flex-start',
      gap: gap,
      marginBottom: 0,
    },
    rowRTL: {
      flexDirection: 'row-reverse',
    },
    header: {
      fontWeight: '700',
      fontSize: isTablet ? 20 : 18,
      marginBottom: 12,
      flex: 1,
      textAlign: 'center',
      color: colors.textDark,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
      width: '100%',
      justifyContent: 'flex-start',
    },
    backInline: {
      marginRight: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      color: colors.textWhite,
      fontSize: 28,
      lineHeight: 20,
      fontWeight: '700',
    },
    cardVertical: {
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: gap,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      width: cardWidth,
    },
    cardImageVertical: {
      width: '100%',
      height: isTablet ? 140 : 110,
      backgroundColor: colors.backgroundLight,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    cardBodyVertical: { padding: isTablet ? 12 : 10 },
    cardTitle: {
      fontWeight: '700',
      color: colors.primaryDark,
      marginBottom: 4,
      fontSize: isTablet ? 15 : 13,
    },
    cardVendor: {
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
      fontSize: isTablet ? 12 : 10,
    },
    cardDesc: {
      color: colors.textSecondary,
      marginBottom: 8,
      fontSize: isTablet ? 12 : 10,
      lineHeight: isTablet ? 16 : 14,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    cardPrice: {
      color: colors.primaryDark,
      fontWeight: '700',
      fontSize: isTablet ? 14 : 12,
    },
    removeBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.backgroundLight,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    removeText: { fontSize: 12, color: colors.error },
    heartBtn: {
      width: isTablet ? 36 : 32,
      height: isTablet ? 36 : 32,
      borderRadius: 10,
      backgroundColor: colorUtils.addOpacity(colors.primary, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
    },
    heartIcon: { fontSize: 18, color: colors.primary, fontWeight: '700' },
    footerNote: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.backgroundLight,
      borderRadius: 8,
    },
    footerCount: { fontWeight: '700', marginBottom: 6, color: colors.textDark },
    footerNoteText: { color: colors.textLight },
    emptyContainer: {
      flex: 1,
      paddingTop: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      color: colors.textDark,
    },
    emptyNote: { color: colors.textLight },
    emptyBodyCentered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default createStyles;
