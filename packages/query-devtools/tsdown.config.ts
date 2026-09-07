import { createRequire } from 'node:module'
import { defineConfig } from 'tsdown'
import solid from 'unplugin-solid/rolldown'

const require = createRequire(import.meta.url)

const solidBrowserIds: Record<string, string> = {
  'solid-js/web': require.resolve('solid-js/web/dist/web.js'),
  'solid-js/store': require.resolve('solid-js/store/dist/store.js'),
  'solid-js/html': require.resolve('solid-js/html/dist/html.js'),
  'solid-js/h': require.resolve('solid-js/h/dist/h.js'),
  'solid-js': require.resolve('solid-js/dist/solid.js'),
}

const solidBrowserImports = () => ({
  name: 'solid-browser-imports',
  resolveId(id: string, importer?: string) {
    // Resolve the browser runtime explicitly. This keeps Solid bundled in
    // query-devtools, as it was with tsup-preset-solid, while keeping d.ts
    // imports unchanged.
    if (importer?.includes('.d.')) return undefined
    const browserId = solidBrowserIds[id]
    if (browserId) {
      return { id: browserId, external: false }
    }
    return undefined
  },
})

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
    // Keep package imports in declaration output. Runtime Solid imports are
    // bundled from the browser files by solidBrowserImports above.
    external: (id: string, importer?: string) =>
      (id.startsWith('solid-js') && importer?.includes('.d.')) ||
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
    plugins: [solid(), solidBrowserImports()],
  },
  {
    ...baseConfig,
    entry: { dev: 'src/index.ts' },
    clean: false,
    dts: false,
    env: environment(true),
    plugins: [solid(), solidBrowserImports()],
  },
])
