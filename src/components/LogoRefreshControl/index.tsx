/**
 * Branded pull-to-refresh: the content slides down and the Masarra mark turns
 * in the gap it opens.
 *
 * Two things had to be split apart to get here:
 *
 * - **The trigger** stays with RN's `RefreshControl`. Owning the drag with a
 *   PanResponder was tried and does not work on Android: `ReactScrollView`
 *   intercepts vertical touches natively and cancels the JS responder, so the
 *   handlers never fire and the pull does nothing at all. Doing it properly
 *   needs `react-native-gesture-handler`, a native dependency.
 * - **The motion** is ours. Android's RefreshControl never moves the content —
 *   it floats a circle over a static list — so the content shift is animated
 *   here instead. iOS already insets the content itself, so it is left alone
 *   rather than moved twice.
 *
 * The trade-off of keeping the native trigger: on Android the content does not
 * track the finger during the drag, it slides once the refresh fires.
 *
 * Usage per screen:
 *
 *   const { refreshing, onRefresh } = useLogoRefresh(reload);
 *   <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
 *     {scrollProps => <FlatList {...scrollProps} ... />}
 *   </PullToRefresh>
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControl,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../constants/colors';

// A refresh served from a warm cache can resolve in ~50ms. Holding the
// indicator for a beat is the difference between "did that do anything?" and a
// deliberate confirmation — the request is already in flight either way.
const MIN_VISIBLE_MS = 1100;

// How far the content slides while the reload runs.
const CONTENT_SHIFT = 64;
// iOS insets the scroll view for its own refresh control, so shifting there too
// would move everything twice.
const SHIFT_CONTENT = Platform.OS === 'android';

const BADGE_SIZE = 52;
const RING_SIZE = 44;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// Leave a gap so the rotating arc reads as motion rather than a static ring.
const RING_ARC = RING_CIRCUMFERENCE * 0.28;

// Only colour the stock indicator paints with; hoisted so the array identity is
// stable across renders.
const HIDDEN_COLORS = ['transparent'];

// Transparent colours blank the arc and the circle's fill, but Android's
// CircleImageView still casts an elevation shadow from its own outline — a faint
// grey ring no JS prop turns off. Parking the spinner far above the layout's top
// edge, plus clipping that layout, is what removes it. Only the spinner's
// resting position moves; SwipeRefreshLayout keeps its own trigger distance, so
// the pull still fires.
const HIDE_NATIVE_SPINNER_OFFSET = Platform.OS === 'android' ? -400 : undefined;

interface UseLogoRefreshResult {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Owns the refresh lifecycle: runs `task` and holds `refreshing` for a minimum
 * beat so a fast reload is still visible.
 */
export const useLogoRefresh = (
  task: () => Promise<unknown>,
): UseLogoRefreshResult => {
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    // A second pull while one is running would race the two setRefreshing(false)
    // calls and cut the first indicator short.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setRefreshing(true);
    const startedAt = Date.now();

    try {
      await task();
      if (__DEV__) {
        // Proof in the Metro console that the pull really hit the network,
        // since a successful refresh often looks identical on screen.
        // eslint-disable-next-line no-console
        console.log(
          `[pull-to-refresh] reloaded in ${Date.now() - startedAt}ms`,
        );
      }
    } catch {
      // Screens surface their own load errors.
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) {
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), MIN_VISIBLE_MS - elapsed);
        });
      }
      inFlightRef.current = false;
      if (mountedRef.current) setRefreshing(false);
    }
  }, [task]);

  return { refreshing, onRefresh };
};

type HiddenRefreshControlProps = React.ComponentProps<typeof RefreshControl>;

/**
 * The native control, rendered invisible.
 *
 * Every incoming prop is forwarded, and that is load-bearing, not tidiness: on
 * Android ScrollView renders `cloneElement(refreshControl, {style}, <the whole
 * scroll content>)`, so this element receives the list as `children` and the
 * outer layout as `style`. An earlier version accepted only `refreshing` and
 * `onRefresh`, dropped both, and every screen using it rendered empty.
 */
const HiddenRefreshControl: React.FC<HiddenRefreshControlProps> = ({
  style,
  ...rest
}) => (
  <RefreshControl
    {...rest}
    style={[style, styles.clipNativeSpinner]}
    tintColor="transparent"
    colors={HIDDEN_COLORS}
    progressBackgroundColor="transparent"
    progressViewOffset={HIDE_NATIVE_SPINNER_OFFSET}
  />
);

/** Props the wrapped scrollable must spread onto itself. */
export interface PullScrollProps {
  refreshControl: React.ReactElement<HiddenRefreshControlProps>;
}

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  style?: StyleProp<ViewStyle>;
  children: (scrollProps: PullScrollProps) => React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  refreshing,
  onRefresh,
  style,
  children,
}) => {
  // 0 → 1 as the refresh starts and ends. Drives the content shift and the
  // badge; JS-driven because the content offset is a layout transform.
  const progress = useRef(new Animated.Value(0)).current;
  // Separate value so the ring can spin on the native driver while the JS
  // thread is busy parsing the response — that is exactly when a JS-driven
  // rotation would freeze and look broken.
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: refreshing ? 1 : 0,
      tension: 60,
      friction: 9,
      useNativeDriver: false,
    }).start();

    if (!refreshing) return undefined;

    spin.setValue(0);
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
  }, [refreshing, progress, spin]);

  const scrollProps: PullScrollProps = {
    refreshControl: (
      <HiddenRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    ),
  };

  const badgeTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CONTENT_SHIFT],
  });
  const badgeScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const contentTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SHIFT_CONTENT ? CONTENT_SHIFT : 0],
  });
  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Parked fully above the container edge at rest, so it only appears as
          the gap opens for it. */}
      <Animated.View
        style={[
          styles.badgeSlot,
          {
            opacity: progress,
            transform: [{ translateY: badgeTranslate }, { scale: badgeScale }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.badge}>
          <Animated.View
            style={[styles.ring, { transform: [{ rotate: spinRotate }] }]}
          >
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.primaryLight}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.primary}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${RING_ARC} ${RING_CIRCUMFERENCE - RING_ARC}`}
                fill="none"
              />
            </Svg>
          </Animated.View>

          <Image
            source={require('../../imgs/MasarraLogo.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateY: contentTranslate }] },
        ]}
      >
        {children(scrollProps)}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  clipNativeSpinner: {
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    // The content slides down past the bottom edge; without this it would run
    // under whatever sits below the list.
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  badgeSlot: {
    position: 'absolute',
    top: -(BADGE_SIZE + 6),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 24,
    height: 24,
  },
});
