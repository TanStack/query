import { defineConfig, mergeConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { tanstackBuildConfig } from '@tanstack/config/build'

const config = defineConfig({
  plugins: [vue()],
})

export default mergeConfig(
  config,
  tanstackBuildConfig({
    entry: ['src/index.ts', 'src/production.ts'],
    srcDir: 'src',
  }),
)
