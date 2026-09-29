import { defineConfig } from 'tsdown'
import solid from 'unplugin-solid/rolldown'

const baseConfig = {
  target: 'esnext',
  platform: 'browser' as const,
  format: ['esm', 'cjs'] as ['esm', 'cjs'],
  outDir: 'build',
  fixedExtension: false,
}

const environment = (development: boolean) => ({
  NODE_ENV: development ? 'development' : 'production',
  PROD: !development,
  DEV: development,
  SSR: false,
})

export default defineConfig([
  {
    ...baseConfig,
    entry: { index: 'src/index.ts' },
    clean: true,
    dts: true,
    env: environment(false),
    minify: {
      compress: {
        dropConsole: true,
        dropDebugger: true,
      },
    },
    plugins: [solid()],
  },
  {
    ...baseConfig,
    entry: { dev: 'src/index.ts' },
    clean: false,
    dts: false,
    env: environment(true),
    plugins: [solid()],
  },
])
