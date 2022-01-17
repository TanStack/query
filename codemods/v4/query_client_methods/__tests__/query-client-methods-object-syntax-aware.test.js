// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

jest.autoMockOff()

const transformName = 'object-syntax-aware'

defineTest(
  __dirname,
  transformName,
  null,
  'object-syntax-aware/default-import',
  {
    parser: 'tsx',
  }
)

defineTest(__dirname, transformName, null, 'object-syntax-aware/named-import', {
  parser: 'tsx',
})

defineTest(
  __dirname,
  transformName,
  null,
  'object-syntax-aware/namespaced-import',
  {
    parser: 'tsx',
  }
)

defineTest(
  __dirname,
  transformName,
  null,
  'object-syntax-aware/first-parameter-is-identifier',
  {
    parser: 'tsx',
  }
)

defineTest(
  __dirname,
  transformName,
  null,
  'object-syntax-aware/object-expression-parameter',
  {
    parser: 'tsx',
  }
)
