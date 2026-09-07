import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: true,
  fixedExtension: false,
  outDir: 'build',
  outExtensions({ format }) {
    return format === 'es' ? { js: '.mjs', dts: '.d.ts' } : { js: '.js' }
  },
})
