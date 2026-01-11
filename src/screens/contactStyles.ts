import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 58,
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
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  additionalInfoContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  additionalInfoTitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  additionalInfoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  submitButtonText: {
    color: colors.textWhite,
    fontSize: 16,
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
});
