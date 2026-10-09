import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  overrides: [
    {
      files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
      rules: {
        'vitest/expect-expect': [
          'warn',
          { assertFunctionNames: ['expect', 'expectArrayEqualIgnoreOrder'] },
        ],
      },
    },
  ],
})
