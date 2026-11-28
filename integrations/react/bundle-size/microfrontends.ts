import assert from 'node:assert/strict'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const screens = ['query', 'paginated'] as const
type Screen = (typeof screens)[number]
type Adapter = '@tanstack/react-query' | '@tanstack/react-query-pluggable'
const deployments = ['independent', 'shared'] as const
type Deployment = (typeof deployments)[number]

// Both remotes use the host's React and React DOM. A shared Query deployment
// serves one ESM chunk at one URL; each remote still owns its QueryClient.
async function buildHost(root: string, directory: string) {
  const peers: Record<string, string> = {
    react:
      "export { default, createContext, use, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'",
    dom: "export { createRoot } from 'react-dom/client'",
    jsx: "export { Fragment, jsx, jsxs } from 'react/jsx-runtime'",
  }
  const input = {
    navigation: path.join(root, 'host/navigation.ts'),
    ...Object.fromEntries(
      Object.keys(peers).map((name) => [name, 'host:' + name]),
    ),
  }
  await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    plugins: [
      {
        name: 'microfrontend-host-peers',
        resolveId(id) {
          return id.startsWith('host:') ? '\0' + id : null
        },
        load(id) {
          if (!id.startsWith('\0host:')) return
          return peers[id.slice(6)]
        },
      },
    ],
    build: {
      outDir: path.join(directory, 'host'),
      rolldownOptions: {
        input,
        preserveEntrySignatures: 'strict',
        output: { entryFileNames: '[name].js' },
      },
    },
  })
}

function routeDirectory(deployment: Deployment, screen: Screen) {
  return deployment === 'shared' ? '.' : './' + screen
}

