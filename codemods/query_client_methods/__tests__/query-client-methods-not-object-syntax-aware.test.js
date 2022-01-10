// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

jest.autoMockOff()

const transformName = 'not-object-syntax-aware'

defineTest(
  __dirname,
  transformName,
  null,
  'not-object-syntax-aware/default-import',
  {
    parser: 'tsx',
  }
)

defineTest(
  __dirname,
  transformName,
  null,
  'not-object-syntax-aware/named-import',
  {
    parser: 'tsx',
  }
)

defineTest(
  __dirname,
  transformName,
  null,
  'not-object-syntax-aware/namespaced-import',
  {
    parser: 'tsx',
  }
)
