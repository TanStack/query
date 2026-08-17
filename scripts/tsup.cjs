const Module = require('module')
const path = require('path')

// tsup 8 uses the legacy TypeScript compiler API for declaration builds.
// TypeScript 7 no longer exposes that API, so use the TypeScript 6 alias for
// tsup while TypeScript 7 remains the current compiler for type tests.
const typescriptPath = require.resolve('typescript60')
const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'typescript') {
    return typescriptPath
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

const tsupCli = path.join(
  path.dirname(require.resolve('tsup')),
  'cli-default.js',
)
require(tsupCli)
