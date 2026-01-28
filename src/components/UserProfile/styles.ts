import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    position: 'relative',
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 0,
  },
  headerBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerBackText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
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
  headerBackIcon: {
    color: colors.primary,
    // smaller font and explicit lineHeight to center the chevron glyph exactly inside the 40x40 circle
    fontSize: 24,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '700',
  },
  headerBackTextRTL: {
    fontFamily: 'System',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textWhite,
    flex: 1,
    textAlign: 'center',
  },
  headerTitleRTL: {
    fontFamily: 'System',
  },
  // spacer width matches back button width so title remains visually centered
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingBottom: 80,
  },
  userInfoSection: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  userInfoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDataContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textWhite,
    textAlign: 'center',
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D3D3D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    tintColor: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  userNameRTL: {
    fontFamily: 'System',
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userPhoneRTL: {
    fontFamily: 'System',
  },
  noPhone: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  noPhoneRTL: {
    fontFamily: 'System',
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
  },
  menuItemPrimary: {
    backgroundColor: colors.primary,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    textAlign: 'center',
  },
  menuTextRTL: {
    fontFamily: 'System',
  },
  menuTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  menuTextWhiteRTL: {
    fontFamily: 'System',
  },
  menuTextLogout: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
    textAlign: 'center',
  },
  menuTextLogoutRTL: {
    fontFamily: 'System',
  },
  backButton: {
    marginTop: 20,
    marginHorizontal: 16,
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
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 20,
    marginBottom: 12,
  },
  loginPromptTitleRTL: {
    fontFamily: 'System',
  },
  loginPromptText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  loginPromptTextRTL: {
    fontFamily: 'System',
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
