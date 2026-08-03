/**
 * Push/pop transition for the drill-down screens.
 *
 * The app has no navigation library — `App.tsx` renders a `switch` on
 * `currentRoute`, so screens used to swap in a single hard cut with nothing to
 * say whether you had gone deeper or come back. This wraps that switch and
 * animates the swap: the incoming screen slides in from the edge while the
 * outgoing one drifts the other way, mirrored under RTL so it matches the
 * existing edge swipe-back gesture.
 *
 * Only drill-down routes animate (see ANIMATED_ROUTES). Bottom-tab moves stay
 * instant, the way they are in native apps — sliding between siblings implies a
 * hierarchy that isn't there.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Routes you enter *from* another screen and return from. Anything reachable
 * from the bottom tab bar (home, search, categories, vendors, cart) is
 * deliberately absent. Add a route here to give it the transition.
 */
const ANIMATED_ROUTES = [
  'service-details',
  'package-details',
  'vendor-services',
  'occasion-services',
  'addresses',
  'become-seller',
];

const DURATION = 280;
// The outgoing screen moves a fraction of the way, so it reads as being layered
// underneath rather than as two screens racing each other.
const TRAILING_FACTOR = 0.28;

export const shouldAnimateRoute = (from: string, to: string): boolean =>
  ANIMATED_ROUTES.includes(from) || ANIMATED_ROUTES.includes(to);

interface ScreenTransitionProps {
  /** The current route; a change to this is what drives the animation. */
  routeKey: string;
  /** `back` reverses the direction — set by the back handler / swipe gesture. */
  direction: 'forward' | 'back';
  children: React.ReactNode;
}

interface Snapshot {
  key: string;
  node: React.ReactNode;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  routeKey,
  direction,
  children,
}) => {
  const { width } = useWindowDimensions();
  const { isRTL } = useLanguage();

  const progress = useRef(new Animated.Value(1)).current;
  // Holds the screen we are animating away from. Rendering the element we
  // captured — rather than re-deriving it — keeps the outgoing screen showing
  // the data it had, instead of flashing the new route's props for one frame.
  const [outgoing, setOutgoing] = useState<Snapshot | null>(null);
  const [tracked, setTracked] = useState(routeKey);
  const directionRef = useRef(direction);
  // Lags one render behind: during the render where the route changes it still
  // holds the node that belongs to the previous route.
  const lastNodeRef = useRef<React.ReactNode>(children);

  if (tracked !== routeKey) {
    // Deriving state during render, which React supports for exactly this
    // "prop changed, reset internal state" case. The guard makes it terminate.
    const animate = shouldAnimateRoute(tracked, routeKey);
    directionRef.current = direction;
    progress.setValue(animate ? 0 : 1);
    setOutgoing(animate ? { key: tracked, node: lastNodeRef.current } : null);
    setTracked(routeKey);
  }

  useEffect(() => {
    lastNodeRef.current = children;
  });

  useEffect(() => {
    if (!outgoing) return undefined;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setOutgoing(null);
    });
    return () => animation.stop();
  }, [outgoing, progress]);

  // RTL mirrors the whole thing: "forward" has to arrive from the side the
  // back-swipe pulls from, or the two gestures contradict each other.
  const axis = isRTL ? -1 : 1;
  const goingBack = directionRef.current === 'back';

  const incomingFrom = goingBack
    ? -width * TRAILING_FACTOR * axis
    : width * axis;
  const outgoingTo = goingBack ? width * axis : -width * TRAILING_FACTOR * axis;

  const incomingTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [incomingFrom, 0],
  });
  const outgoingTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, outgoingTo],
  });

  return (
    <View style={styles.container}>
      {outgoing && (
        <Animated.View
          key={outgoing.key}
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: outgoingTranslate }] },
          ]}
          pointerEvents="none"
        >
          {outgoing.node}
        </Animated.View>
      )}
      <Animated.View
        key={routeKey}
        style={[
          styles.screen,
          outgoing != null && {
            transform: [{ translateX: incomingTranslate }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // The outgoing screen sits outside the bounds for most of the animation.
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
  },
});

export default ScreenTransition;
