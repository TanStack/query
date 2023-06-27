const config = {
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  rules: {
    'react/display-name': 'off',
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'error',
  },
}

module.exports = config
