import { defineConfig } from 'tsdown'
import solid from 'unplugin-solid/rolldown'

const baseConfig = {
  target: 'esnext',
  platform: 'neutral' as const,
  alias: {
    'solid-transition-group': 'solid-transition-group/dist/index.js',
  },
  format: ['esm', 'cjs'] as ['esm', 'cjs'],
  outDir: 'build',
  fixedExtension: false,
  inputOptions: {
    // unplugin-solid only adds these externals when Rolldown does not have an
    // external option yet. Keep them when we also externalize core in DTS.
    external: (id: string, importer?: string) =>
      id.startsWith('solid-js') ||
      (id === '@tanstack/query-core' && importer?.includes('.d.')),
  },
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
