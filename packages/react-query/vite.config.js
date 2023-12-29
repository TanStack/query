// @ts-check

import { readdirSync, renameSync } from 'node:fs'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'

/**
 * @param {import("vite").UserConfig} config
 * @returns {import('vite').UserConfig}
 */
export const tanstackBundler = (config) => {
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
        readdirSync(path).forEach((file) => {
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

  config.plugins = config.plugins ? config.plugins.concat(plugins) : plugins

  config.build = {
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
  }

  return defineConfig(config)
}

export default tanstackBundler({
  test: {
    name: 'react-query',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
  },
})
