import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
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
  const [contentHeight, setContentHeight] = useState(SCREEN_HEIGHT * 0.6);
  
  // Animated value for vertical translation
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      // Spring animation for smooth premium feel on open
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      // Smooth timing animation on close
      Animated.timing(translateY, {
        toValue: contentHeight + 100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, contentHeight]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: contentHeight + 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
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
          // Snap back to top with spring
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if interrupted
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Dynamic interpolation for backdrop opacity based on translateY position
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, contentHeight],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  grabberZone: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  handleBar: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
  },
  content: {
    width: '100%',
  },
});
