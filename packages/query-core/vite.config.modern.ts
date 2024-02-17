import { defineConfig, mergeConfig } from 'vite'
import { tanstackBuildConfig } from '@tanstack/config/build'

const config = defineConfig({
  build: {
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
  },
})

export default mergeConfig(
  config,
  tanstackBuildConfig({
    entry: './src/index.ts',
    srcDir: './src',
    exclude: ['./src/tests'],
    outDir: './dist/modern',
  }),
)
