import { defineConfig } from 'vitest/config'
import angular from '@analogjs/vite-plugin-angular'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  plugins: [angular()],
  test: {
    name: packageJson.name,
    dir: './src/__tests__',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    include: ['**/*.{test,spec}.{ts,mts,cts,tsx,js,mjs,cjs,jsx}'],
    globals: true,
    restoreMocks: true,
  },
})
