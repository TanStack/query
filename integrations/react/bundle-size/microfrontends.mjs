import assert from 'node:assert/strict'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const screens = ['query', 'paginated']
const deployments = ['independent', 'shared']

// Both remotes use the host's React and React DOM. A shared Query deployment
// serves one ESM chunk at one URL; each remote still owns its QueryClient.
async function buildHost(root, directory) {
  const peers = {
    react:
      "export { default, createContext, use, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'",
    dom: "export { createRoot } from 'react-dom/client'",
    jsx: "export { Fragment, jsx, jsxs } from 'react/jsx-runtime'",
  }
  const input = Object.fromEntries(
    Object.keys(peers).map((name) => [name, 'host:' + name]),
  )
  await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    plugins: [
      {
        name: 'microfrontend-host-peers',
        resolveId(id) {
          if (id.startsWith('host:')) return '\0' + id
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

function shell(entries) {
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Reading list</title>
<script type="importmap">{"imports":{"react":"../../host/react.js","react-dom/client":"../../host/dom.js","react/jsx-runtime":"../../host/jsx.js"}}</script>
<nav><button id="catalog">Catalog</button><button id="bookmarks">Bookmarks</button></nav><main></main>
<script type="module">
  const routes = ${JSON.stringify(entries)}
  let unmount
  async function open(screen) {
    const { mount } = await import(routes[screen])
    unmount?.()
    unmount = mount(document.querySelector('main'))
  }
  document.querySelector('#catalog').onclick = () => open('query')
  document.querySelector('#bookmarks').onclick = () => open('paginated')
  await open('query')
</script></html>`
}

async function buildRemotes({
  root,
  outDir,
  included,
  packageName,
  owners,
  packageScope,
  pluggable,
}) {
  const entries = Object.fromEntries(
    included.map((screen) => [screen, 'remote:' + screen]),
  )
  const belongs = (id) => owners.some((dir) => id.startsWith(dir))
  const { output } = await build({
    root,
    configFile: false,
    publicDir: false,
    base: './',
    logLevel: 'warn',
    resolve: {
      alias: {
        '#query-hooks': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-query.js' : 'v6-query.js',
        ),
      },
    },
    plugins: [
      {
        name: 'microfrontend-routes',
        enforce: 'pre',
        resolveId(id, importer) {
          if (id.startsWith('remote:'))
            return path.join(root, 'src', 'remote.jsx') + '?' + id.slice(7)
          if (id === '#screen')
            return path.join(root, 'src', importer.split('?').at(-1) + '.jsx')
          if (id === '#adapter')
            return this.resolve(packageName, packageScope, { skipSelf: true })
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
  const chunks = output.filter((chunk) => chunk.type === 'chunk')
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
}) {
  const directory = path.join(root, 'dist', 'microfrontends')
  await buildHost(root, directory)
  const results = []
  for (const deployment of deployments) {
    const rows = []
    for (const packageName of [baseline, pluggable]) {
      const source =
        packageName === baseline && baseCheckout ? baseCheckout : checkout
      const name = packageName.split('/')[1]
      const dir = path.join(directory, name, deployment)
      const groups =
        deployment === 'shared' ? [screens] : screens.map((screen) => [screen])
      const entries = {}
      const sizes = []
      for (const included of groups) {
        const prefix = deployment === 'shared' ? '.' : './' + included[0]
        const size = await buildRemotes({
          root,
          outDir: path.join(dir, prefix),
          included,
          packageName,
          pluggable,
          packageScope: path.join(source, 'packages', name, 'package.json'),
          owners: runtimeOwners(source, packageName),
        })
        sizes.push(size)
        for (const screen of included)
          entries[screen] = prefix + '/' + screen + '.js'
      }
      await mkdir(dir, { recursive: true })
      await cp(path.join(root, 'public'), dir, { recursive: true })
      await writeFile(path.join(dir, 'index.html'), shell(entries))
      rows.push([sizes[0], sizes.reduce((total, bytes) => total + bytes, 0)])
    }
    for (const [i, journey] of [
      'Catalog only',
      'Catalog then bookmarks',
    ].entries()) {
      const [base, experiment] = rows.map((row) => row[i])
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
