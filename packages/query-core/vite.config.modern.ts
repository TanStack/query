import { defineConfig, mergeConfig } from 'vite'
import { tanstackBuildConfig } from '@tanstack/config/build'
import packageJson from './package.json'

const config = defineConfig({
  build: {
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
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
