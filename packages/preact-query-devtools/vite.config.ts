import preact from '@preact/preset-vite'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json'
import type { UserConfig as ViteUserConfig } from 'vite'

export default defineConfig({
  plugins: [preact() as ViteUserConfig['plugins']],
  resolve: { conditions: ['@tanstack/custom-condition'] },
  environments: {
    ssr: { resolve: { conditions: ['@tanstack/custom-condition'] } },
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: {
      enabled: !!process.env.CI,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})
