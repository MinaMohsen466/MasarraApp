import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    marginHorizontal: 2,
    marginTop: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  iconWrapper: {
    marginRight: 12,
  },
  calendarIcon: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
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
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
    padding: 4,
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
    fontSize: 15,
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
