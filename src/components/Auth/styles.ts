import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 32,
  },
  titleRTL: {
    fontFamily: 'System',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  labelRTL: {
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    color: colors.textDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputRTL: {
    textAlign: 'right',
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
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordTextRTL: {
    textAlign: 'left',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  toggleContainerRTL: {
    flexDirection: 'row-reverse',
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  toggleTextRTL: {
    fontFamily: 'System',
  },
  toggleLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleLinkRTL: {
    fontFamily: 'System',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  backButtonTextRTL: {
    fontFamily: 'System',
  },
});
