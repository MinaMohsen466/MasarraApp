import React from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { styles } from './styles';
import { colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCartCount, subscribeToCartChanges } from '../../services/cart';

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
  const iconSize = isTablet ? 36 : 28;
  const [cartCount, setCartCount] = React.useState(0);

  // Load cart count and subscribe to changes
  React.useEffect(() => {
    const loadCartCount = async () => {
      const count = await getCartCount();
      setCartCount(count);
    };

    // Load initial count
    loadCartCount();

    // Subscribe to cart changes - update only when cart actually changes
    const unsubscribe = subscribeToCartChanges(() => {
      loadCartCount();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const handlePress = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const isActive = (route: string) => activeRoute === route;

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Home Icon */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('home')}
        activeOpacity={0.7}
      >
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive('home') ? colors.primary : 'none'}
          />
          <Path
            d="M9 22V12H15V22"
            stroke={isActive('home') ? colors.textWhite : colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Search Icon */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('search')}
        activeOpacity={0.7}
      >
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="11"
            cy="11"
            r="8"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M21 21L16.65 16.65"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Categories/Grid Icon */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('categories')}
        activeOpacity={0.7}
      >
        <Svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 120 120"
          fill="none"
        >
          <G>
            {/* Top Left */}
            <Rect
              x="6"
              y="6"
              width="48"
              height="48"
              rx="12"
              fill={isActive('categories') ? colors.primary : colors.primary}
            />
            {/* Top Right */}
            <Rect
              x="66"
              y="6"
              width="48"
              height="48"
              rx="12"
              fill={isActive('categories') ? colors.primary : '#A0E7E5'}
              opacity={isActive('categories') ? 1 : 0.6}
            />
            {/* Bottom Left */}
            <Rect
              x="6"
              y="66"
              width="48"
              height="48"
              rx="12"
              fill={isActive('categories') ? colors.primary : '#A0E7E5'}
              opacity={isActive('categories') ? 1 : 0.6}
            />
            {/* Bottom Right */}
            <Rect
              x="66"
              y="66"
              width="48"
              height="48"
              rx="12"
              fill={isActive('categories') ? colors.primary : colors.primary}
            />
          </G>
        </Svg>
      </TouchableOpacity>

      {/* Vendors/Store Icon */}
      <TouchableOpacity
        style={[styles.navItem, isActive('vendors') && styles.navItemActive]}
        onPress={() => handlePress('vendors')}
        activeOpacity={0.7}
      >
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9L4 4H20L21 9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M3 9V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive('vendors') ? colors.primary : 'none'}
          />
          <Path
            d="M3 9C3 10.1046 3.89543 11 5 11C6.10457 11 7 10.1046 7 9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M7 9C7 10.1046 7.89543 11 9 11C10.1046 11 11 10.1046 11 9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M11 9C11 10.1046 11.8954 11 13 11C14.1046 11 15 10.1046 15 9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M15 9C15 10.1046 15.8954 11 17 11C18.1046 11 19 10.1046 19 9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 9C19 10.1046 19.8954 11 21 11C22.1046 11 23 10.1046 23 9"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Cart Icon */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('cart')}
        activeOpacity={0.7}
      >
        <View>
          <Svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
          >
            {/* Cart body */}
            <Path
              d="M1 1H5L7.68 14.39C7.77 14.87 8.02 15.31 8.38 15.64C8.74 15.97 9.19 16.15 9.68 16.15H19.4C19.86 16.15 20.29 15.99 20.64 15.68C20.99 15.38 21.23 14.97 21.32 14.51L23 6H6"
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={isActive('cart') ? colors.primary : 'none'}
            />
            {/* Left wheel */}
            <Circle
              cx="10"
              cy="21"
              r="2"
              stroke={colors.primary}
              strokeWidth={2}
              fill={isActive('cart') ? colors.primary : 'none'}
            />
            {/* Right wheel */}
            <Circle
              cx="19"
              cy="21"
              r="2"
              stroke={colors.primary}
              strokeWidth={2}
              fill={isActive('cart') ? colors.primary : 'none'}
            />
          </Svg>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNavigation;
