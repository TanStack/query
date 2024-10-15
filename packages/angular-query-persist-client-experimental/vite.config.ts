import { defineConfig } from 'vitest/config'
import packageJson from './package.json'

export default defineConfig({
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    globals: true,
    restoreMocks: true,
  },
})
