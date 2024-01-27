// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'plugin:@cspell/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  env: {
    browser: true,
    es2020: true,
  },
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: true,
    },
    react: {
      version: 'detect',
    },
  },
  rules: {
    '@cspell/spellchecker': [
      'error',
      {
        cspell: {
          words: [
            'tanstack', // Our package scope
            'tsqd', // Our public interface (TanStack Query Devtools shorthand)
            'retryer', // Our public interface
            'Promisable', // Our public interface
            'extralight', // Our public interface
            'codemod', // We support our codemod

            'TSES', // @typescript-eslint package's interface
            'tsup', // We use tsup as builder
            'solidjs', // Our target framework
            'tabular-nums', // https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
            'todos', // Too general word to be caught as error
          ],
        },
      },
    ],
    '@typescript-eslint/array-type': [
      'error',
      { default: 'generic', readonly: 'generic' },
    ],
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-inferrable-types': [
      'error',
      { ignoreParameters: true },
    ],
    'import/default': 'off',
    'import/export': 'off',
    'import/namespace': 'off',
    'import/newline-after-import': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unresolved': ['error', { ignore: ['^@tanstack/'] }],
    'import/no-unused-modules': ['off', { unusedExports: true }],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
      },
    ],
    'no-redeclare': 'off',
    'no-shadow': 'error',
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unnecessary-condition': 'off',
      },
    },
  ],
}

module.exports = config
