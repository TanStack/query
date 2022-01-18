// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

jest.autoMockOff()

const transformName = 'query-client-methods'

defineTest(__dirname, transformName, null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, transformName, null, 'named-import', {
  parser: 'tsx',
})

defineTest(__dirname, transformName, null, 'namespaced-import', {
  parser: 'tsx',
})

defineTest(__dirname, transformName, null, 'parameter-is-identifier', {
  parser: 'tsx',
})

defineTest(__dirname, transformName, null, 'parameter-is-object-expression', {
  parser: 'tsx',
})
