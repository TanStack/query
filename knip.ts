import angularQuery from './packages/angular-query-experimental/package.json'
import reactQuery from './packages/react-query/package.json'
import reactQueryDevtools from './packages/react-query-devtools/package.json'
import reactQueryNextExperimental from './packages/react-query-next-experimental/package.json'
import reactQueryPersistClient from './packages/react-query-persist-client/package.json'
import type { KnipConfig } from 'knip'

// Strict mode excludes optional peer dependencies. Read the declared names
// so removing a declaration still causes an unlisted dependency error.
const optionalPeerDependencies = (pkg: {
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional: boolean }>
}) =>
  Object.keys(pkg.peerDependenciesMeta)
    .filter((dependency) => dependency in pkg.peerDependencies)
    .map((dependency) => `${dependency}!`)

export default {
  ignore: ['scripts/*.{j,t}s', '**/ts-fixture/file.ts'],
  treatConfigHintsAsErrors: true,
  treatTagHintsAsErrors: true,
  ignoreDependencies: [
    '@oxc-project/runtime',
    // Used by the ESLint configs of the React examples
    '@tanstack/eslint-config',
  ],
  ignoreWorkspaces: ['examples/**', 'integrations/**'],
  rules: { duplicates: 'warn' },
  workspaces: {
    'packages/angular-query-experimental': {
      ignore: ['scripts/prepack.js'],
      // Strict mode excludes optional dependencies. Read the declared names
      // so removing a declaration still causes an unlisted dependency error.
      ignoreDependencies: Object.keys(angularQuery.optionalDependencies).map(
        (dependency) => `${dependency}!`,
      ),
    },
    'packages/query-codemods': {
      entry: ['src/v4/**/*.cjs', 'src/v5/**/*.cjs'],
      ignore: ['**/__testfixtures__/**'],
    },
    'packages/react-query': {
      ignoreDependencies: optionalPeerDependencies(reactQuery),
    },
    'packages/react-query-devtools': {
      ignoreDependencies: optionalPeerDependencies(reactQueryDevtools),
    },
    'packages/react-query-next-experimental': {
      ignoreDependencies: optionalPeerDependencies(reactQueryNextExperimental),
    },
    'packages/react-query-persist-client': {
      ignoreDependencies: optionalPeerDependencies(reactQueryPersistClient),
    },
    'packages/vue-query': {
      ignoreDependencies: ['vue2', 'vue2.7'],
    },
  },
} satisfies KnipConfig
