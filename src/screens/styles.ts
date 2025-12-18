import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundHome,
    paddingBottom: isTablet ? 120 : 80, // إضافة مساحة تحت Bottom Nav على التابلت
  },
  occasionsSection: {
    paddingTop: isTablet ? 30 : 20,
    paddingBottom: isTablet ? 100 : 40,
    marginBottom: isTablet ? 40 : 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 16,
    paddingHorizontal: isTablet ? 30 : 16,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  sectionTitleRTL: {
    letterSpacing: 0,
  },
  viewAllButton: {
    fontSize: isTablet ? 16 : 14,
    color: colors.textWhite,
    fontWeight: '700',
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewAllButtonRTL: {
    textAlign: 'left',
  },
  horizontalList: {
    paddingLeft: isTablet ? 30 : 16,
    paddingRight: isTablet ? 30 : 8,
  },
  horizontalListRTL: {
    paddingLeft: isTablet ? 30 : 8,
    paddingRight: isTablet ? 30 : 16,
  },
  occasionCard: {
    width: isTablet ? (SCREEN_WIDTH - 120) / 4 : (SCREEN_WIDTH - 48) / 3.3,
    alignItems: 'center',
    marginRight: isTablet ? 20 : 12,
  },
  iconContainer: {
    width: isTablet ? (SCREEN_WIDTH - 120) / 4 : (SCREEN_WIDTH - 48) / 3.3,
    height: isTablet ? (SCREEN_WIDTH - 120) / 4 : (SCREEN_WIDTH - 48) / 3.3,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 24 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTablet ? 16 : 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: isTablet ? 4 : 2,
    },
    shadowOpacity: isTablet ? 0.2 : 0.15,
    shadowRadius: isTablet ? 6 : 4,
    elevation: isTablet ? 5 : 4,
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
    fontSize: isTablet ? 14 : 12,
    fontWeight: isTablet ? '600' : '500',
    textAlign: 'center',
    marginTop: isTablet ? 12 : 8,
    width: '100%',
  },
  occasionTextRTL: {
    writingDirection: 'rtl',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.backgroundHome,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_HEIGHT * 0.25,
    maxWidth: 200,
    maxHeight: 250,
  },
});

export { styles };