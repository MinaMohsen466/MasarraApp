/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

const AUTO_DISMISS_MS = 6500;
// How far down the toast has to be dragged before letting go dismisses it
// rather than springing back. A flick counts too, so a short fast swipe works.
const SWIPE_DISMISS_DISTANCE = 40;
const SWIPE_DISMISS_VELOCITY = 0.5;

interface AddToCartToastProps {
  visible: boolean;
  isRTL: boolean;
  message?: string;
  onViewCart: () => void;
  onDismiss: () => void;
}

export const AddToCartToast: React.FC<AddToCartToastProps> = ({
  visible,
  isRTL,
  message,
  onViewCart,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Both callers pass an inline arrow for onDismiss, so its identity changes on
  // every parent render. Reading it through a ref keeps handleClose stable: made
  // a real dependency instead, the effect below would re-run constantly,
  // restarting the animation and resetting the auto-dismiss timer forever.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismissRef.current();
    });
  }, [opacity, translateY]);

  // The pan responder is built once, so it reaches the current handlers through
  // refs instead of closing over the first render's copies.
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const startDismissTimer = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    // 6.5 seconds so the user has ample time to reach "View Cart".
    dismissTimer.current = setTimeout(() => {
      handleCloseRef.current();
    }, AUTO_DISMISS_MS);
  }, []);

  const springBack = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start();
    startDismissTimer();
  }, [startDismissTimer, translateY]);

  const springBackRef = useRef(springBack);
  springBackRef.current = springBack;

  // Swipe down to get rid of it. Safe to own the gesture here: the toast is an
  // absolutely positioned sibling of the screen content, not a child of a
  // ScrollView, so nothing intercepts the touch natively and cancels us.
  const panResponder = useRef(
    PanResponder.create({
      // Taps have to keep reaching the "View Cart" button, so only a move
      // claims the gesture.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 6 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        // Don't let the auto-dismiss fire out from under the finger.
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      },
      onPanResponderMove: (_, gestureState) => {
        // Downward only — dragging up would lift it away from the screen edge
        // it is anchored to.
        translateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          gestureState.dy > SWIPE_DISMISS_DISTANCE ||
          gestureState.vy > SWIPE_DISMISS_VELOCITY
        ) {
          handleCloseRef.current();
        } else {
          springBackRef.current();
        }
      },
      onPanResponderTerminate: () => {
        springBackRef.current();
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      startDismissTimer();
    } else {
      handleClose();
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [visible, handleClose, startDismissTimer, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom + 16, 24),
          transform: [{ translateY }],
          opacity,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Clean Message Text without icons */}
      <Text
        style={[styles.titleText, { textAlign: isRTL ? 'right' : 'left' }]}
        numberOfLines={1}
      >
        {message ||
          (isRTL
            ? 'تمت إضافة الخدمة للسلة بنجاح'
            : 'Added to cart successfully')}
      </Text>

      {/* Sleek View Cart Pill Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          handleClose();
          onViewCart();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>
          {isRTL ? 'عرض السلة' : 'View Cart'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#2C5F5D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 161, 156, 0.20)',
  },
  titleText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 4,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
