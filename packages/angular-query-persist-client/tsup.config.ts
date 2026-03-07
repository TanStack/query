import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  format: ['esm'],
  experimentalDts: true,
  outDir: 'build',
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.js' }
  },
})
