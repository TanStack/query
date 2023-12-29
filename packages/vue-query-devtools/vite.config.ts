import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { getViteConfig } from '../../scripts/getViteConfig.js'

export default mergeConfig(
  getViteConfig({
    entry: ['./src/index.ts', './src/production.ts'],
    srcDir: './src',
  }),
  defineConfig({
    plugins: [vue()],
  }),
)
