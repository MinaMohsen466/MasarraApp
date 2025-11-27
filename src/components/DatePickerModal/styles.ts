import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
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
    maxHeight: 380,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 12,
    marginVertical: 4,
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
