import { defineConfig } from 'oxlint'
import rootConfig, { preactConfig } from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig, preactConfig],
  overrides: [
    {
      files: ['**/__tests__/**'],
      rules: {
        'typescript/no-unnecessary-condition': 'off',
      },
    },
  ],
})
