import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  overlay: {
    // Handled by common BottomSheet wrapper
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  containerRTL: {
    // RTL alignments handled by flexDirection
  },
  handleBar: {
    // Handled by common BottomSheet wrapper
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
    color: '#0F172A', // Very dark slate for premium look
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
  filterSection: {
    backgroundColor: '#F8FAFC', // Beautiful card background
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155', // Sleek dark gray
    marginBottom: 8,
  },
  priceRangeContainer: {
    gap: 6,
  },
  priceLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  priceBadgeWrapper: {
    alignItems: 'center',
  },
  priceValueBadge: {
    backgroundColor: 'rgba(0, 161, 156, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priceValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  rangeTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    position: 'relative',
  },
  rangeTrackFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2.5,
  },
  sliderContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
    marginHorizontal: 8,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    top: 2,
  },
  priceLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  priceInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  priceInputFieldActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceInputFieldRTL: {
    textAlign: 'right',
  },
  inputSeparator: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  bookingTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bookingTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingTypeText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '700',
  },
  bookingTypeTextActive: {
    color: '#FFFFFF',
  },
  discountToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountToggleText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  resetButton: {
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.35,
    backgroundColor: '#F1F5F9',
  },
  resetButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13.5,
  },
  applyButton: {
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