function shell(deployment: Deployment) {
  const catalog = routeDirectory(deployment, 'query') + '/query.js'
  const bookmarks = routeDirectory(deployment, 'paginated') + '/paginated.js'
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Reading list</title>
<script type="importmap">{"imports":{"react":"../../host/react.js","react-dom/client":"../../host/dom.js","react/jsx-runtime":"../../host/jsx.js"}}</script>
<nav><button id="catalog" data-entry="${catalog}">Catalog</button><button id="bookmarks" data-entry="${bookmarks}">Bookmarks</button></nav><main></main>
<script type="module" src="../../host/navigation.js"></script></html>`
}

async function buildRemotes({
  root,
  outDir,
  included,
  packageName,
  owners,
  packageScope,
  pluggable,
}: {
  root: string
  outDir: string
  included: ReadonlyArray<Screen>
  packageName: Adapter
  owners: ReadonlyArray<string>
  packageScope: string
  pluggable: Adapter
}) {
  const entries = Object.fromEntries(
    included.map((screen) => [screen, 'remote:' + screen]),
  )
  const belongs = (id: string) => owners.some((dir) => id.startsWith(dir))
  const result = await build({
    root,
    configFile: false,
    publicDir: false,
    base: './',
    logLevel: 'warn',
    resolve: {
      alias: {
        '#catalog-hooks': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-catalog.ts' : 'v6-catalog.ts',
        ),
        '#query-hooks': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-query.ts' : 'v6-query.ts',
        ),
      },
    },
    plugins: [
      {
        name: 'microfrontend-routes',
        enforce: 'pre',
        resolveId(id, importer) {
          if (id.startsWith('remote:'))
            return path.join(root, 'src', 'remote.tsx') + '?' + id.slice(7)
          if (id === '#screen') {
            const screen = screens.find((name) =>
              importer?.endsWith('?' + name),
            )
            assert.ok(screen, 'Missing remote screen in ' + importer)
            return path.join(root, 'src', screen + '.tsx')
          }
          if (id === '#adapter')
            return this.resolve(packageName, packageScope, { skipSelf: true })
          return null
        },
      },
    ],
    build: {
      outDir,
      rolldownOptions: {
        input: entries,
        preserveEntrySignatures: 'allow-extension',
        external: /^react(?:-dom)?(?:\/|$)/,
        checks: { moduleLevelDirective: false },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          codeSplitting: {
            groups: [
              {
                name: 'query-runtime',
                test: belongs,
                includeDependenciesRecursively: false,
              },
            ],
          },
        },
      },
    },
  })
  assert.ok('output' in result, 'Expected one build output for ' + packageName)
  const chunks = result.output.filter((chunk) => chunk.type === 'chunk')
  const runtime = chunks.find((chunk) => chunk.name === 'query-runtime')
  assert.ok(runtime, 'Missing Query runtime for ' + packageName)
  const modules = Object.entries(runtime.modules).filter(
    ([, mod]) => mod.renderedLength > 0,
  )
  assert.ok(modules.every(([id]) => belongs(id)))
  for (const owner of owners)
    assert.ok(modules.some(([id]) => id.startsWith(owner)))
  for (const chunk of chunks.filter((item) => item !== runtime)) {
    assert.ok(
      !Object.entries(chunk.modules).some(
        ([id, mod]) => mod.renderedLength && belongs(id),
      ),
    )
  }
  return gzipSync(runtime.code, { level: 9 }).length
}

export async function measureMicrofrontends({
  root,
  checkout,
  baseCheckout,
  baseline,
  pluggable,
  runtimeOwners,
  formatChange,
}: {
  root: string
  checkout: string
  baseCheckout?: string
  baseline: Adapter
  pluggable: Adapter
  runtimeOwners: (directory: string, adapter: Adapter) => ReadonlyArray<string>
  formatChange: (bytes: number, baselineBytes: number) => string
}) {
  const directory = path.join(root, 'dist', 'microfrontends')
  await buildHost(root, directory)
  const results: Array<string> = []
  for (const deployment of deployments) {
    async function measureAdapter(packageName: Adapter) {
      const source =
        packageName === baseline && baseCheckout ? baseCheckout : checkout
      const name = path.basename(packageName)
      const dir = path.join(directory, name, deployment)
      const groups =
        deployment === 'shared'
          ? [screens]
          : screens.map((screen) => [screen] as const)
      let catalog = 0
      let journey = 0
      for (const included of groups) {
        const prefix = routeDirectory(deployment, included[0])
        const size = await buildRemotes({
          root,
          outDir: path.join(dir, prefix),
          included,
          packageName,
          pluggable,
          packageScope: path.join(source, 'packages', name, 'package.json'),
          owners: runtimeOwners(source, packageName),
        })
        if (included.includes('query')) catalog = size
        journey += size
      }
      await mkdir(dir, { recursive: true })
      await cp(path.join(root, 'public'), dir, { recursive: true })
      await writeFile(path.join(dir, 'index.html'), shell(deployment))
      return { catalog, journey }
    }
    const stock = await measureAdapter(baseline)
    const experimental = await measureAdapter(pluggable)
    for (const [key, journey] of [
      ['catalog', 'Catalog only'],
      ['journey', 'Catalog then bookmarks'],
    ] as const) {
      const base = stock[key]
      const experiment = experimental[key]
      const label =
        deployment === 'shared' ? 'Shared Query chunk' : 'Query per remote'
      results.push(
        `| ${label} | ${journey} | ${base.toLocaleString('en-US')} B | ${experiment.toLocaleString('en-US')} B | ${formatChange(experiment, base)} |`,
      )
    }
  }
  return [
    '### Microfrontend navigation',
    '',
    'Cumulative Query JavaScript (gzip) from a cold catalog visit through the first visit to bookmarks. Both remotes share host React and React DOM. The independent builds serve distinct Query URLs. The shared build serves one Query chunk containing the features used across both routes. Chromium checks the requested Query URLs on each visit and revisit.',
    '',
    '| Deployment | Journey | React Query v6 | React Query Pluggable | Change vs v6 |',
    '| --- | --- | ---: | ---: | ---: |',
    ...results,
  ].join('\n')
}
