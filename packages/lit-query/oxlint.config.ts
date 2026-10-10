import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
  overrides: [
    {
      files: ['**/__tests__/**'],
      rules: {
        'typescript/no-unnecessary-condition': 'off',
      },
    },
  ],
})
