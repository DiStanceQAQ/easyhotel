module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['web/**/*.{js,jsx,ts,tsx}'],
      env: { browser: true },
    },
    {
      files: ['app/**/*.{js,jsx,ts,tsx}'],
      env: { browser: true },
      globals: { __DEV__: 'readonly' },
      rules: {
        'react-native/no-color-literals': 'off',
        'react-native/no-raw-text': 'off',
        'react-native/split-platform-components': 'off',
        'react-native/no-inline-styles': 'warn',
        'react-native/no-unused-styles': 'warn',
        'react-native/no-single-element-style-arrays': 'warn',
      },
    },
  ],
};
