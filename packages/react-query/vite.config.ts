import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { tanstackBuildConfig } from '@tanstack/config/build'

const config = defineConfig({
  plugins: [react()],
  test: {
    name: 'react-query',
    include: ['./src'],
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
  },
})

export default mergeConfig(
  config,
  tanstackBuildConfig({
    entry: 'src/index.ts',
    srcDir: 'src',
    exclude: ['src/__tests__'],
  }),
)
