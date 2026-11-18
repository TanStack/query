import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  test: {
    name: `${packageJson.name}:schematics`,
    environment: 'node',
    include: ['./schematics-build/**/*.test.ts'],
    watch: false,
  },
})
