// eslint-disable-next-line ts/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'is-loading.cjs', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'is-loading.cjs', null, 'named-import', {
  parser: 'tsx',
})
