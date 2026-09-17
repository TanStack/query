import path from 'node:path'
import { fileURLToPath } from 'node:url'
import angular from '@analogjs/vite-plugin-angular'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const angularQueryEntry = path.join(
  packageDir,
  '../angular-query/dist/index.mjs',
)
const angularQueryInternalEntry = path.join(
  packageDir,
  '../angular-query/dist/internal.mjs',
)

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  plugins: [angular({ tsconfig: './tsconfig.spec.json' })],
  resolve: {
    alias: {
      '@tanstack/angular-query/internal': angularQueryInternalEntry,
      '@tanstack/angular-query': angularQueryEntry,
      '@tanstack/query-devtools': path.join(
        packageDir,
        '../query-devtools/src/index.ts',
      ),
    },
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    include: ['**/*.{test,spec}.{ts,mts,cts,tsx,js,mjs,cjs,jsx}'],
    globals: true,
    restoreMocks: true,
  },
})
