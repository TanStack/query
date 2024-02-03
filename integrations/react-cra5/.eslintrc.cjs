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
    project: './tsconfig.json',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
