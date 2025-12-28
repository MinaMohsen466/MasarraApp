import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const createStyles = (screenWidth: number, screenHeight: number) => {
  const isTallScreen = screenHeight > 800;
  const drawerWidth = screenWidth * 0.75;
  
  // حساب حجم اللوجو حسب حجم الشاشة
  const logoSize = Math.min(
    drawerWidth * 0.35, // 35% من عرض الدرور
    isTallScreen ? 100 : 80, // حد أقصى
    90 // حد أقصى عام
  );
  
  return StyleSheet.create({
  // Overlay covering the entire screen
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.overlay,
  },

  // Main drawer panel
  drawerPanel: {
    width: screenWidth * 0.75, // 75% of screen width
    height: screenHeight,
    backgroundColor: colors.primaryLight,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Safe area container
  safeAreaContainer: {
    flex: 1,
    paddingTop: 10,
  },

  // Drawer content wrapper
  drawerContent: {
    flex: 1,
  },

  // Close button container
  closeButtonContainer: {
    alignSelf: 'flex-end',
    padding: 15,
    marginLeft: 10,
  },

  // Menu items container
  menuItemsContainer: {
    flex: 1,
    paddingTop: 10,
  },

  // Individual menu item
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },

  // Menu item text
  menuItemText: {
    fontSize: 16,
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
    fontSize: 16,
    textAlign: 'right',
    fontWeight: '600',
  },

  // Logo section at bottom
  logoSection: {
    alignItems: 'center',
    paddingBottom: isTallScreen ? 30 : 20,
    paddingTop: isTallScreen ? 25 : 15,
    paddingHorizontal: 10,
    borderTopWidth: 0,
    marginTop: 'auto',
    flexShrink: 0,
    minHeight: logoSize + 40,
  },

  // Logo container
  logoContainer: {
    marginBottom: isTallScreen ? 12 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  // Logo image
  logoImage: {
    width: logoSize,
    height: logoSize,
    tintColor: colors.primary,
    maxWidth: drawerWidth * 0.4,
    maxHeight: 100,
  },

  // Logo text (MASARRA)
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  // Tagline text
  taglineText: {
    fontSize: 11,
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

  drawerPanelRTL: {
    // Drawer slides from right in RTL mode
  },

  closeButtonContainerRTL: {
    alignSelf: 'flex-start',
    marginLeft: 0,
    marginRight: 10,
  },

  menuItemsContainerRTL: {
    // Container adjustments for RTL
  },

  menuItemRTL: {
    // RTL menu item adjustments
  },

  menuItemTextRTL: {
    textAlign: 'right',
    fontFamily: 'System',
  },
  });
};
