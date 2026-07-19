import React from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCartCount, subscribeToCartChanges } from '../../services/cart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavigationProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeRoute = 'home',
  onNavigate,
}) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 600;
  const iconSize = isTablet ? 40 : 34;
  const [cartCount, setCartCount] = React.useState(0);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    const loadCartCount = async () => {
      const count = await getCartCount();
      setCartCount(count);
    };
    loadCartCount();
    const unsubscribe = subscribeToCartChanges(() => {
      loadCartCount();
    });
    return unsubscribe;
  }, []);

  const handlePress = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const isActive = (route: string) => activeRoute === route;
  const activeColor = colors.primary;
  const inactiveColor = colors.primary;

  // Home icon - outline with chimney and arch door matching user's image
  // eslint-disable-next-line react/no-unstable-nested-components
  const HomeIcon = ({ active }: { active: boolean }) => {
    const color = active ? activeColor : inactiveColor;
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        {/* Main house outline */}
        <Path
          d="M4 11V20C4 20.55 4.45 21 5 21H19C19.55 21 20 20.55 20 20V11"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Roof */}
        <Path
          d="M2.5 11.5L12 3.5L21.5 11.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Chimney */}
        <Path
          d="M17 5V7.7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Arch Door */}
        <Path
          d="M9 21V15C9 13.9 9.9 13 11 13H13C14.1 13 15 13.9 15 15V21"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };

  // Search icon
  // eslint-disable-next-line react/no-unstable-nested-components
  const SearchIcon = ({ active }: { active: boolean }) => {
    const color = active ? activeColor : inactiveColor;
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Circle
          cx="10.5"
          cy="10.5"
          r="7.5"
          fill={active ? activeColor + '22' : 'none'}
          stroke={color}
          strokeWidth={2}
        />
        <Path
          d="M20 20L16 16"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    );
  };

  // Categories icon — same level, no FAB
  // eslint-disable-next-line react/no-unstable-nested-components
  const CategoriesIcon = () => {
    const darkColor = colors.primary;
    const lightColor = '#b5e7e4';
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        {/* Top Left - Dark */}
        <Rect x="3" y="3" width="8" height="8" rx="2.5" fill={darkColor} />
        {/* Top Right - Light */}
        <Rect x="13" y="3" width="8" height="8" rx="2.5" fill={lightColor} />
        {/* Bottom Left - Light */}
        <Rect x="3" y="13" width="8" height="8" rx="2.5" fill={lightColor} />
        {/* Bottom Right - Dark */}
        <Rect x="13" y="13" width="8" height="8" rx="2.5" fill={darkColor} />
      </Svg>
    );
  };

  // Vendors / Store icon
  // eslint-disable-next-line react/no-unstable-nested-components
  const VendorsIcon = ({ active }: { active: boolean }) => {
    const color = active ? activeColor : inactiveColor;
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Path
          d="M1.5 9.5L4 4H20L22.5 9.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3 9.5V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V9.5"
          fill={active ? activeColor + '22' : 'none'}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.5 21V16C9.5 15.4477 9.94772 15 10.5 15H13.5C14.0523 15 14.5 15.4477 14.5 16V21"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1.5 9.5C1.5 10.8807 2.61929 12 4 12C5.38071 12 6.5 10.8807 6.5 9.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M6.5 9.5C6.5 10.8807 7.61929 12 9 12C10.3807 12 11.5 10.8807 11.5 9.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M11.5 9.5C11.5 10.8807 12.6193 12 14 12C15.3807 12 16.5 10.8807 16.5 9.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M16.5 9.5C16.5 10.8807 17.6193 12 19 12C20.3807 12 21.5 10.8807 21.5 9.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    );
  };

  // Cart icon
  // eslint-disable-next-line react/no-unstable-nested-components
  const CartIcon = ({ active }: { active: boolean }) => {
    const color = active ? activeColor : inactiveColor;
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Path
          d="M1.5 2H4L6.27 13.39C6.42 14.17 7.1 14.75 7.9 14.75H18.5C19.28 14.75 19.95 14.19 20.11 13.42L21.5 6.5H5"
          fill={active ? activeColor + '22' : 'none'}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="9" cy="19.5" r="1.5" fill={color} />
        <Circle cx="18" cy="19.5" r="1.5" fill={color} />
      </Svg>
    );
  };

  const renderIcon = (route: string, active: boolean) => {
    switch (route) {
      case 'home':
        return <HomeIcon active={active} />;
      case 'search':
        return <SearchIcon active={active} />;
      case 'categories':
        return <CategoriesIcon />;
      case 'vendors':
        return <VendorsIcon active={active} />;
      case 'cart':
        return <CartIcon active={active} />;
      default:
        return null;
    }
  };

  // Fixed LTR order, reversed for RTL
  const ltrOrder = ['home', 'search', 'categories', 'vendors', 'cart'];
  const navOrder = isRTL ? [...ltrOrder].reverse() : ltrOrder;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: (isTablet ? 24 : 14) + insets.bottom },
      ]}
    >
      {navOrder.map(route => {
        const active = isActive(route);
        const isCart = route === 'cart';
        return (
          <TouchableOpacity
            key={route}
            style={styles.navItem}
            onPress={() => handlePress(route)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconWrapper, active && styles.iconWrapperActive]}
            >
              {renderIcon(route, active)}
              {isCart && cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;
