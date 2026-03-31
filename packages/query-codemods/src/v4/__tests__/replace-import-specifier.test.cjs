const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(
  __dirname,
  'replace-import-specifier.cjs',
  null,
  'replace-import-specifier',
  {
    parser: 'tsx',
  },
)
