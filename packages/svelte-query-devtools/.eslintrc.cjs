/** @type {import('eslint').Linter.Config} */
const config = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    sourceType: 'module',
    extraFileExtensions: ['.svelte'],
  },
  rules: {
    'react-hooks/rules-of-hooks': 'off',
  },
  extends: ['plugin:svelte/recommended', '../../.eslintrc'],
  ignorePatterns: ['*.config.*', '*.setup.*', '**/build/*'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
}

module.exports = config
