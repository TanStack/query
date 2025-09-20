import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: ['es2022'],
  outDir: 'dist-test',
  unbundle: true,
  dts: true,
  sourcemap: true,
  clean: true,
})
