/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    '../../.eslintrc.cjs',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
