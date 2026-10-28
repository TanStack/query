import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
  overrides: [
    {
      files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
      rules: {
        'vitest/expect-expect': [
          'error',
          {
            assertFunctionNames: [
              'expect',
              'expectSignals',
              'expectTypeOf',
              'assertType',
            ],
          },
        ],
      },
    },
    {
      files: ['**/__tests__/**'],
      rules: {
        'typescript/no-unnecessary-condition': 'off',
        'typescript/require-await': 'off',
      },
    },
  ],
})
