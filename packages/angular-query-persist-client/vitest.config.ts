import angular from '@analogjs/vite-plugin-angular'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  plugins: [angular()],
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    globals: true,
    restoreMocks: true,
  },
})
