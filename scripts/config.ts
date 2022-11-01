import path from 'path'
import type { BranchConfig, Package } from './types'

// TODO: List your npm packages here. The first package will be used as the versioner.
export const packages: Package[] = [
  { name: '@tanstack/query-core', packageDir: 'query-core', srcDir: 'src' },
  {
    name: '@tanstack/query-persist-client-core',
    packageDir: 'query-persist-client-core',
    srcDir: 'src',
  },
  {
    name: '@tanstack/query-async-storage-persister',
    packageDir: 'query-async-storage-persister',
    srcDir: 'src',
  },
  {
    name: '@tanstack/query-broadcast-client-experimental',
    packageDir: 'query-broadcast-client-experimental',
    srcDir: 'src',
  },
  {
    name: '@tanstack/query-sync-storage-persister',
    packageDir: 'query-sync-storage-persister',
    srcDir: 'src',
  },
  { name: '@tanstack/react-query', packageDir: 'react-query', srcDir: 'src' },
  {
    name: '@tanstack/react-query-devtools',
    packageDir: 'react-query-devtools',
    srcDir: 'src',
  },
  {
    name: '@tanstack/react-query-persist-client',
    packageDir: 'react-query-persist-client',
    srcDir: 'src',
  },
  {
    name: '@tanstack/solid-query',
    packageDir: 'solid-query',
    srcDir: 'src',
  },
  {
    name: '@tanstack/vue-query',
    packageDir: 'vue-query',
    srcDir: 'src',
  },
  {
    name: '@tanstack/eslint-plugin-query',
    packageDir: 'eslint-plugin-query',
    srcDir: 'src',
  },
]

export const latestBranch = 'main'

export const branchConfigs: Record<string, BranchConfig> = {
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

export const rootDir = path.resolve(__dirname, '..')
export const examplesDirs = ['examples/react']
