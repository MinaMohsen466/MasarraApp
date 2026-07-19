/* eslint-disable @typescript-eslint/no-explicit-any, react-native/no-inline-styles */
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import {
  View,
  TextInput,
  Animated,
  Platform,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import { styles } from './styles';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  iconName: string;
  isRTL: boolean;
  activeColor?: string;
  inactiveColor?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: any;
  showDivider?: boolean;
}

export const FloatingLabelInput = forwardRef<
  TextInput,
  FloatingLabelInputProps
>(
  (
    {
      label,
      iconName,
      isRTL,
      value = '',
      placeholder,
      onFocus,
      onBlur,
      activeColor = colors.primary,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      inactiveColor = '#9CA3AF',
      leftElement,
      rightElement,
      containerStyle,
      showDivider = true,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: isFocused || value ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, value]);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    // Interpolations for floating animation
    const labelTranslateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Platform.OS === 'ios' ? 4 : 2, -22],
    });

    const labelFontSize = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    });

    const labelColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9CA3AF', isFocused ? activeColor : '#6B7280'],
    });

    return (
      <View
        style={[
          styles.sleekInputWrapper,
          isRTL && styles.sleekInputWrapperRTL,
          isFocused && styles.sleekInputWrapperActive,
          { marginTop: 6, marginBottom: 14 },
          containerStyle,
        ]}
      >
        <Icon
          name={iconName}
          size={18}
          color={isFocused ? activeColor : '#9CA3AF'}
          style={[styles.sleekInputIcon, isRTL && styles.sleekInputIconRTL]}
        />
        {showDivider && (
          <View
            style={[
              styles.sleekInputDivider,
              isRTL && styles.sleekInputDividerRTL,
            ]}
          />
        )}

        {leftElement}

        <View
          style={{ flex: 1, position: 'relative', justifyContent: 'center' }}
        >
          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            style={{
              position: 'absolute',
              left: isRTL ? undefined : 0,
              right: isRTL ? 0 : undefined,
              transform: [{ translateY: labelTranslateY }],
              fontSize: labelFontSize,
              color: labelColor,
              textAlign: isRTL ? 'right' : 'left',
              fontFamily: 'System',
              zIndex: 1,
              width: '100%',
            }}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={ref}
            {...props}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused ? placeholder : ''}
            style={[
              styles.sleekTextInput,
              isRTL && styles.sleekTextInputRTL,
              { paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: 4 },
            ]}
          />
        </View>
        {rightElement}
      </View>
    );
  },
);
