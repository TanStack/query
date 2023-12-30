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
  },
  {
    name: '@tanstack/query-async-storage-persister',
    packageDir: 'packages/query-async-storage-persister',
  },
  {
    name: '@tanstack/query-broadcast-client-experimental',
    packageDir: 'packages/query-broadcast-client-experimental',
  },
  {
    name: '@tanstack/query-core',
    packageDir: 'packages/query-core',
  },
  {
    name: '@tanstack/query-devtools',
    packageDir: 'packages/query-devtools',
  },
  {
    name: '@tanstack/query-persist-client-core',
    packageDir: 'packages/query-persist-client-core',
  },
  {
    name: '@tanstack/query-sync-storage-persister',
    packageDir: 'packages/query-sync-storage-persister',
  },
  {
    name: '@tanstack/react-query',
    packageDir: 'packages/react-query',
  },
  {
    name: '@tanstack/react-query-devtools',
    packageDir: 'packages/react-query-devtools',
  },
  {
    name: '@tanstack/react-query-persist-client',
    packageDir: 'packages/react-query-persist-client',
  },
  {
    name: '@tanstack/react-query-next-experimental',
    packageDir: 'packages/react-query-next-experimental',
  },
  {
    name: '@tanstack/solid-query',
    packageDir: 'packages/solid-query',
  },
  {
    name: '@tanstack/solid-query-devtools',
    packageDir: 'packages/solid-query-devtools',
  },
  {
    name: '@tanstack/solid-query-persist-client',
    packageDir: 'packages/solid-query-persist-client',
  },
  {
    name: '@tanstack/svelte-query',
    packageDir: 'packages/svelte-query',
  },
  {
    name: '@tanstack/svelte-query-devtools',
    packageDir: 'packages/svelte-query-devtools',
  },
  {
    name: '@tanstack/svelte-query-persist-client',
    packageDir: 'packages/svelte-query-persist-client',
  },
  {
    name: '@tanstack/vue-query',
    packageDir: 'packages/vue-query',
  },
  {
    name: '@tanstack/vue-query-devtools',
    packageDir: 'packages/vue-query-devtools',
  },
  {
    name: '@tanstack/angular-query-devtools-experimental',
    packageDir: 'packages/angular-query-devtools-experimental',
  },
  {
    name: '@tanstack/angular-query-experimental',
    packageDir: 'packages/angular-query-experimental',
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
  v4: {
    prerelease: false,
    previousVersion: true,
  },
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
export const rootDir = resolve(__dirname, '..')
