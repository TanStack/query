// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  plugins: ['jsdoc'],
  extends: ['plugin:jsdoc/recommended-typescript'],
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
}

module.exports = config
