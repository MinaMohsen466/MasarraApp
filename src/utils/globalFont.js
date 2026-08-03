/**
 * Applies the app's Tajawal font to every <Text> / <TextInput> that has not
 * explicitly asked for a different family.
 *
 * It does this by replacing the `Text` and `TextInput` properties on the
 * `react-native` module object, which is how ~440 existing call sites keep
 * working without being touched. That is deliberate, but it is not something
 * React Native supports: if a future version makes those exports
 * non-configurable, the overrides below fail loudly and the app falls back to
 * the system font instead of refusing to boot.
 *
 * IMPORT THIS FIRST, before anything that renders text (see index.js). ES
 * imports are hoisted and evaluated in source order, so a module imported ahead
 * of this one could capture the original components before they are replaced.
 */
import React from 'react';
import { StyleSheet } from 'react-native';

const reactNative = require('react-native');

// Families that mean "nobody chose deliberately" and should get the app font.
const SYSTEM_FONTS = ['System', 'Arial', 'sans-serif', 'normal', 'Roboto'];
const BOLD_WEIGHTS = ['bold', '500', '600', '700', '800', '900'];

// Allocated once. Building these inline produced a fresh object *and* a fresh
// style array on every text render in the app.
const REGULAR_FONT = { fontFamily: 'Tajawal-Regular' };
const BOLD_FONT = { fontFamily: 'Tajawal-Bold' };

/**
 * The font style to append, or null when the caller picked its own family and
 * should be left alone.
 */
const resolveFont = style => {
  // One flatten per render. The previous version flattened twice: once to test
  // the family, then again to read the weight.
  const flat = StyleSheet.flatten(style || {});
  const family = flat.fontFamily;
  if (family && !SYSTEM_FONTS.includes(family)) {
    return null;
  }
  return BOLD_WEIGHTS.includes(String(flat.fontWeight))
    ? BOLD_FONT
    : REGULAR_FONT;
};

const withAppFont = (Original, displayName) => {
  const Wrapped = React.forwardRef((props, ref) => {
    const fontStyle = resolveFont(props.style);
    if (!fontStyle) {
      return <Original {...props} ref={ref} />;
    }
    return <Original {...props} style={[props.style, fontStyle]} ref={ref} />;
  });

  // Deliberately Object.keys and not getOwnPropertyNames: forwardRef components
  // carry non-enumerable `$$typeof` and `render` properties, and copying those
  // across would turn the wrapper back into the original and silently drop the
  // font entirely.
  Object.keys(Original).forEach(key => {
    Wrapped[key] = Original[key];
  });

  Wrapped.displayName = displayName;
  return Wrapped;
};

const override = (name, Wrapped) => {
  try {
    Object.defineProperty(reactNative, name, {
      get() {
        return Wrapped;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (error) {
    // Losing the custom font is recoverable; failing to start is not.
    console.error(`[globalFont] Could not override ${name}:`, error);
  }
};

override('Text', withAppFont(reactNative.Text, 'AppText'));
override('TextInput', withAppFont(reactNative.TextInput, 'AppTextInput'));
