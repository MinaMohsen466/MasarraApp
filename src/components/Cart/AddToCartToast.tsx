/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

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

  useEffect(() => {
    if (visible) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

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

      // Increased timer to 6.5 seconds so user has ample time
      dismissTimer.current = setTimeout(() => {
        handleClose();
      }, 6500);
    } else {
      handleClose();
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [visible, handleClose, opacity, translateY]);

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
