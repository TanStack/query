// @ts-check

import { readdirSync, renameSync } from 'node:fs'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'

/**
 * @param {Omit<import("vite").UserConfig, 'build'>} config
 * @returns {import('vite').UserConfig}
 */
export const getViteConfig = (config) => {
  /** @type {import("vite").PluginOption[]} */
  const plugins = [
    dts({
      entryRoot: `./src`,
      outDir: `./dist/esm`,
      exclude: './src/__tests__',
      compilerOptions: {
        // @ts-expect-error
        module: 'esnext',
        declarationMap: true,
      },
    }),
    dts({
      entryRoot: `./src`,
      outDir: `./dist/cjs`,
      exclude: './src/__tests__',
      compilerOptions: {
        // @ts-expect-error
        module: 'commonjs',
        declarationMap: false,
      },
      afterBuild: () => {
        const path = './dist/cjs'
        readdirSync(path, { recursive: true }).forEach((file) => {
          if (file.includes('.d.ts')) {
            renameSync(
              `${path}/${file}`,
              `${path}/${file.replace('.d.ts', '.d.cts')}`,
            )
          }
        })
      },
    }),
    externalizeDeps(),
  ]

  return defineConfig({
    ...config,
    plugins: config.plugins ? config.plugins.concat(plugins) : plugins,
    build: {
      outDir: `./dist`,
      minify: false,
      sourcemap: true,
      lib: {
        entry: './src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => {
          if (format === 'cjs') return `cjs/[name].cjs`
          return `esm/[name].js`
        },
      },
      rollupOptions: {
        output: {
          preserveModules: true,
        },
      },
    },
  })
}
