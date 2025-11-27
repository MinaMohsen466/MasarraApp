import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  occasionsSection: {
    paddingTop: 20,
    paddingBottom: 40,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  sectionTitleRTL: {
    letterSpacing: 0,
  },
  viewAllButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  viewAllButtonRTL: {
    textAlign: 'left',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  horizontalListRTL: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  occasionCard: {
    width: (SCREEN_WIDTH - 48) / 3.3,
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: (SCREEN_WIDTH - 48) / 3.3,
    height: (SCREEN_WIDTH - 48) / 3.3,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
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
});

export { styles };