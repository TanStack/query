// @ts-check

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts', 'src/*.tsx'],
  format: ['cjs', 'esm'],
  target: ['chrome84', 'firefox90', 'edge84', 'safari15', 'ios15', 'opera70'],
  outDir: 'build/lib',
  bundle: false,
  splitting: false,
  dts: true,
  sourcemap: true,
  clean: true,
})
