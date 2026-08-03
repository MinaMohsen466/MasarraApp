module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The RN preset only transforms react-native and @react-native*. Everything
  // else in node_modules is left as-is, and these packages ship untranspiled ESM,
  // so importing any of them throws "Cannot use import statement outside a module".
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(' +
      [
        '(jest-)?react-native',
        '@react-native(-community)?',
        '@react-native-async-storage',
        'react-native-vector-icons',
        'react-native-webview',
        'react-native-svg',
        'react-native-safe-area-context',
        'react-native-keychain',
        'react-native-image-picker',
      ].join('|') +
      ')/)',
  ],
  moduleNameMapper: {
    // Static assets are not resolvable under Jest.
    '\\.(png|jpg|jpeg|gif|webp|svg|ttf|otf)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
};
