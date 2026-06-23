import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 44;

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
    width: width * 0.85,
    maxWidth: 340,
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
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC', // Sleek slate backdrop
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: ITEM_HEIGHT * 5, // 220 pixels high, fits exactly 5 items
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 8,
  },
  selectionBar: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    top: ITEM_HEIGHT * 2, // Centered in the middle (3rd row)
    left: 8,
    right: 8,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.primary || '#00a19c',
    backgroundColor: 'rgba(0, 161, 156, 0.05)',
    borderRadius: 8,
  },
  columnWrapper: {
    flex: 1,
    height: '100%',
  },
  columnDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  itemWrapper: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#64748B', // Slate-500 (unselected)
    fontWeight: '600',
  },
  selectedItemText: {
    fontSize: 18,
    color: colors.primary || '#00a19c', // Primary theme color
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
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
