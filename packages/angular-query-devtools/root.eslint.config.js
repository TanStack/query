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
              'Promisable',
              'TSES',
              'codemod',
              'combinate',
              'datatag',
              'extralight',
              'jscodeshift',
              'refetches',
              'retryer',
              'solidjs',
              'tabular-nums',
              'tanstack',
              'todos',
              'tsqd',
              'tsup',
              'typecheck',
              'vue-demi',
              'ɵkind',
              'ɵproviders',
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
