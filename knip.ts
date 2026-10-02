import type { KnipConfig } from 'knip'

export default {
  ignore: ['scripts/*.{j,t}s', '**/ts-fixture/file.ts'],
  treatConfigHintsAsErrors: true,
  treatTagHintsAsErrors: true,
  ignoreDependencies: ['@types/react', '@types/react-dom'],
  ignoreWorkspaces: ['examples/**', 'integrations/**'],
  workspaces: {
    '.': {
      ignoreDependencies: ['react', 'react-dom'],
    },
    'packages/angular-query': {
      entry: ['schematics/ng-add/index.ts', 'src/__tests__/*.test-d.ts'],
    },
    'packages/query-codemods': {
      entry: ['src/v4/**/*.cjs', 'src/v5/**/*.cjs'],
      ignore: ['**/__testfixtures__/**'],
    },
    'packages/vue-query': {
      ignoreDependencies: ['vue2', 'vue2.7'],
    },
  },
} satisfies KnipConfig
