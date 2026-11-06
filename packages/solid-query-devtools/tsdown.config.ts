import { defineConfig } from 'tsdown'
import solid from 'unplugin-solid/rolldown'
import type { UserConfig } from 'tsdown'

const baseConfig: UserConfig = {
  target: 'esnext',
  platform: 'browser',
  format: ['esm', 'cjs'],
  outDir: 'build',
  fixedExtension: false,
}

const environment = (development: boolean) => ({
  NODE_ENV: development ? 'development' : 'production',
  PROD: !development,
  DEV: development,
  SSR: false,
})

const compiledConfig = (
  entry: Record<string, string>,
  development: boolean,
  clean: boolean,
): UserConfig => ({
  ...baseConfig,
  entry,
  clean,
  dts: !development,
  env: environment(development),
  ...(development
    ? {}
    : {
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
      }),
  plugins: [solid()],
})

const jsxConfig = (
  entry: Record<string, string>,
  development: boolean,
): UserConfig => ({
  ...baseConfig,
  entry,
  format: 'esm',
  clean: false,
  dts: false,
  env: environment(development),
  outExtensions: () => ({ js: '.jsx' }),
  plugins: [],
})

export default defineConfig([
  compiledConfig({ index: 'src/index.tsx' }, false, true),
  jsxConfig({ index: 'src/index.tsx' }, false),
  compiledConfig({ dev: 'src/index.tsx' }, true, false),
  jsxConfig({ dev: 'src/index.tsx' }, true),
])
