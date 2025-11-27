import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export const styles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 0,
  },
  headerBar: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    zIndex: 1,
  },
  headerBackInline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerSpacer: {
    width: 40,
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

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
    marginTop: 24,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },

  // Intro Section
  introSection: {
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    textAlign: 'left',
  },
  introTextRTL: {
    textAlign: 'right',
  },

  // Contact Cards Container
  contactCardsContainer: {
    marginBottom: 32,
    gap: 12,
  },

  // Contact Card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 3,
  },

  // Icon Container
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  // Contact Details
  contactDetails: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  contactDetailsRTL: {
    alignItems: 'flex-end',
  },

  // Contact Label
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactLabelRTL: {
    textAlign: 'right',
  },

  // Contact Value
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactValueRTL: {
    textAlign: 'right',
  },

  // Additional Section
  additionalSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  // Additional Title
  additionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'left',
  },
  additionalTitleRTL: {
    textAlign: 'right',
  },

  // Additional Text
  additionalText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#666',
    textAlign: 'left',
  },
  additionalTextRTL: {
    textAlign: 'right',
  },

  // Form Section
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 58,
  },

  // Form Title
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'left',
  },
  formTitleRTL: {
    textAlign: 'right',
  },

  // Input Fields
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  inputRTL: {
    textAlign: 'right',
  },

  // Message Input
  messageInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
    height: 120,
  },
  messageInputRTL: {
    textAlign: 'right',
  },

  // Submit Button
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
