import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.textWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.5,
    paddingTop: 16,
    paddingBottom: 16,
  },
  modalContentRTL: {
    // No specific RTL adjustments needed for this modal
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionsList: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  occasionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  occasionItemSelected: {
    backgroundColor: '#E8F5F4',
    borderColor: colors.primary,
  },
  occasionItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occasionItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  occasionItemTextRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
});
