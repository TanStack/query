import { describe, it, expect } from 'vitest'
global.describe = describe
global.it = it
global.expect = expect

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(
  __dirname,
  'replace-import-specifier',
  null,
  'replace-import-specifier',
  {
    parser: 'tsx',
  },
)
