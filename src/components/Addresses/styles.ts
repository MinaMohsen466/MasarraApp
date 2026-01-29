import { StyleSheet } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const styles = StyleSheet.create({
  addressesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 140,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700'
  },
  // Prominent Add button - now matches back button color
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0,
  },
  addButtonText: { color: colors.textWhite, fontWeight: '600' },

  emptyBox: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: colors.background,
    padding: 28,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyIcon: { width: 36, height: 36, tintColor: colors.textLight },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: { color: colors.textWhite, fontWeight: '700' },

  formContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  secondaryButton: {
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  secondaryButtonText: { color: colors.textDark },
  primaryButtonSmall: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 6,
  },
  primaryButtonTextSmall: { color: colors.textWhite, fontWeight: '700' },

  // Redesigned Address Card - Compact, Clean Look
  addressCard: {
    backgroundColor: '#FFFFFF',
    padding: 0,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  addressCardInner: {
    padding: 12,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colorUtils.addOpacity(colors.primary, 0.12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addressInfoContainer: {
    flex: 1,
  },
  addressName: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 1,
  },
  addressSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addressDetailsContainer: {
    backgroundColor: colorUtils.addOpacity(colors.primary, 0.04),
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  addressLine: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 3,
    lineHeight: 20,
  },
  addressLineWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLineText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 6,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colorUtils.addOpacity(colors.primary, 0.03),
    borderTopWidth: 1,
    borderTopColor: colorUtils.addOpacity(colors.primary, 0.08),
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginHorizontal: 0,
  },
  actionButtonText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 13
  },
  deleteButton: {
    padding: 8,
    backgroundColor: colorUtils.addOpacity(colors.error, 0.1),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 34,
    height: 34,
  },
  deleteButtonText: {
    color: colors.error
  },
  defaultBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colorUtils.addOpacity(colors.success || '#10B981', 0.12),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorUtils.addOpacity(colors.success || '#10B981', 0.25),
  },
  defaultBadgeText: {
    color: colors.success || '#10B981',
    fontSize: 12,
    fontWeight: '600'
  },
  setDefaultLink: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colorUtils.addOpacity(colors.primary, 0.1),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorUtils.addOpacity(colors.primary, 0.2),
  },
  setDefaultLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12
  },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center' },
  // Bigger back icon/button with colored background
  backButtonInline: {
    marginRight: 12,
    width: 36,
    height: 36,
    padding: 0,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonTextInline: {
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
});

export default styles;
