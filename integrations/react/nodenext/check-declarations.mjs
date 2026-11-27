import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const types = readFileSync(
  new URL('./dist/sharedTypes.d.ts', import.meta.url),
  'utf8',
)
const publicPackages = new Set([
  '@tanstack/query-core',
  '@tanstack/query-core-pluggable',
  '@tanstack/react-query',
  '@tanstack/react-query-pluggable',
])
for (const [, specifier] of types.matchAll(/import\(["']([^"']+)["']\)/g)) {
  assert.ok(
    publicPackages.has(specifier),
    'Private declaration import: ' + specifier,
  )
}
