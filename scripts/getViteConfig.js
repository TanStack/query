// @ts-check

import { readdirSync, renameSync } from 'node:fs'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'

/**
 * @param {object} config
 * @param {string} config.entry
 * @param {string} config.srcDir
 * @param {string[]} [config.exclude]
 * @returns {import('vite').UserConfig}
 */
export const getViteConfig = (config) => {
  return defineConfig({
    plugins: [
      externalizeDeps(),
      dts({
        outDir: `./dist/esm`,
        entryRoot: config.srcDir,
        include: config.srcDir,
        exclude: config.exclude,
        compilerOptions: {
          // @ts-expect-error
          module: 'esnext',
          declarationMap: true,
        },
      }),
      dts({
        outDir: `./dist/cjs`,
        entryRoot: config.srcDir,
        include: config.srcDir,
        exclude: config.exclude,
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
    ],
    build: {
      outDir: `./dist`,
      minify: false,
      sourcemap: true,
      lib: {
        entry: config.entry,
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
