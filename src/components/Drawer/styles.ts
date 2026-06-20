import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (screenWidth: number, screenHeight: number) => {
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight <= 800;
  const drawerWidth = screenWidth * 0.75;

  // حساب حجم اللوجو حسب حجم الشاشة
  const logoSize = isSmallScreen
    ? Math.min(drawerWidth * 0.25, 50)
    : isMediumScreen
    ? Math.min(drawerWidth * 0.32, 70)
    : Math.min(drawerWidth * 0.4, 90);

  return StyleSheet.create({
    // Overlay covering the entire screen
    overlay: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.overlay,
    },

    // Main drawer panel
    drawerPanel: {
      width: drawerWidth,
      height: screenHeight,
      backgroundColor: colors.primaryLight,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },

    // Safe area container
    safeAreaContainer: {
      flex: 1,
      paddingTop: 10,
    },

    flexContainer: {
      flex: 1,
    },

    // Drawer content wrapper
    drawerContent: {
      flex: 1,
      flexDirection: 'column',
    },

    // Close button container
    closeButtonContainer: {
      alignSelf: 'flex-end',
      padding: isSmallScreen ? 10 : 15,
      marginLeft: 10,
    },

    // Menu items container
    menuItemsContainer: {
      flexGrow: 0,
      flexShrink: 1,
      paddingTop: 4,
      paddingBottom: 4,
    },

    // Individual menu item
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isSmallScreen ? 7 : isMediumScreen ? 9 : 10,
      paddingHorizontal: 25,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },

    // Menu item text
    menuItemText: {
      flex: 1,
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
      color: colors.textPrimary,
      fontWeight: '500',
      letterSpacing: 0.3,
    },

    // Logout text style
    logoutText: {
      color: colors.error,
      fontWeight: '600',
    },

    // Arabic text styling
    arabicText: {
      fontFamily: 'System',
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
      textAlign: 'right',
      fontWeight: '600',
    },

    // Logo section at bottom - ثابت في الأسفل
    logoSection: {
      alignItems: 'center',
      paddingBottom: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
      paddingTop: isSmallScreen ? 6 : isMediumScreen ? 10 : 12,
      paddingHorizontal: 10,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      marginTop: 'auto',
      flexShrink: 0,
    },

    // Logo container
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },

    // Logo image
    logoImage: {
      width: logoSize,
      height: logoSize,
      tintColor: colors.primary,
      maxWidth: drawerWidth * 0.55,
      maxHeight: isSmallScreen ? 65 : 110,
    },

    // Logo text (MASARRA)
    logoText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
      color: colors.primary,
      letterSpacing: 1.5,
      marginBottom: 4,
    },

    // Tagline text
    taglineText: {
      fontSize: isSmallScreen ? 8 : 9,
      color: colors.primary,
      letterSpacing: 0.8,
      opacity: 0.75,
      textAlign: 'center',
    },

    // Overlay touchable area (for closing drawer)
    overlayTouchable: {
      flex: 1,
    },

    // RTL Styles for Arabic
    overlayRTL: {
      flexDirection: 'row-reverse',
    },

    drawerPanelRTL: {},

    closeButtonContainerRTL: {
      alignSelf: 'flex-start',
      marginLeft: 0,
      marginRight: 10,
    },

    menuItemsContainerRTL: {},

    menuItemRTL: {
      flexDirection: 'row-reverse',
    },

    menuItemTextRTL: {
      textAlign: 'right',
      fontFamily: 'System',
    },

    menuIconContainer: {
      marginRight: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },

    menuIconContainerRTL: {
      marginRight: 0,
      marginLeft: 12,
    },

    menuChevronContainer: {
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
