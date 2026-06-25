import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 70, 68, 0.4)', // Soft dark teal overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: width * 0.9,
    maxWidth: 350,
    padding: 20,
    shadowColor: '#1F4644',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  dateHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    color: '#64748B', // Slate-500
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark || '#1F4644',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B', // Slate-800
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledArrowButton: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B', // Slate-500
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayCell: {
    width: '14.28%', // exactly 1/7th of grid width
    aspectRatio: 1, // make cells square
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayCellBg: {
    width: '85%',
    height: '85%',
    borderRadius: 9999, // circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCellBg: {
    backgroundColor: colors.primary || '#00a19c',
  },
  todayDayCellBg: {
    borderWidth: 1.5,
    borderColor: colors.primary || '#00a19c',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155', // Slate-700
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: colors.primary || '#00a19c',
    fontWeight: '700',
  },
  disabledDayText: {
    color: '#CBD5E1', // Slate-300
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B', // Slate-500
  },
  okButton: {
    backgroundColor: colors.primary || '#00a19c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.primary || '#00a19c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  okButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
