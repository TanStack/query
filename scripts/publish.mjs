// @ts-check

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publish } from '@tanstack/publish-config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

await publish({
  packages: [
    {
      name: '@tanstack/query-core',
      packageDir: 'packages/query-core',
    },
    {
      name: '@tanstack/query-persist-client-core',
      packageDir: 'packages/query-persist-client-core',
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
      name: '@tanstack/solid-query',
      packageDir: 'packages/solid-query',
    },
    {
      name: '@tanstack/svelte-query',
      packageDir: 'packages/svelte-query',
    },
    {
      name: '@tanstack/vue-query',
      packageDir: 'packages/vue-query',
    },
    {
      name: '@tanstack/eslint-plugin-query',
      packageDir: 'packages/eslint-plugin-query',
    },
  ],
  branchConfigs: {
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
  },
  rootDir: resolve(__dirname, '..'),
  branch: process.env.BRANCH,
  tag: process.env.TAG,
  ghToken: process.env.GH_TOKEN,
})
