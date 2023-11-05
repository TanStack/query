import path from 'path'
import type { BranchConfig, Package } from './types'

// TODO: List your npm packages here. The first package will be used as the versioner.
export const packages: Package[] = [
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

export const branchConfigs: Record<string, BranchConfig> = {
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

export const rootDir = path.resolve(__dirname, '..')
