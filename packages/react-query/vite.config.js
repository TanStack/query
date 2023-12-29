// @ts-check

import { copyFileSync } from 'node:fs'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import dts from 'vite-plugin-dts'

/**
 * @param {import("vite").UserConfig} config
 * @returns {import('vite').UserConfig} */
export const tanstackBundler = (config) => {
  config.plugins = [
    dts({
      entryRoot: `./src`,
      outDir: `./dist/mjs`,
      exclude: './src/__tests__',
      afterBuild: () => {
        // To pass publint (`npm x publint@latest`) and ensure the
        // package is supported by all consumers, we must export types that are
        // read as ESM. To do this, there must be duplicate types with the
        // correct extension supplied in the package.json exports field.
        copyFileSync(`./dist/mjs/index.d.ts`, `./dist/mjs/index.d.mts`)
      },
      compilerOptions: {
        module: 'esnext',
      },
    }),
    dts({
      entryRoot: `./src`,
      outDir: `./dist/cjs`,
      exclude: './src/__tests__',
      afterBuild: () => {
        copyFileSync(`./dist/cjs/index.d.ts`, `./dist/cjs/index.d.cts`)
      },
      compilerOptions: {
        module: 'commonjs',
      },
    }),
    externalizeDeps(),
  ]

  config.build = {
    outDir: `./dist`,
    minify: false,
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'cjs') return `cjs/[name].cjs`
        return `mjs/[name].mjs`
      },
    },
    rollupOptions: {
      output: {
        preserveModules: true,
      },
    },
  }

  return config
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
