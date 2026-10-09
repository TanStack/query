import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  overrides: [
    {
      // TODO: These were never applied to Svelte components by ESLint
      files: ['**/*.svelte'],
      rules: {
        'import-js/order': 'off',
        'import/no-duplicates': 'off',
      },
    },
    {
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      rules: {
        // Svelte runes and proxy state produce false positives for this rule.
        'typescript/no-unnecessary-condition': 'off',
      },
    },
  ],
})
