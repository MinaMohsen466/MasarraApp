import { StyleSheet } from 'react-native';
import { colors, colorUtils } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    lineHeight: 40,
    color: colors.primary,
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
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderColor: colors.borderDark,
    borderWidth: 0.5,
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
    gap: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 20,
  },
  fieldColumn: {
    flex: 1,
  },
  fieldSingle: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fieldLabelRTL: {
    fontFamily: 'System',
  },
  fieldValue: {
    fontSize: 16,
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
  photoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  choosePhotoButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  choosePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
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
    borderColor: colors.borderMedium,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
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
    borderColor: colors.borderMedium,
    backgroundColor: colors.background,
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
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveIcon: {
    fontSize: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButtonTextRTL: {
    fontFamily: 'System',
  },
  passwordInfo: {
    paddingVertical: 12,
  },
  passwordText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  passwordTextRTL: {
    fontFamily: 'System',
  },
  passwordSection: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderColor: colors.borderDark,
    borderWidth: 0.5,
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
    fontSize: 16,
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
    lineHeight: 18,
  },
  passwordHintRTL: {
    fontFamily: 'System',
  },
  changePasswordButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  changePasswordButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  changePasswordButtonTextRTL: {
    fontFamily: 'System',
  },
});
