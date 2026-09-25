import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/**/*.ts', '!src/__tests__/**'],
  format: ['esm'],
  target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
  // Rolldown lowers private fields for browser target arrays. Keep the
  // transform target at ES2022 to match the syntax that tsup emitted.
  inputOptions: { transform: { target: 'es2022' } },
  outDir: 'dist',
  unbundle: true,
  dts: true,
  fixedExtension: true,
  sourcemap: true,
  clean: true,
  publint: {
    strict: true,
  },
  attw: {
    profile: 'esm-only',
    level: 'error',
  },
})
