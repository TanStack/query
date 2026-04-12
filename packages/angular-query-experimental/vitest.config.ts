import { defineConfig } from 'vitest/config'
import angular from '@analogjs/vite-plugin-angular'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  plugins: [
    angular({
      tsconfig: './tsconfig.spec.json',
      // Vitest sets VITEST; Analog defaults jit: true, which skips ngtsc transforms for
      // signal inputs so inputBinding() fails (NG0315). jit: false needs compiler-cli on
      // TypeScript 5.9+ to avoid a TS 5.8 bind crash (root pnpm override).
      jit: false,
    }),
  ],
  test: {
    name: packageJson.name,
    dir: './src/__tests__',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
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
