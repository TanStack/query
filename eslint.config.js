// @ts-check

// @ts-ignore Needed due to moduleResolution Node vs Bundler
import { tanstackConfig } from '@tanstack/eslint-config'
import pluginCspell from '@cspell/eslint-plugin'
import vitest from '@vitest/eslint-plugin'
import pluginJsdoc from 'eslint-plugin-jsdoc'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tanstackConfig,
  {
    name: 'tanstack/query/jsdoc',
    files: ['**/src/**/*.{ts,tsx}'],
    ignores: [
      '**/__tests__/**',
      '**/__testfixtures__/**',
      '**/*.test.{ts,tsx}',
      '**/*.test-d.{ts,tsx}',
    ],
    extends: [pluginJsdoc.configs['flat/recommended-typescript-error']],
    rules: {
      'jsdoc/check-tag-names': ['error', { definedTags: ['defaultValue'] }],
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/require-param': ['error', { checkDestructured: false }],
      'jsdoc/check-template-names': 'error',
      'jsdoc/no-bad-blocks': 'error',
      'jsdoc/no-blank-block-descriptions': 'error',
      'jsdoc/no-blank-blocks': 'error',
      'jsdoc/require-asterisk-prefix': 'error',
      'jsdoc/require-hyphen-before-param-description': 'error',
      'jsdoc/require-next-description': 'error',
      'jsdoc/require-template-description': 'error',
      'jsdoc/require-throws': 'error',
      'jsdoc/require-throws-description': 'error',
      'jsdoc/require-yields-description': 'error',
    },
  },
  {
    name: 'tanstack/query',
    plugins: {
      cspell: pluginCspell,
    },
    rules: {
      'cspell/spellchecker': [
        'warn',
        {
          cspell: {
            words: [
              'Promisable', // Our public interface
              'TSES', // @typescript-eslint package's interface
              'codemod', // We support our codemod
              'combinate', // Library name
              'datatag', // Query options tagging
              'extralight', // Our public interface
              'jscodeshift',
              'refetches', // Query refetch operations
              'retryer', // Our public interface
              'solidjs', // Our target framework
              'tabular-nums', // https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
              'tanstack', // Our package scope
              'todos', // Too general word to be caught as error
              'tsqd', // Our public interface (TanStack Query Devtools shorthand)
              'tsdown', // We use tsdown as builder
              'typecheck', // Field of vite.config.ts
              'vue-demi', // dependency of @tanstack/vue-query
              'ɵkind', // Angular specific
              'ɵproviders', // Angular specific
            ],
          },
        },
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-case-declarations': 'off',
      /**
       * Disallows direct calls to deprecated imperative query methods of `QueryClient`
       * for new tests and code
       *
       * Existing tests that directly test the methods from before the refactoring
       * will be grandfathered in and allowed to continue using the deprecated methods.
       * They should not be removed, but new tests should use the new methods instead.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="fetchQuery"], [callee.computed=true][callee.property.value="fetchQuery"])',
          message: 'Use queryClient.query(options) instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="prefetchQuery"], [callee.computed=true][callee.property.value="prefetchQuery"])',
          message:
            'Use queryClient.query(options).catch(noop) instead if errors should be swallowed.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="ensureQueryData"], [callee.computed=true][callee.property.value="ensureQueryData"])',
          message:
            "Use queryClient.query({ ...options, staleTime: 'static' }) instead.",
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="fetchInfiniteQuery"], [callee.computed=true][callee.property.value="fetchInfiniteQuery"])',
          message: 'Use queryClient.infiniteQuery(options) instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="prefetchInfiniteQuery"], [callee.computed=true][callee.property.value="prefetchInfiniteQuery"])',
          message:
            'Use queryClient.infiniteQuery(options).catch(noop) instead if errors should be swallowed.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"]:matches([callee.property.name="ensureInfiniteQueryData"], [callee.computed=true][callee.property.value="ensureInfiniteQueryData"])',
          message:
            "Use queryClient.infiniteQuery({ ...options, staleTime: 'static' }) instead.",
        },
      ],
      'prefer-const': 'off',
    },
  },
  {
    name: 'tanstack/query/vitest',
    files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/consistent-test-it': [
        'error',
        { fn: 'it', withinDescribe: 'it' },
      ],
      'vitest/no-standalone-expect': [
        'error',
        {
          additionalTestBlockFunctions: ['itIf'],
        },
      ],
    },
    settings: { vitest: { typecheck: true } },
  },
])
