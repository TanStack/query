import angularQuery from './packages/angular-query-experimental/package.json'
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
    'packages/angular-query-experimental': {
      // Strict mode excludes optional dependencies. Read the declared names
      // so removing a declaration still causes an unlisted dependency error.
      ignoreDependencies: Object.keys(
        angularQuery.optionalDependencies ?? {},
      ).map((dependency) => `${dependency}!`),
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
