const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'remove-overloads.cjs', null, 'default-import', {
  parser: 'tsx',
})

defineTest(__dirname, 'remove-overloads.cjs', null, 'bug-reports', {
  parser: 'tsx',
})
