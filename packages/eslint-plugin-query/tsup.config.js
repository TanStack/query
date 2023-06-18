// @ts-check

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: ['chrome84', 'firefox90', 'edge84', 'safari15', 'ios15', 'opera70'],
  outDir: 'build/lib',
  external: [/eslint/],
  sourcemap: true,
  clean: true,
})
