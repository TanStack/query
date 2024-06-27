import { defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { tanstackViteConfig } from '@tanstack/config/vite'

const config = defineConfig({
  plugins: [vue()],
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['src/index.ts', 'src/production.ts'],
    srcDir: 'src',
  }),
)
