import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteBuildConfig } from '../../scripts/getViteConfig.js'

export default mergeConfig(
  viteBuildConfig({
    entry: ['./src/index.ts', './src/production.ts'],
    srcDir: './src',
  }),
  defineConfig({
    plugins: [vue()],
  }),
)
