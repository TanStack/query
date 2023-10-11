// @ts-check

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * List your npm packages here. The first package will be used as the versioner.
 * @type {import('./types').Package[]}
 */
export const packages = [
  {
    name: '@tanstack/eslint-plugin-query',
    packageDir: 'packages/eslint-plugin-query',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-async-storage-persister',
    packageDir: 'packages/query-async-storage-persister',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-broadcast-client-experimental',
    packageDir: 'packages/query-broadcast-client-experimental',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-core',
    packageDir: 'packages/query-core',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-devtools',
    packageDir: 'packages/query-devtools',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-persist-client-core',
    packageDir: 'packages/query-persist-client-core',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/query-sync-storage-persister',
    packageDir: 'packages/query-sync-storage-persister',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query',
    packageDir: 'packages/react-query',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query-devtools',
    packageDir: 'packages/react-query-devtools',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query-persist-client',
    packageDir: 'packages/react-query-persist-client',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/react-query-next-experimental',
    packageDir: 'packages/react-query-next-experimental',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/solid-query',
    packageDir: 'packages/solid-query',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/solid-query-devtools',
    packageDir: 'packages/solid-query-devtools',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/solid-query-persist-client',
    packageDir: 'packages/solid-query-persist-client',
    entries: ['main', 'module', 'types'],
  },
  {
    name: '@tanstack/svelte-query',
    packageDir: 'packages/svelte-query',
    entries: ['module', 'svelte', 'types'],
  },
  {
    name: '@tanstack/svelte-query-devtools',
    packageDir: 'packages/svelte-query-devtools',
    entries: ['module', 'svelte', 'types'],
  },
  {
    name: '@tanstack/svelte-query-persist-client',
    packageDir: 'packages/svelte-query-persist-client',
    entries: ['module', 'svelte', 'types'],
  },
  {
    name: '@tanstack/vue-query',
    packageDir: 'packages/vue-query',
    entries: ['main', 'module', 'types'],
  },
]

/**
 * Contains config for publishable branches.
 * @type {Record<string, import('./types').BranchConfig>}
 */
export const branchConfigs = {
  main: {
    prerelease: false,
  },
  next: {
    prerelease: true,
  },
  beta: {
    prerelease: true,
  },
  alpha: {
    prerelease: true,
  },
  rc: {
    prerelease: true,
  },
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
export const rootDir = resolve(__dirname, '..')
