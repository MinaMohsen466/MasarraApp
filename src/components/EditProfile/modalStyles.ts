import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.textWhite,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  titleRTL: {
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitleRTL: {
    fontFamily: 'System',
  },
  form: {
    padding: 24,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  labelRTL: {
    fontFamily: 'System',
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  inputRTL: {
    textAlign: 'right',
    fontFamily: 'System',
    paddingRight: 16,
    paddingLeft: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  eyeButtonRTL: {
    right: undefined,
    left: 12,
  },
  eyeIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  hintRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'left',
  },
  forgotPasswordLinkRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  buttons: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  cancelButtonTextRTL: {
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  submitButtonTextRTL: {
    fontFamily: 'System',
  },
  passwordRequirements: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  requirementsTitleRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  requirementTextRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
});
