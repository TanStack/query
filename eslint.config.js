// @ts-check

// @ts-ignore Needed due to moduleResolution Node vs Bundler
import { tanstackConfig } from '@tanstack/eslint-config'
import pluginCspell from '@cspell/eslint-plugin'
import vitest from '@vitest/eslint-plugin'

export default [
  ...tanstackConfig,
  {
    name: 'tanstack/temp',
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
            'CallExpression[callee.type="MemberExpression"][callee.property.name="fetchQuery"]',
          message: 'Use queryClient.query(options) instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="prefetchQuery"]',
          message:
            'Use queryClient.query(options).catch(noop) instead if errors should be swallowed.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="ensureQueryData"]',
          message:
            "Use queryClient.query({ ...options, staleTime: 'static' }) instead.",
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="fetchInfiniteQuery"]',
          message: 'Use queryClient.infiniteQuery(options) instead.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="prefetchInfiniteQuery"]',
          message:
            'Use queryClient.infiniteQuery(options).catch(noop) instead if errors should be swallowed.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="ensureInfiniteQueryData"]',
          message:
            "Use queryClient.infiniteQuery({ ...options, staleTime: 'static' }) instead.",
        },
      ],
      'prefer-const': 'off',
    },
  },
  {
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
]
