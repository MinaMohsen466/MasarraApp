import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  modalOverlay: {
    // Handled by common BottomSheet wrapper
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  modalContentRTL: {
    // Handled dynamically
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalTitleRTL: {
    textAlign: 'right',
  },
  closeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  searchContainerRTL: {
    flexDirection: 'row-reverse',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    paddingVertical: 0,
    textAlign: 'left',
  },
  searchInputRTL: {
    textAlign: 'right',
  },
  clearSearchButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListStyle: {
    maxHeight: 380, // Cap vertical height so it fits beautifully inside bottom sheet
  },
  occasionsList: {
    paddingBottom: 10,
    gap: 6,
  },
  occasionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
    gap: 10,
  },
  occasionItemContentRTL: {
    flexDirection: 'row-reverse',
  },
  occasionItemText: {
    fontSize: 13,
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
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
