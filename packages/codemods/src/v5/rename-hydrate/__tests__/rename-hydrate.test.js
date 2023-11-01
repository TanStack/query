// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'rename-hydrate', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'rename-hydrate', null, 'named-import', {
  parser: 'tsx',
})
