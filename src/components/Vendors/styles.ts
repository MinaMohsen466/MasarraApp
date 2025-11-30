import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const isTablet = width >= 600;
const cardWidth = isTablet ? (width - 120) / 4 : (width - 64) / 3; // 4 columns on tablet, 3 on mobile

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
    fontSize: isTablet ? 20 : 18,
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
    paddingHorizontal: isTablet ? 40 : 16,
    paddingVertical: isTablet ? 28 : 16,
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
    borderRadius: isTablet ? 20 : 16,
    overflow: 'hidden',
    marginBottom: isTablet ? 12 : 8,
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
    fontSize: isTablet ? 14 : 12,
    fontWeight: isTablet ? '700' : '600',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: isTablet ? 4 : 2,
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
