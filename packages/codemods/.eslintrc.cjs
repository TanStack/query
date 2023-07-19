// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  overrides: [
    {
      files: ['**/__testfixtures__/*'],
      rules: {
        'import/no-unresolved': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
}

module.exports = config
