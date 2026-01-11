import { StyleSheet } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    marginBottom: 40,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    zIndex: 0,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    paddingTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    // width: 40,
    // height: 40,
    // borderRadius: 20,
    // backgroundColor: colors.textWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 37,
    lineHeight: 37,
    color: colors.textWhite,
    fontWeight: '700',
    textAlign: 'center',
  },
  backButtonTextRTL: {
    fontFamily: 'System',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textWhite,
    flex: 1,
    textAlign: 'center',
  },
  headerTitleRTL: {
    fontFamily: 'System',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  sectionTitleRTL: {
    fontFamily: 'System',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  editIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  editButtonTextRTL: {
    fontFamily: 'System',
  },
  viewMode: {
    gap: 16,
    backgroundColor: colors.backgroundLight,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  fieldColumn: {
    flex: 1,
  },
  fieldSingle: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fieldLabelRTL: {
    fontFamily: 'System',
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  fieldValueRTL: {
    fontFamily: 'System',
  },
  editMode: {
    gap: 24,
  },
  photoSection: {
    marginBottom: 8,
    backgroundColor: colors.backgroundLight,
    padding: 20,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  photoLabelRTL: {
    fontFamily: 'System',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoCircleWrapper: {
    position: 'relative',
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoInitials: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  removePhotoIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textWhite,
  },
  removePhotoIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textWhite,
    lineHeight: 16,
  },
  choosePhotoButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  choosePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
    textAlign: 'center',
  },
  choosePhotoTextRTL: {
    fontFamily: 'System',
  },
  photoHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
  photoHintRTL: {
    fontFamily: 'System',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.backgroundLight,
    padding: 20,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
  },
  formColumn: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  inputLabelRTL: {
    fontFamily: 'System',
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textDark,
  },
  inputRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  cancelButtonTextRTL: {
    fontFamily: 'System',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  saveIcon: {
    fontSize: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textWhite,
  },
  saveButtonTextRTL: {
    fontFamily: 'System',
  },
  passwordInfo: {
    paddingVertical: 12,
  },
  passwordText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  passwordTextRTL: {
    fontFamily: 'System',
  },
  passwordSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  passwordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colorUtils.addOpacity(colors.warning, 0.12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordIcon: {
    fontSize: 24,
  },
  passwordContent: {
    flex: 1,
  },
  passwordTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  passwordTitleRTL: {
    fontFamily: 'System',
  },
  passwordHint: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
  },
  passwordHintRTL: {
    fontFamily: 'System',
  },
  changePasswordButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  changePasswordButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textWhite,
  },
  changePasswordButtonTextRTL: {
    fontFamily: 'System',
  },
  deleteAccountSection: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.border,
    borderWidth: 1,
  },
  deleteAccountButton: {
    backgroundColor: colors.error,

  },
  deleteAccountTitle: {
    color: colors.error,
  },
});
