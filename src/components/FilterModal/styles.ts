import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  containerRTL: {
    // RTL adjustments handled by flexDirection
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  textRTL: {
    textAlign: 'right',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  priceRangeContainer: {
    gap: 12,
  },
  priceLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  priceBadgeWrapper: {
    alignItems: 'center',
  },
  priceValueBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  rangeTrackContainer: {
    marginBottom: 8,
  },
  rangeTrack: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    position: 'relative',
  },
  rangeTrackFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  priceLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  priceInputField: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  priceInputFieldRTL: {
    textAlign: 'right',
  },
  inputSeparator: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  bookingTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  bookingTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bookingTypeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  bookingTypeTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  resetButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.3,
  },
  resetButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    flex: 1,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
