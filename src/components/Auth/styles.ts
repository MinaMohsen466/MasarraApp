import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderRadius: 10,
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
  headerBlock: {
    height: 130,
    backgroundColor: colors.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  topographicSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  curveDivider: {
    height: 60,
    backgroundColor: colors.primary,
    marginTop: -1,
  },
  formWrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    flex: 1,
  },
  formHeadingContainer: {
    marginBottom: 28,
    alignSelf: 'flex-start',
    width: '100%',
  },
  formHeadingContainerRTL: {
    alignSelf: 'flex-end',
  },
  formHeading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'left',
  },
  formHeadingRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  formHeadingUnderline: {
    width: 38,
    height: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  formHeadingUnderlineRTL: {
    alignSelf: 'flex-end',
  },
  sleekInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
    marginBottom: 20,
    width: '100%',
  },
  sleekInputWrapperRTL: {
    flexDirection: 'row-reverse',
  },
  sleekInputWrapperActive: {
    borderBottomColor: colors.primary,
  },
  sleekInputIcon: {
    marginRight: 10,
  },
  sleekInputIconRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  sleekInputDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  sleekInputDividerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  sleekTextInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    paddingVertical: 6,
    textAlign: 'left',
  },
  sleekTextInputRTL: {
    textAlign: 'right',
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    marginBottom: 24,
    width: '100%',
  },
  rememberContainerRTL: {
    flexDirection: 'row-reverse',
  },
  rememberCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberCheckboxRowRTL: {
    flexDirection: 'row-reverse',
  },
  rememberText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rememberTextRTL: {
    fontFamily: 'System',
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  forgotTextRTL: {
    fontFamily: 'System',
  },
  submitButtonTextNew: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  footerToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  footerToggleContainerRTL: {
    flexDirection: 'row-reverse',
  },
  footerToggleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerToggleTextRTL: {
    fontFamily: 'System',
  },
  footerToggleLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  footerToggleLinkRTL: {
    fontFamily: 'System',
  },
  headerOverlayBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  headerOverlayBarRTL: {
    flexDirection: 'row-reverse',
  },
  headerBackButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
