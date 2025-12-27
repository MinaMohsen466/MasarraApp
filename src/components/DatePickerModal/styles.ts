import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (SCREEN_WIDTH: number, SCREEN_HEIGHT: number) => {
  const isTablet = SCREEN_WIDTH >= 600;
  const modalWidth = isTablet ? Math.min(SCREEN_WIDTH * 0.7, 500) : Math.min(SCREEN_WIDTH - 40, 400);
  const maxModalHeight = isTablet ? SCREEN_HEIGHT * 0.75 : SCREEN_HEIGHT * 0.7;
  
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
    padding: isTablet ? 24 : 16,
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
    marginBottom: 20,
    paddingBottom: 16,
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
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
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
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarScroll: {
    maxHeight: isTablet ? 350 : 280,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginVertical: 2,
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
    fontSize: 14,
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
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  slotsTextSelected: {
    color: colors.textWhite,
  },
  fullText: {
    fontSize: 9,
    color: '#D32F2F',
    fontWeight: '600',
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
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
