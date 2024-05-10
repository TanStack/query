// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'rename-properties.cjs', null, 'rename-cache-time', {
  parser: 'tsx',
})

defineTest(
  __dirname,
  'rename-properties.cjs',
  null,
  'rename-use-error-boundary',
  {
    parser: 'tsx',
  },
)
