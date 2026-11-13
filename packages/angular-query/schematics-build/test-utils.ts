import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type * as Schematics from '@angular-devkit/schematics'
import type * as Testing from '@angular-devkit/schematics/testing'

// Point to an isolated installed Angular workspace to exercise the same tests
// against its DevKit, utilities, and TypeScript instead of the monorepo versions.
const compatibilityRoot = process.env.ANGULAR_SCHEMATICS_TEST_ROOT
const loadModule = createRequire(
  compatibilityRoot
    ? resolve(compatibilityRoot, 'package.json')
    : import.meta.url,
)

export const { Tree } = loadModule(
  '@angular-devkit/schematics',
) as typeof Schematics
export const { SchematicTestRunner } = loadModule(
  '@angular-devkit/schematics/testing',
) as typeof Testing
export const devtoolsPackage = JSON.parse(
  readFileSync(resolve('../angular-query-devtools/package.json'), 'utf8'),
) as { name: string; version: string }
export const queryCollection = compatibilityRoot
  ? resolve(
      compatibilityRoot,
      'node_modules/@tanstack/angular-query/schematics/collection.json',
    )
  : resolve('dist/schematics/collection.json')
export const angularCollection = resolve(
  dirname(loadModule.resolve('@schematics/angular/package.json')),
  'collection.json',
)
