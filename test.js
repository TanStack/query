// @ts-check

import ts from 'typescript'
import tsconfig from './tsconfig.json' assert { type: 'json' }
import { resolve, join, dirname } from 'node:path'
import fs from 'node:fs'

const filename = join('knip.ts')
let contents = fs.readFileSync(filename, 'utf-8')
console.log(contents)
console.log('\n\n')
contents = await transpile_ts(filename, contents)
console.log(contents)

/**
 * TS -> JS
 *
 * @param {string} filename
 * @param {string} source
 */
export async function transpile_ts(filename, source) {
  const ts = await try_load_ts()
  const options = load_tsconfig(filename, ts)
  // transpileModule treats NodeNext as CommonJS because it doesn't read the package.json. Therefore we need to override it.
  // Also see https://github.com/microsoft/TypeScript/issues/53022 (the filename workaround doesn't work).
  return ts.transpileModule(source, {
    compilerOptions: {
      ...options,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
    fileName: filename,
  }).outputText
}

async function try_load_ts() {
  try {
    return (await import('typescript')).default
  } catch (e) {
    throw new Error(
      'You need to install TypeScript if you want to transpile TypeScript files and/or generate type definitions',
    )
  }
}

/**
 * @param {string} filename
 * @param {import('typescript')} ts
 */
function load_tsconfig(filename, ts) {
  let config_filename

  // ts.findConfigFile is broken (it will favour a distant tsconfig
  // over a near jsconfig, and then only when you call it twice)
  // so we implement it ourselves
  let dir = filename
  while (dir !== (dir = dirname(dir))) {
    const tsconfig = join(dir, 'tsconfig.json')
    const jsconfig = join(dir, 'jsconfig.json')

    if (fs.existsSync(tsconfig)) {
      config_filename = tsconfig
      break
    }

    if (fs.existsSync(jsconfig)) {
      config_filename = jsconfig
      break
    }
  }

  if (!config_filename) {
    throw new Error('Failed to locate tsconfig or jsconfig')
  }

  const { error, config } = ts.readConfigFile(config_filename, ts.sys.readFile)

  if (error) {
    throw new Error('Malformed tsconfig\n' + JSON.stringify(error, null, 2))
  }

  // Do this so TS will not search for initial files which might take a while
  config.include = []
  config.files = []
  const { options } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    dirname(config_filename),
    { sourceMap: false },
    config_filename,
  )
  return options
}
