import { StyleSheet } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.backgroundHome },
  list: { flex: 1 },
  listContent: { paddingBottom: 96 },
  header: { fontWeight: '700', fontSize: 18, marginBottom: 12, flex: 1, textAlign: 'center', color: colors.textDark },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, width: '100%', justifyContent: 'flex-start' },
  backInline: { marginRight: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  backIcon: { color: colors.textWhite, fontSize: 28, lineHeight: 20, fontWeight: '700' },
  cardVertical: { backgroundColor: '#FFFFFF', borderRadius: 10, overflow: 'hidden', marginBottom: 12, elevation: 2, shadowColor: colors.shadow, shadowOpacity: 0.04, shadowRadius: 6, alignSelf: 'center', width: '92%', maxWidth: 360 },
  cardImageVertical: { width: '100%', height: 120, backgroundColor: '#F5F5F5', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardBodyVertical: { padding: 10 },
  cardTitle: { fontWeight: '700', color: colors.primaryDark, marginBottom: 4, fontSize: 14 },
  cardVendor: { fontWeight: '700', color: colors.primaryDark, marginBottom: 4, fontSize: 12 },
  cardDesc: { color: colors.textSecondary, marginBottom: 8, fontSize: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardPrice: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  removeText: { fontSize: 12, color: colors.error },
  heartBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colorUtils.addOpacity(colors.primary, 0.12), justifyContent: 'center', alignItems: 'center' },
  heartIcon: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  footerNote: { marginTop: 16, padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8 },
  footerCount: { fontWeight: '700', marginBottom: 6, color: colors.textDark },
  footerNoteText: { color: colors.textLight },
  emptyContainer: { flex: 1, paddingTop: 20, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: colors.textDark },
  emptyNote: { color: colors.textLight },
  emptyBodyCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // removed backSmall; use backInline in headerRow
});

export default styles;
