import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    position: 'relative',
    zIndex: 10,
    paddingHorizontal: 12,
  },
  backButton: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLTR: {
    left: 12,
  },
  backButtonRTL: {
    right: 12,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.textWhite,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.backgroundCard || '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: colors.backgroundLight || '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputWrapperActive: {
    borderColor: colors.primary,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputIconRTL: {
    marginLeft: 8,
    marginRight: 0,
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  inputDividerRTL: {
    marginLeft: 10,
    marginRight: 0,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  imageUploadContainer: {
    marginBottom: 20,
  },
  dashedUploadButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
  },
  dashedUploadButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  uploadIconContainer: {
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  flexRowRTL: {
    flexDirection: 'row-reverse',
  },
});
