import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
  rules: {
    'cspell/spellchecker': 'off',
    'typescript/no-unnecessary-condition': 'off',
    'import/no-duplicates': 'off',
    'import-js/order': 'off',
    'no-shadow': 'off',
    'sort-imports': 'off',
  },
  overrides: [
    {
      // The codemods are CommonJS modules run by jscodeshift
      files: ['**/*.cjs'],
      rules: {
        'import/no-commonjs': 'off',
      },
    },
    {
      files: ['src/**/__testfixtures__/**'],
      rules: {
        // Codemod fixtures intentionally preserve historical QueryClient syntax.
        'tanstack-query/no-restricted-syntax': 'off',
      },
    },
  ],
})
