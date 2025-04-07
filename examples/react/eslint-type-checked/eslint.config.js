// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  pluginQuery.configs['flat/recommendedTypeChecked'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
)
