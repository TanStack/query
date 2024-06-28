// eslint-disable-next-line ts/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'keep-previous-data.cjs', null, 'default', {
  parser: 'tsx',
})

defineTest(__dirname, 'keep-previous-data.cjs', null, 'named', {
  parser: 'tsx',
})
