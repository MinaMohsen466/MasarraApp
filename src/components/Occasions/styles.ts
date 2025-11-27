import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 3; // 3 columns with padding

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  backButtonRTL: {
    transform: [{ scaleX: -1 }],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  headerTitleRTL: {
    letterSpacing: 0,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  row: {
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  occasionCard: {
    width: cardWidth,
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: cardWidth - 16,
    height: cardWidth - 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 8,
  },
  occasionImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
  },
  occasionText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
  occasionTextRTL: {
    writingDirection: 'rtl',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
