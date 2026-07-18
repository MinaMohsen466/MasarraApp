/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initSecureStorage } from './src/utils/secureStorage';
import { initApiInterceptor } from './src/utils/apiInterceptor';
import Geolocation from '@react-native-community/geolocation';

// Initialize secure keychain proxy for AsyncStorage userToken
initSecureStorage();

// Initialize silent token refresh HTTP interceptor
initApiInterceptor();

// Configure Geolocation - automatically request auth on iOS
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
});

import React from 'react';
import { StyleSheet } from 'react-native';
const reactNative = require('react-native');

const ARABIC_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function hasArabicText(children) {
  if (typeof children === 'string') return ARABIC_REGEX.test(children);
  if (typeof children === 'number') return false;
  if (Array.isArray(children)) return children.some(hasArabicText);
  if (children?.props?.children) return hasArabicText(children.props.children);
  return false;
}

// 1. Wrap Text Component
const OriginalText = reactNative.Text;
const WrappedText = React.forwardRef((props, ref) => {
  const { children, style, ...rest } = props;
  if (hasArabicText(children)) {
    const flatStyle = StyleSheet.flatten(style || {});
    const isBold = ['bold', '500', '600', '700', '800', '900'].includes(
      String(flatStyle.fontWeight),
    );
    const newStyle = [
      style,
      { fontFamily: isBold ? 'Tajawal-Bold' : 'Tajawal-Regular' },
    ];
    return (
      <OriginalText {...rest} style={newStyle} ref={ref}>
        {children}
      </OriginalText>
    );
  }
  return <OriginalText {...props} ref={ref} />;
});

// Copy static properties of Text
Object.keys(OriginalText).forEach(key => {
  WrappedText[key] = OriginalText[key];
});

// Override react-native exports property
Object.defineProperty(reactNative, 'Text', {
  get() {
    return WrappedText;
  },
  configurable: true,
  enumerable: true,
});

// 2. Wrap TextInput Component
const OriginalTextInput = reactNative.TextInput;
const WrappedTextInput = React.forwardRef((props, ref) => {
  const { value, placeholder, style, ...rest } = props;
  const val = value || placeholder || '';
  if (ARABIC_REGEX.test(val)) {
    const flatStyle = StyleSheet.flatten(style || {});
    const isBold = ['bold', '500', '600', '700', '800', '900'].includes(
      String(flatStyle.fontWeight),
    );
    const newStyle = [
      style,
      { fontFamily: isBold ? 'Tajawal-Bold' : 'Tajawal-Regular' },
    ];
    return <OriginalTextInput {...props} style={newStyle} ref={ref} />;
  }
  return <OriginalTextInput {...props} ref={ref} />;
});

// Copy static properties of TextInput
Object.keys(OriginalTextInput).forEach(key => {
  WrappedTextInput[key] = OriginalTextInput[key];
});

Object.defineProperty(reactNative, 'TextInput', {
  get() {
    return WrappedTextInput;
  },
  configurable: true,
  enumerable: true,
});

AppRegistry.registerComponent(appName, () => App);
