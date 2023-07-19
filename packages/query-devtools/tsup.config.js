// @ts-check

import { defineConfig } from 'tsup-preset-solid'

export default defineConfig(
  {
    entry: 'src/index.tsx',
    devEntry: true,
  },
  {
    dropConsole: true,
    cjs: true,
    tsupOptions: (config) => ({
      ...config,
      outDir: 'build',
    }),
  },
)
