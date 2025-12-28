import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 8,
    width: width * 0.85,
    maxWidth: 400,
    overflow: 'hidden',
  },
  dateHeader: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingVertical: 24,
  },
  yearText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 28,
    fontWeight: '400',
    color: colors.textWhite,
  },
  calendarContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  navButton: {
    padding: 8,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 24,
    color: colors.textDark,
    fontWeight: '300',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    borderRadius: 50,
  },
  dayText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '400',
  },
  selectedDayText: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  pastDayCell: {
    opacity: 0.3,
  },
  pastDayText: {
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  okButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  okButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
