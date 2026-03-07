// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginCspell from '@cspell/eslint-plugin'
import unusedImports from 'eslint-plugin-unused-imports'
import vitest from '@vitest/eslint-plugin'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...tanstackConfig,
  {
    name: 'tanstack/temp',
    plugins: {
      cspell: pluginCspell,
      'unused-imports': unusedImports,
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
              'tsup', // We use tsup as builder
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
      'no-shadow': 'off',
      'pnpm/enforce-catalog': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'prefer-const': 'off',
      'unused-imports/no-unused-imports': 'warn',
    },
  },
  {
    files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-standalone-expect': [
        'error',
        {
          additionalTestBlockFunctions: ['testIf'],
        },
      ],
    },
    settings: { vitest: { typecheck: true } },
  },
]

export default config
