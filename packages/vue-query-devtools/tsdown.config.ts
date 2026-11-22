import { defineConfig } from 'tsdown'
import vue from 'unplugin-vue/vite'
import { browserTargets } from './root.tsdown.config.js'

export default defineConfig({
  plugins: [vue()],
  entry: ['src/**/*.ts', '!src/__tests__/**'],
  format: ['esm'],
  target: browserTargets,
  outDir: 'dist',
  unbundle: true,
  dts: true,
  fixedExtension: false,
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
