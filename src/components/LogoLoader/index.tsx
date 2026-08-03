/**
 * The app's loading state: the Masarra mark inside a turning arc.
 *
 * Replaces the bare `ActivityIndicator size="large"` that every screen used to
 * render — a stock platform spinner reads as an unfinished screen, and it was
 * the one moment the brand was absent. Small in-button spinners are *not* this
 * component's job; a logo inside a submit button would be wrong.
 *
 * The arc turns on the native driver on purpose: a loading screen is showing
 * precisely when the JS thread is busy fetching and parsing, which is when a
 * JS-driven animation stutters or freezes outright.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../constants/colors';

const SIZES = {
  large: { ring: 64, stroke: 3.5, logo: 32 },
  small: { ring: 38, stroke: 2.5, logo: 19 },
} as const;

interface LogoLoaderProps {
  size?: keyof typeof SIZES;
  style?: StyleProp<ViewStyle>;
}

/**
 * Sized to its content, exactly like the `ActivityIndicator` it replaces —
 * anything wider would re-center the callers that render a "جاري التحميل…"
 * label next to it, pushing that label to the bottom of the screen.
 */
export const LogoLoader: React.FC<LogoLoaderProps> = ({
  size = 'large',
  style,
}) => {
  const spin = useRef(new Animated.Value(0)).current;
  const { ring, stroke, logo } = SIZES[size];

  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Leave a gap so the arc reads as motion rather than a static ring.
  const arc = circumference * 0.28;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.center, style]}>
      <View style={{ width: ring, height: ring }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
        >
          <Svg width={ring} height={ring}>
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={radius}
              stroke={colors.primaryLight}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circumference - arc}`}
              fill="none"
            />
          </Svg>
        </Animated.View>

        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Image
            source={require('../../imgs/MasarraLogo.png')}
            resizeMode="contain"
            style={{ width: logo, height: logo }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LogoLoader;
