import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (SCREEN_WIDTH: number, SCREEN_HEIGHT: number) => {
  const isTablet = SCREEN_WIDTH >= 600;
  const modalWidth = isTablet
    ? Math.min(SCREEN_WIDTH * 0.7, 500)
    : Math.min(SCREEN_WIDTH - 40, 400);
  const maxModalHeight = isTablet ? SCREEN_HEIGHT * 0.75 : SCREEN_HEIGHT * 0.7;

  const paddingSize = isTablet ? 18 : 12;
  const maxCalendarWidth = modalWidth - paddingSize * 2 - 4;
  const cellWidth = 34;
  const cellMarginHorizontal = Math.floor(
    (maxCalendarWidth - cellWidth * 7) / 14,
  );
  const calendarWidth = cellWidth * 7 + cellMarginHorizontal * 14;

  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: modalWidth,
      maxWidth: isTablet ? 500 : 400,
      maxHeight: maxModalHeight,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: paddingSize,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    navButton: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.backgroundLight,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textDark,
    },
    dayNamesRow: {
      flexDirection: 'row',
      marginBottom: 6,
      width: calendarWidth,
      alignSelf: 'center',
    },
    dayNameCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
    },
    dayNameText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    calendarScroll: {
      maxHeight: isTablet ? 320 : 250,
      width: calendarWidth,
      alignSelf: 'center',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      width: calendarWidth,
      alignSelf: 'center',
    },
    dayCell: {
      width: cellWidth,
      height: cellWidth,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      marginVertical: 4,
      marginHorizontal: cellMarginHorizontal,
    },
    dayCellSelected: {
      backgroundColor: colors.primary,
    },
    dayCellPast: {
      opacity: 0.3,
    },
    dayCellFull: {
      backgroundColor: '#FFE5E5',
    },
    dayText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textDark,
    },
    dayTextSelected: {
      color: colors.textWhite,
    },
    dayTextPast: {
      color: colors.textSecondary,
    },
    dayTextFull: {
      color: '#D32F2F',
    },
    slotsText: {
      fontSize: 8,
      color: colors.textSecondary,
      marginTop: 1,
    },
    slotsTextSelected: {
      color: colors.textWhite,
    },
    fullText: {
      fontSize: 8,
      color: '#D32F2F',
      fontWeight: '600',
      marginTop: 1,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    closeButton: {
      marginTop: 12,
      padding: 10,
      backgroundColor: colors.backgroundLight,
      borderRadius: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
};
