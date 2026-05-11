import { defineConfig } from 'vitest/config'

export default defineConfig({
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
    dir: './src',
    watch: false,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})
