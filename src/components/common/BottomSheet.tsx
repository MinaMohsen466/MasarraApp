import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight = SCREEN_HEIGHT * 0.85,
}) => {
  const [showModal, setShowModal] = useState(visible);
  // Only the backdrop's interpolation reads this; the animations read the ref.
  // Keeping it out of the open/close effect is the whole point — see below.
  const [contentHeight, setContentHeight] = useState(SCREEN_HEIGHT * 0.6);
  const contentHeightRef = useRef(SCREEN_HEIGHT * 0.6);

  // Animated value for vertical translation
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Props read from inside the PanResponder, which is created once and would
  // otherwise keep calling the very first render's onClose.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const animateClosed = useCallback(
    (duration: number, then?: () => void) => {
      Animated.timing(translateY, {
        // Always the full screen height, never the measured content: on the
        // first open that measurement is still a guess, and closing to a value
        // shorter than the sheet leaves a strip of it parked on screen.
        toValue: SCREEN_HEIGHT,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(then);
    },
    [translateY],
  );

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      // Deliberately a timing curve, not a spring. `tension: 65, friction: 11`
      // is well underdamped (ζ ≈ 0.68): the sheet shot past its resting place
      // and oscillated back, and over a full screen's travel that overshoot is
      // tens of pixels — read as a shake at the end of every open. An ease-out
      // decelerates into place and cannot overshoot.
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      animateClosed(220, () => setShowModal(false));
    }
    // `contentHeight` must NOT be a dependency. onLayout sets it while the
    // opening spring is still in flight, and a re-run restarts that spring from
    // rest — the sheet accelerates, stalls, then accelerates again, which is
    // the judder this sheet used to have on every open.
  }, [visible, translateY, animateClosed]);

  const handleDismiss = () => {
    animateClosed(200, () => onCloseRef.current());
  };

  // PanResponder to handle vertical swipe down on the header handle area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Intercept downward drag gestures
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Clamp to only allow pulling down (dy > 0)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped down past threshold or swiped fast, dismiss
        if (gestureState.dy > 100 || gestureState.vy > 0.4) {
          handleDismiss();
        } else {
          // Same reasoning as the open animation: no overshoot on snap-back.
          Animated.timing(translateY, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if interrupted
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  // Dynamic interpolation for backdrop opacity based on translateY position
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, contentHeight],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    // onLayout fires again for images finishing, the keyboard, rotation. Only
    // a real change should re-render, and none of them touch the animation.
    if (height > 0 && Math.abs(height - contentHeightRef.current) > 1) {
      contentHeightRef.current = height;
      setContentHeight(height);
    }
  };

  if (!showModal) return null;

  return (
    <Modal
      transparent
      visible={showModal}
      onRequestClose={handleDismiss}
      animationType="none"
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        {/* Backdrop touchable to close */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Modal Container */}
        <Animated.View
          onLayout={onLayout}
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              maxHeight: maxHeight,
            },
          ]}
        >
          {/* Grabber Area / Touch zone for swiping down */}
          <View {...panResponder.panHandlers} style={styles.grabberZone}>
            <View style={styles.handleBar} />
          </View>

          {/* Children content wrapper */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
  },
  grabberZone: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  content: {
    width: '100%',
  },
});
