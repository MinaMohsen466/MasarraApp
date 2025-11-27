import { StyleSheet } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const styles = StyleSheet.create({
  addressesContainer: { flex: 1, padding: 16, backgroundColor: colors.backgroundLight },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  // Prominent Add button - now matches back button color
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 0 },
  addButtonText: { color: colors.textWhite, fontWeight: '600' },

  emptyBox: { marginTop: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.background, padding: 28, alignItems: 'center' },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyIcon: { width: 36, height: 36, tintColor: colors.textLight },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },

  primaryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 },
  primaryButtonText: { color: colors.textWhite, fontWeight: '700' },

  formContainer: { marginTop: 16, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: colors.borderMedium, borderRadius: 6, padding: 10, marginBottom: 8 },
  formButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  secondaryButton: { padding: 10, backgroundColor: colors.background, borderRadius: 6, borderWidth: 1, borderColor: colors.borderMedium },
  secondaryButtonText: { color: colors.textDark },
  primaryButtonSmall: { backgroundColor: colors.primary, padding: 10, borderRadius: 6 },
  primaryButtonTextSmall: { color: colors.textWhite, fontWeight: '700' },

  addressCard: { backgroundColor: colors.background, padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  actionButton: {
    padding: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: colorUtils.addOpacity(colors.error, 0.12),
    borderRadius: 6,
  },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center' },
  // Bigger back icon/button with colored background
  backButtonInline: { marginRight: 12, width: 36, height: 36, padding: 0, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  backButtonTextInline: { color: colors.textWhite, fontSize: 22, fontWeight: '700', lineHeight: 22 },
  actionsRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colorUtils.addOpacity(colors.primary, 0.12), borderRadius: 12, marginRight: 8 },
  defaultBadgeText: { color: colors.primary, fontSize: 12 },
  setDefaultLink: { marginRight: 12 },
  setDefaultLinkText: { color: colors.primary },
  actionButtonText: { color: colors.primary },
  deleteButtonText: { color: colors.error },
  addressName: { fontWeight: '700', marginBottom: 4 },
  addressLine: { color: '#374151' },
});

export default styles;
