// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ['../../.eslintrc'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.eslint.json',
    sourceType: 'module',
  },
}

module.exports = config
