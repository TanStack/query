import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
  overrides: [
    {
      files: ['**/*.test.ts'],
      rules: {
        // `expectText` polls the DOM and asserts with `expect`
        'vitest/expect-expect': [
          'error',
          { assertFunctionNames: ['expect', 'expectText'] },
        ],
      },
    },
  ],
})
