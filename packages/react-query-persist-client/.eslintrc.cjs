const config = {
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  rules: {
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react-hooks/exhaustive-deps': 'error',
  },
}

module.exports = config
