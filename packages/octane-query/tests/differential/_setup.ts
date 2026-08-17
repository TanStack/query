import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'
import { compile as compileToReact } from '@tsrx/react'

const directory = dirname(fileURLToPath(import.meta.url))
const fixtureDirectory = join(directory, '../_fixtures')
const cacheDirectory = join(directory, '.react-cache')
const fixtureNames = ['cached-diff.tsrx', 'async-diff.tsrx']

function hashString(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

function compileFixture(sourcePath: string): void {
  const source = readFileSync(sourcePath, 'utf8')
  const compiled = compileToReact(source, sourcePath)
  if (compiled.errors.length) {
    throw new Error(`React compilation failed for ${sourcePath}`)
  }

  const transformed = transformSync(compiled.code, {
    loader: 'tsx',
    jsx: 'automatic',
    jsxImportSource: 'react',
    target: 'esnext',
    format: 'esm',
    sourcefile: sourcePath,
  })
  const rewritten = transformed.code
    .replace(
      /from\s+["']@tanstack\/octane-query(\/[^"']*)?["']/g,
      (_match, subpath) => `from "@tanstack/react-query${subpath || ''}"`,
    )
    .replace(/from\s+["']octane["']/g, 'from "react"')
  const slug = basename(sourcePath).replace(/\.tsrx$/, '')
  const outputPath = join(
    cacheDirectory,
    `${slug}-${hashString(sourcePath)}.js`,
  )
  writeFileSync(outputPath, rewritten)
}

export function setup(): void {
  rmSync(cacheDirectory, { force: true, recursive: true })
  mkdirSync(cacheDirectory, { recursive: true })
  for (const fixtureName of fixtureNames) {
    compileFixture(join(fixtureDirectory, fixtureName))
  }
}

export function teardown(): void {
  rmSync(cacheDirectory, { force: true, recursive: true })
}
