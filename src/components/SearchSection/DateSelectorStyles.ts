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
    borderRadius: 20,
    width: width * 0.85,
    maxWidth: 300,
    padding: 14,
    shadowColor: '#1F4644',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  dateHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 11,
    color: '#64748B', // Slate-500
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark || '#1F4644',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  monthHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B', // Slate-800
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B', // Slate-500
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dayCell: {
    width: '14.28%', // exactly 1/7th of grid width
    aspectRatio: 1, // make cells square
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayCellBg: {
    width: 28,
    height: 28,
    borderRadius: 14, // circle
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectedDayCellBg: {
    backgroundColor: colors.primary || '#00a19c',
  },
  todayDayCellBg: {
    borderWidth: 1.5,
    borderColor: colors.primary || '#00a19c',
  },
  dayText: {
    fontSize: 12,
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
    marginTop: 8,
    gap: 8,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B', // Slate-500
  },
  okButton: {
    backgroundColor: colors.primary || '#00a19c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: colors.primary || '#00a19c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  okButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
