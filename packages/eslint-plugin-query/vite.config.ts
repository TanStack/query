import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/config/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    globals: true,
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
    exclude: ['./src/__tests__'],
  }),
)
