// @ts-check

import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/*.ts'],
    format: ['cjs', 'esm'],
    target: ['chrome84', 'firefox90', 'edge84', 'safari15', 'ios15', 'opera70'],
    outDir: 'build/modern',
    bundle: false,
    splitting: false,
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: ['src/*.ts'],
    format: ['cjs', 'esm'],
    target: ['es2020', 'node16'],
    outDir: 'build/legacy',
    bundle: false,
    splitting: false,
    dts: true,
    sourcemap: true,
    clean: true,
  },
])
