/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { colors } from '../../constants/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  /**
   * Starts visible, on purpose.
   *
   * The entrance used to fade this from 0, which made the logo appearing at all
   * conditional on that animation completing — and when it did not, the splash
   * showed nothing but the loading dots (they hang off a value initialised to 1,
   * so they were never affected). Visibility is not something to animate into on
   * a screen whose whole job is to show the mark. The entrance is the scale and
   * tilt below; those can only ever make an already-visible logo look better,
   * never hide it.
   */
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  /**
   * Read through a ref so the effect below can run exactly once.
   *
   * App.tsx passes an inline arrow, so `onFinish` had a new identity on every
   * one of its renders — and it renders repeatedly while the splash is up (auth
   * restoring, the site-settings query landing, the onboarding check). As a
   * dependency it tore the effect down and restarted every animation each time.
   *
   * That is what hid the logo. Under `useNativeDriver` the JS-side value is not
   * synced back while the native animation runs, so each restart began from the
   * stale `logoOpacity` of 0 rather than from where the fade had got to — it was
   * reset to invisible faster than it could fade in. The loading dots survived
   * because they hang off `pulseAnim`, which starts at 1 and so renders at full
   * opacity whether or not its animation ever runs.
   */
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // Background color interpolation
    const backgroundColorAnimation = Animated.timing(backgroundColorAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    });

    // Logo entrance animation
    const logoEntrance = Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Elastic-like bounce
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Subtle pulse/breathing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    // Start animations
    backgroundColorAnimation.start();
    logoEntrance.start(() => {
      pulseAnimation.start();
    });

    // Finish after 2.2 seconds
    const timer = setTimeout(() => {
      // Fade out animation before finishing
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinishRef.current();
      });
    }, 2200);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
      logoEntrance.stop();
      backgroundColorAnimation.stop();
    };
  }, [logoScale, logoOpacity, logoRotate, pulseAnim, backgroundColorAnim]);

  // Interpolate background color
  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.primaryDark, colors.primary, colors.primary],
  });

  // Interpolate rotation
  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Decorative circles in background */}
        <View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              top: -100,
              right: -100,
              transform: [{ scale: pulseAnim }],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              bottom: -50,
              left: -50,
              transform: [{ scale: pulseAnim }],
            }}
          />
        </View>

        {/* Logo Container with animations */}
        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnim) },
              { rotate: spin },
            ],
          }}
        >
          <Image
            source={require('../../imgs/logo.png')}
            style={{
              width: width * 0.5,
              height: height * 0.3,
              maxWidth: 250,
              maxHeight: 300,
            }}
            resizeMode="contain"
            // A blank splash otherwise gives no way to tell a failed asset from
            // a failed animation — the two look identical on screen.
            onError={({ nativeEvent }) =>
              console.error('[Splash] logo failed to load:', nativeEvent?.error)
            }
          />
        </Animated.View>

        {/* Loading dots animation */}
        <View style={{ flexDirection: 'row', marginTop: 40, gap: 8 }}>
          {[0, 1, 2].map(index => (
            <Animated.View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.05],
                  outputRange:
                    index === 0
                      ? [0.4, 1]
                      : index === 1
                      ? [0.6, 1]
                      : [0.8, 0.4],
                }),
              }}
            />
          ))}
        </View>
      </Animated.View>
    </>
  );
};

export default SplashScreen;
