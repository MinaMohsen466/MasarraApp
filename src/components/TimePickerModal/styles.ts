import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;
const modalWidth = isTablet
  ? Math.min(SCREEN_WIDTH * 0.6, 400)
  : Math.min(SCREEN_WIDTH - 80, 320); // Narrower, more compact layout

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: modalWidth,
    maxHeight: SCREEN_HEIGHT * 0.65,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  dateDisplay: {
    padding: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  slotsScroll: {
    maxHeight: 250,
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.4,
    borderColor: 'transparent',
  },
  timeSlotCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotCardDisabled: {
    opacity: 1,
    backgroundColor: colors.background,
    borderColor: colors.error,
  },
  timeSlotLeft: {
    flex: 1,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  timeSlotTextSelected: {
    color: colors.textWhite,
  },
  timeSlotTextDisabled: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  timeSlotRight: {
    alignItems: 'flex-end',
  },
  availabilityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  availabilityTextSelected: {
    color: colors.textWhite,
  },
  unavailableText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
