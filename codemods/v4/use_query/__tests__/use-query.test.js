// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

jest.autoMockOff()

defineTest(__dirname, 'use-query', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'use-query', null, 'named-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'use-query', null, 'namespaced-import', {
  parser: 'tsx',
})
