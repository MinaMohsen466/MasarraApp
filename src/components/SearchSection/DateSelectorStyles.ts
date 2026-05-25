import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

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
    width: width * 0.78,
    maxWidth: 360,
    overflow: 'hidden',
  },
  dateHeader: {
    backgroundColor: colors.primary,
    padding: 16,
    paddingVertical: 18,
  },
  yearText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.textWhite,
  },
  calendarContainer: {
    padding: 12,
    paddingBottom: 6,
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
    width: 34,
    height: 34,
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
    paddingVertical: 6,
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
    padding: 12,
    paddingTop: 6,
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  okButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  okButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
