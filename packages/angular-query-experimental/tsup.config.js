import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/devtools-panel/index.ts',
    'src/devtools-panel/stub.ts',
    'src/devtools/index.ts',
    'src/devtools/stub.ts',
    'src/index.ts',
  ],
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: {
    entry: [
      'src/devtools-panel/index.ts',
      'src/devtools/index.ts',
      'src/index.ts',
    ],
  },
  outDir: 'build',
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.js' }
  },
  splitting: false,
})
