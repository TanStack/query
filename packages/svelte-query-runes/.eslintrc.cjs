// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ['plugin:svelte/recommended'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    extraFileExtensions: ['.svelte'],
  },
  ignorePatterns: ['*.config.*', '*.setup.*', '**/dist/*'],
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
