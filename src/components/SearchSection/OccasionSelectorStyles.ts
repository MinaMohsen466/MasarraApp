import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  modalOverlay: {
    // Handled by common BottomSheet wrapper
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalContentRTL: {
    // Handled dynamically
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  modalHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalTitleRTL: {
    textAlign: 'right',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  flatListStyle: {
    maxHeight: 380, // Cap vertical height so it fits beautifully inside bottom sheet
  },
  occasionsList: {
    paddingBottom: 16,
    gap: 8,
  },
  occasionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  occasionItemSelected: {
    backgroundColor: 'rgba(0, 161, 156, 0.08)',
    borderColor: colors.primary,
  },
  occasionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  occasionItemContentRTL: {
    flexDirection: 'row-reverse',
  },
  occasionItemText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
    textAlign: 'left',
  },
  occasionItemTextActive: {
    color: colors.primary,
  },
  occasionItemTextRTL: {
    textAlign: 'right',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
});
