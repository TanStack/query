// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'key-transformation', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'key-transformation', null, 'named-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'key-transformation', null, 'namespaced-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'key-transformation', null, 'parameter-is-identifier', {
  parser: 'tsx',
})

defineTest(
  __dirname,
  'key-transformation',
  null,
  'parameter-is-object-expression',
  {
    parser: 'tsx',
  },
)

defineTest(__dirname, 'key-transformation', null, 'type-arguments', {
  parser: 'tsx',
})
