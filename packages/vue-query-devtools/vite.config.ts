import { defineConfig, mergeConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { tanstackViteConfig } from '@tanstack/vite-config'

import packageJson from './package.json'

const config = defineConfig({
  plugins: [vue()],
  // fix from https://github.com/vitest-dev/vitest/issues/6992#issuecomment-2509408660
  resolve: {
    conditions: ['@tanstack/custom-condition'],
  },
  environments: {
    ssr: {
      resolve: {
        conditions: ['@tanstack/custom-condition'],
      },
    },
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['src/index.ts', 'src/production.ts'],
    srcDir: 'src',
  }),
)
