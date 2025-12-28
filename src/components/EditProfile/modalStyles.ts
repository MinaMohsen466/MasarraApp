import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
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
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
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
    color: '#666',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#6B7280',
  },
  hint: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: '#F0F0F0',
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
    color: '#FFFFFF',
  },
  submitButtonTextRTL: {
    fontFamily: 'System',
  },
  passwordRequirements: {
    backgroundColor: '#F9FAFB',
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
    color: '#666',
  },
  requirementTextRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
});
