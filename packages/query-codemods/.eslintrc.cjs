// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  overrides: [
    {
      files: ['**/__testfixtures__/*'],
      rules: {
        'import/no-unresolved': 'off',
        'sort-imports': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
      },
    },
  ],
}

module.exports = config
