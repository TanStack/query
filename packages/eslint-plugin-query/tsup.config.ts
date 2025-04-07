import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    rules: 'src/rules.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    entry: './src/index.ts',
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  target: 'node20',
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['typescript'],
})
