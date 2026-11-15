import { transformAsync } from '@babel/core'
// @ts-expect-error - Ships no type declarations
import ts from '@babel/preset-typescript'
// @ts-expect-error - Ships no type declarations
import solidPlugin from '@solidjs/babel-plugin'
import { defineConfig } from 'tsdown'
import type { Rolldown, UserConfig } from 'tsdown'

// Compiles JSX with the Solid 2.0 compiler; 'unplugin-solid' ships the Solid 1.x one.
const solid = (): Rolldown.Plugin => ({
  name: 'solid-v2',
  transform: {
    filter: { id: /\.[jt]sx$/ },
    async handler(code, id) {
      const result = await transformAsync(code, {
        presets: [[ts, {}]],
        plugins: [[solidPlugin, { generate: 'dom' }]],
        filename: id,
        sourceMaps: true,
      })
      if (result?.code == null) {
        throw new Error(`Babel returned no code for ${id}`)
      }
      return { code: result.code, map: result.map, moduleType: 'js' }
    },
  },
})

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
  compiledConfig(
    { index: 'src/index.tsx', production: 'src/production.tsx' },
    false,
    true,
  ),
  jsxConfig(
    { index: 'src/index.tsx', production: 'src/production.tsx' },
    false,
  ),
  compiledConfig({ dev: 'src/index.tsx' }, true, false),
  jsxConfig({ dev: 'src/index.tsx' }, true),
])
