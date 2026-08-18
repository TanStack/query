import { defineConfig } from 'tsdown'
import solid from 'unplugin-solid/rolldown'

const solidBrowserIds: Record<string, string> = {
  'solid-js/web': 'solid-js/web/dist/web.js',
  'solid-js/store': 'solid-js/store/dist/store.js',
  'solid-js/html': 'solid-js/html/dist/html.js',
  'solid-js/h': 'solid-js/h/dist/h.js',
  'solid-js': 'solid-js/dist/solid.js',
}

const solidBrowserImports = () => ({
  name: 'solid-browser-imports',
  resolveId(id: string, importer?: string) {
    // Next.js can resolve solid-js/web through its server condition. Use the
    // exported browser files for the runtime bundles, while keeping d.ts
    // imports unchanged.
    if (importer?.includes('.d.')) return undefined
    const browserId = solidBrowserIds[id]
    if (browserId) {
      return { id: browserId, external: true }
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
    // redirected to the browser files by solidBrowserImports above.
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
