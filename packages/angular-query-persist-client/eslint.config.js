// @ts-check

import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([
  ...rootConfig,
  {
    rules: {
      'cspell/spellchecker': [
        'warn',
        {
          cspell: {
            ignoreRegExpList: ['\\ɵ.+'],
          },
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/__tests__/**'],
    rules: {
      'jsdoc/require-hyphen-before-param-description': 1,
      'jsdoc/sort-tags': 1,
      'jsdoc/require-throws': 1,
      'jsdoc/check-tag-names': [
        'warn',
        {
          // Not compatible with Api Extractor @public
          typed: false,
        },
      ],
    },
  },
])
