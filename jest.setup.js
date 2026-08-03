/* eslint-env jest, node, es2020 */
/**
 * Test environment setup.
 *
 * Every module below reaches a native module that does not exist under Jest.
 * Without a stand-in, importing anything that transitively pulls one in fails
 * the whole suite before a single assertion runs — which is what used to happen
 * to __tests__/App.test.tsx.
 */

// Ships its own mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The bundled mock puts everything on `default` and does not provide the two
// components App.tsx renders, so importing them by name yielded undefined —
// which React reports as the unhelpful "Element type is invalid".
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const bundled = require('react-native-safe-area-context/jest/mock').default;
  const Passthrough = ({ children, ...props }) =>
    React.createElement(View, props, children);
  return {
    __esModule: true,
    ...bundled,
    SafeAreaProvider: Passthrough,
    SafeAreaView: Passthrough,
  };
});

// Backed by the Keystore/Keychain; see src/utils/secureStorage.ts.
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn().mockResolvedValue({ didCancel: true }),
  launchCamera: jest.fn().mockResolvedValue({ didCancel: true }),
}));

jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Requires the RNCWebViewModule turbo module, which is not registered in Jest.
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );
  WebView.displayName = 'WebView';
  return { WebView, default: WebView, __esModule: true };
});

// Native view capture, used to save the QR invitation card.
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('file:///tmp/card.png'),
}));

// Writes to the device gallery through MediaStore.
jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    saveAsset: jest.fn().mockResolvedValue({ node: { image: { uri: '' } } }),
  },
}));

// Would try to open a real connection during tests.
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

// jsdom/node has no fetch behaviour worth relying on here, and a test that hits
// the real network is not a test.
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: { get: () => 'application/json' },
  }),
);
