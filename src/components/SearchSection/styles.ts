import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: isTablet ? 32 : 16,
    paddingVertical: isTablet ? 8 : 4,
    borderRadius: isTablet ? 20 : 16,
    marginHorizontal: 2,
    marginTop: 0,
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: isTablet ? 12 : 10,
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 14 : 10,
    marginBottom: isTablet ? 12 : 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  iconWrapper: {
    marginRight: 10,
    width: isTablet ? 28 : 24,
    height: isTablet ? 28 : 24,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 6 : 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    width: isTablet ? 28 : 24,
    height: isTablet ? 28 : 24,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 6 : 5,
    overflow: 'hidden',
  },
  calendarTop: {
    height: 5,
    backgroundColor: colors.primaryDark,
  },
  calendarBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  gridIcon: {
    width: isTablet ? 28 : 24,
    height: isTablet ? 28 : 24,
    backgroundColor: colors.primary,
    borderRadius: isTablet ? 6 : 5,
    padding: isTablet ? 4 : 3,
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
    fontSize: isTablet ? 15 : 13,
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
    borderRadius: isTablet ? 12 : 10,
    paddingVertical: isTablet ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: isTablet ? 0.30 : 0.25,
    shadowRadius: isTablet ? 8 : 6,
    elevation: isTablet ? 5 : 4,
  },
  searchButtonText: {
    color: colors.textWhite,
    fontSize: isTablet ? 15 : 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
