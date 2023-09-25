import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-persist-client-core',
    dir: './src',
    watch: false,
    globals: true,
    coverage: { provider: 'istanbul' },
  },
})
