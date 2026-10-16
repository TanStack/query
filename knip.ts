import type { KnipConfig } from 'knip'

export default {
  ignore: ['scripts/*.{j,t}s', '**/ts-fixture/file.ts'],
  treatConfigHintsAsErrors: true,
  treatTagHintsAsErrors: true,
  ignoreDependencies: ['@oxc-project/runtime'],
  ignoreWorkspaces: ['examples/**', 'integrations/**'],
  rules: { duplicates: 'warn' },
  workspaces: {
    'packages/angular-query': {
      entry: ['schematics/*/index.ts', 'src/__tests__/*.test-d.ts'],
    },
    'packages/query-codemods': {
      entry: ['src/v4/**/*.cjs', 'src/v5/**/*.cjs'],
      ignore: ['**/__testfixtures__/**'],
    },
    // Built types import 'react', which the consumer's '@types/react' provides.
    'packages/react-query': {
      ignoreDependencies: ['@types/react!'],
    },
    'packages/react-query-next-experimental': {
      ignoreDependencies: ['@types/react!'],
    },
    'packages/react-query-persist-client': {
      ignoreDependencies: ['@types/react!'],
    },
    'packages/vue-query': {
      ignoreDependencies: ['vue2', 'vue2.7'],
    },
  },
} satisfies KnipConfig
