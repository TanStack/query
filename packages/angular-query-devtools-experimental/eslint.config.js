// @ts-check

import pluginJsdoc from 'eslint-plugin-jsdoc'

// @ts-ignore out of scope
import rootConfig from '../../eslint.config.js'

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
