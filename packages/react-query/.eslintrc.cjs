// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ['plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
  rules: {
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react-hooks/exhaustive-deps': 'error',
  },
}

module.exports = config
