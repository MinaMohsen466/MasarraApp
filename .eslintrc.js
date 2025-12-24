module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Performance & Optimization
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-bind': ['warn', { allowArrowFunctions: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // Code Quality
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // React Native Specific
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'warn',
    'react-native/no-color-literals': 'off',
    
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
