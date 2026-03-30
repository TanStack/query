// @ts-check

// @ts-ignore Needed due to moduleResolution Node vs Bundler
import { tanstackConfig } from '@tanstack/eslint-config'
import pluginCspell from '@cspell/eslint-plugin'
import vitest from '@vitest/eslint-plugin'
import oxlint from 'eslint-plugin-oxlint'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const oxlintConfig = /** @type {*} */ (
  await jiti.import('./oxlint.config.ts')
).default

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
      'prefer-const': 'off',
    },
  },
  {
    name: 'tanstack/linter-options',
    linterOptions: {
      // eslint-disable comments are shared with oxlint — don't warn
      // about directives ESLint considers unused
      reportUnusedDisableDirectives: 'off',
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
  // Must be last — disables ESLint rules that oxlint already covers
  ...oxlint.buildFromOxlintConfig(oxlintConfig),
]
