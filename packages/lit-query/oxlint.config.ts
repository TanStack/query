import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  overrides: [
    {
      files: ['**/__tests__/**'],
      rules: {
        'typescript/no-unnecessary-condition': 'off',
      },
    },
  ],
})
