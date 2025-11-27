import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 3; // 3 columns with proper margins

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 0,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  titleRTL: {
    letterSpacing: 0,
  },
  placeholder: {
    width: 40,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  row: {
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  vendorCard: {
    width: cardWidth,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  imageContainer: {
    width: cardWidth - 16,
    height: cardWidth - 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  letterAvatar: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textWhite,
  },
  vendorName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 2,
  },
  vendorNameRTL: {
    writingDirection: 'rtl',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
