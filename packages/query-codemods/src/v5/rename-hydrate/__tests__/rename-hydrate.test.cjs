// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'rename-hydrate.cjs', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'rename-hydrate.cjs', null, 'named-import', {
  parser: 'tsx',
})
