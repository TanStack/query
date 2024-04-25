// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'key-transformation.cjs', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'key-transformation.cjs', null, 'named-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'key-transformation.cjs', null, 'namespaced-import', {
  parser: 'tsx',
})

defineTest(
  __dirname,
  'key-transformation.cjs',
  null,
  'parameter-is-identifier',
  {
    parser: 'tsx',
  },
)

defineTest(
  __dirname,
  'key-transformation.cjs',
  null,
  'parameter-is-object-expression',
  {
    parser: 'tsx',
  },
)

defineTest(__dirname, 'key-transformation.cjs', null, 'type-arguments', {
  parser: 'tsx',
})
