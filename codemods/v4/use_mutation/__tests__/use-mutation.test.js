// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

jest.autoMockOff()

defineTest(__dirname, 'use-mutation', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'use-mutation', null, 'named-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'use-mutation', null, 'namespaced-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'use-mutation', null, 'parameter-is-identifier', {
  parser: 'tsx',
})

defineTest(__dirname, 'use-mutation', null, 'parameter-is-object-expression', {
  parser: 'tsx',
})
