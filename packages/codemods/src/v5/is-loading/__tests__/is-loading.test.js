// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'is-loading', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'is-loading', null, 'named-import', {
  parser: 'tsx',
})
