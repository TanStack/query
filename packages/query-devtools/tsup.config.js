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
      noExternal: [
        'solid-js',
        'solid-js/web',
        '@emotion/css',
        '@solid-primitives/keyed',
        '@solid-primitives/resize-observer',
        '@solid-primitives/storage',
        '@tanstack/match-sorter-utils',
        'solid-transition-group',
        'superjson',
      ],
    }),
  },
)
