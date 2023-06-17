import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts'],
  format: ['cjs', 'esm'],
  target: 'es2020',
  bundle: false,
  splitting: false,
  sourcemap: true,
  clean: true,
})
