import { tanstackConfig } from '@tanstack/oxfmt-config'
import { defineConfig } from 'oxfmt'
import type { SortImportsConfig } from 'oxfmt'

export default defineConfig({
  ...tanstackConfig,
  svelte: {},
  ignorePatterns: [
    ...tanstackConfig.ignorePatterns,
    '**/query-codemods/**/__testfixtures__',
    '**/routeTree.gen.ts',
    '**/tsconfig.vitest-temp.json',
    'docs/framework/*/reference',
  ],
  overrides: [
    {
      files: ['examples/svelte/**'],
      options: {
        sortImports: {
          ...(tanstackConfig.sortImports as SortImportsConfig),
          internalPattern: ['~/', '@/', '#', '$app/', '$lib/'],
        },
      },
    },
  ],
})
