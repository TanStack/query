// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'remove-overloads', null, 'default-import', {
  parser: 'tsx',
})
