// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ['plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
  plugins: ['react-compiler'],
  rules: {
    'react-compiler/react-compiler': 'error',
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react-hooks/exhaustive-deps': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/**'],
      rules: {
        'react-compiler/react-compiler': 'off',
      },
    },
  ],
}

module.exports = config
