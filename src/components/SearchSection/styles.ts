import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: isTablet ? 40 : 24,
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: isTablet ? 24 : 20,
    marginHorizontal: 2,
    marginTop: 0,
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 18 : 14,
    marginBottom: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  iconWrapper: {
    marginRight: 12,
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 7 : 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 7 : 6,
    overflow: 'hidden',
  },
  calendarTop: {
    height: 6,
    backgroundColor: colors.primaryDark,
  },
  calendarBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  gridIcon: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 7 : 6,
    padding: isTablet ? 5 : 4,
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  gridSquare: {
    width: 8,
    height: 8,
    backgroundColor: colors.textWhite,
    borderRadius: 2,
  },
  inputText: {
    flex: 1,
    fontSize: isTablet ? 16 : 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  inputTextRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
    marginRight: 12,
    marginLeft: 0,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: isTablet ? 14 : 12,
    paddingVertical: isTablet ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isTablet ? 0.35 : 0.3,
    shadowRadius: isTablet ? 10 : 8,
    elevation: isTablet ? 6 : 5,
  },
  searchButtonText: {
    color: colors.textWhite,
    fontSize: isTablet ? 17 : 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
