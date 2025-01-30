// @ts-check

import path from 'node:path'
import ts from 'typescript'

const tsconfig = ts.readConfigFile(
  path.resolve(__dirname, '..', 'tsconfig.json'),
  ts.sys.readFile,
).config

export const dynamicAliases = Object.entries(
  tsconfig.compilerOptions.paths || {},
).reduce((aliases, [key, [value]]) => {
  const aliasKey = key.replace('/*', '')
  aliases[aliasKey] = path.resolve(value.replace('/*', ''))
  return aliases
}, /** @type {Record<string, string>} */ ({}))
