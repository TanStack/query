// @ts-check

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: ['es2020', 'node16'],
  outDir: 'build/lib',
  external: [/eslint/],
  sourcemap: true,
  clean: true,
})
