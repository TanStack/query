// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'keep-previous-data', null, 'default', {
  parser: 'tsx',
})

defineTest(__dirname, 'keep-previous-data', null, 'named', {
  parser: 'tsx',
})
