import { StyleSheet } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const createStyles = (screenWidth: number) => {
  const isTablet = screenWidth >= 600;
  const numColumns = isTablet ? 3 : 2;
  const horizontalPadding = 12;
  const gap = 10;
  const totalGap = (numColumns - 1) * gap;
  const cardWidth =
    (screenWidth - horizontalPadding * 2 - totalGap) / numColumns;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundCard,
    },
    cleanHeaderBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: 'transparent',
      zIndex: 2,
    },
    cleanHeaderBarRTL: {
      flexDirection: 'row-reverse',
    },
    headerBackButtonCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
      borderWidth: 1,
      borderColor: 'rgba(44, 95, 93, 0.15)',
    },
    headerBarTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0F172A',
      textAlign: 'center',
      flex: 1,
    },
    headerBarTitleRTL: {
      fontFamily: 'System',
    },
    headerSpacer: {
      width: 42,
    },
    list: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
    },
    listContent: {
      paddingBottom: 96,
      paddingTop: 12,
    },
    row: {
      justifyContent: 'flex-start',
      gap: gap,
      marginBottom: 0,
    },
    rowRTL: {
      flexDirection: 'row-reverse',
    },
    cardVertical: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: gap + 2,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      width: cardWidth,
      borderWidth: 1,
      borderColor: 'rgba(44, 95, 93, 0.12)',
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
      paddingHorizontal: 16,
    },
    pageBodyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primaryDark,
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 16,
      textAlign: 'left',
    },
    pageBodyTitleRTL: {
      fontFamily: 'System',
      textAlign: 'right',
    },
  });
};

export default createStyles;
