import { resolve } from 'node:path'
import { fileURLToPath } from "node:url";

/**
 * List your npm packages here. The first package will be used as the versioner.
 * @type {import('./types').Package[]}
 */
export const packages = [
  {
    name: '@tanstack/query-core',
    packageDir: 'query-core',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-persist-client-core',
    packageDir: 'query-persist-client-core',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-async-storage-persister',
    packageDir: 'query-async-storage-persister',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-broadcast-client-experimental',
    packageDir: 'query-broadcast-client-experimental',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-sync-storage-persister',
    packageDir: 'query-sync-storage-persister',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query',
    packageDir: 'react-query',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-devtools',
    packageDir: 'query-devtools',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query-devtools',
    packageDir: 'react-query-devtools',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query-persist-client',
    packageDir: 'react-query-persist-client',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/solid-query',
    packageDir: 'solid-query',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/svelte-query',
    packageDir: 'svelte-query',
    srcDir: 'src',
    entries: ['module', 'svelte', 'types'],
  },
  {
    name: '@tanstack/svelte-query-devtools',
    packageDir: 'svelte-query-devtools',
    srcDir: 'src',
    entries: ['module', 'svelte', 'types'],
  },
  {
    name: '@tanstack/vue-query',
    packageDir: 'vue-query',
    srcDir: 'src',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/eslint-plugin-query',
    packageDir: 'eslint-plugin-query',
    srcDir: 'src',
    entries: ['main'],
  },
]

export const latestBranch = 'main'

/** @type {Record<string, import('./types').BranchConfig>} */
export const branchConfigs = {
  main: {
    prerelease: false,
    ghRelease: true,
  },
  next: {
    prerelease: true,
    ghRelease: true,
  },
  beta: {
    prerelease: true,
    ghRelease: true,
  },
  alpha: {
    prerelease: true,
    ghRelease: true,
  },
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const rootDir = resolve(__dirname, '..')
