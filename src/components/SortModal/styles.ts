import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  overlay: {
    // Handled by common BottomSheet wrapper
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  containerRTL: {
    // RTL adjustments handled dynamically
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  textRTL: {
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
  closeButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: 'bold',
  },
  optionsContainer: {
    gap: 6,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  optionItemActive: {
    backgroundColor: 'rgba(0, 161, 156, 0.08)',
    borderColor: colors.primary,
  },
  optionLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  optionLabelActive: {
    color: colors.primary,
  },
  radio: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
});
