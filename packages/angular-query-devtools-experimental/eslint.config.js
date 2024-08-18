// @ts-check

import pluginJsdoc from 'eslint-plugin-jsdoc'
import rootConfig from '../../eslint.config.js'

// eslint-disable-next-line jsdoc/check-tag-names
/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...rootConfig,
  pluginJsdoc.configs['flat/recommended-typescript'],
  {
    rules: {
      'jsdoc/require-hyphen-before-param-description': 1,
      'jsdoc/sort-tags': 1,
      'jsdoc/require-throws': 1,
      'jsdoc/check-tag-names': ['warn'],
    },
  },
]
