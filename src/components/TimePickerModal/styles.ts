import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: SCREEN_WIDTH - 60,
    maxHeight: SCREEN_HEIGHT * 0.7,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  dateDisplay: {
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  slotsScroll: {
    maxHeight: 320,
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 10,
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
    fontSize: 15,
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
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  availabilityTextSelected: {
    color: colors.textWhite,
  },
  unavailableText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
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
