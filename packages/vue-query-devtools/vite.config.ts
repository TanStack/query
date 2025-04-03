import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { tanstackViteConfig } from '@tanstack/config/vite'

import { dynamicAliases } from './root.vite.config'

const config = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: dynamicAliases,
    conditions: ['@tanstack/custom-condition'],
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['src/index.ts', 'src/production.ts'],
    srcDir: 'src',
  }),
)
