import assert from 'node:assert/strict'
import { basename, join } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { build } from 'vite'

const readers = [
  'angular',
  'lit',
  'preact',
  'react',
  'solid',
  'svelte',
  'vue',
  'preact-hydration',
  'react-hydration',
]
const unused = [
  'mutation',
  'mutationCache',
  'mutationObserver',
  'serialScope',
  'select',
  'placeholderData',
  'refetchInterval',
  'infiniteQueryObserver',
  'queriesObserver',
]
const peers =
  /^(?:react(?:-dom)?|preact|@angular\/[^/]+|rxjs|lit(?:-element|-html)?|@lit\/[^/]+|solid-js|svelte|vue|@vue\/[^/]+)(?:\/|$)/

const rows: string[] = []

for (const reader of readers) {
  const entry = join(import.meta.dirname, 'entries', reader + '.ts')
  const result = await build({
    root: import.meta.dirname,
    configFile: false,
    logLevel: 'error',
    plugins: reader === 'svelte' ? [svelte()] : [],
    define: { ngDevMode: 'false', 'process.env.NODE_ENV': '"production"' },
    build: {
      write: false,
      lib: { entry, formats: ['es'] },
      rolldownOptions: { external: peers },
    },
  })
  const modules = (Array.isArray(result) ? result : [result])
    .filter((bundle) => 'output' in bundle)
    .flatMap((bundle) => bundle.output)
    .filter((file) => file.type === 'chunk')
    .flatMap((chunk) => Object.entries(chunk.modules))
    .filter(
      ([id, info]) =>
        id.includes('/packages/query-core/build/') && info.renderedLength > 0,
    )
    .map(([id]) => basename(id, '.js'))

  const retained = new Set(modules)
  for (const required of ['queryClient', 'queryCache', 'queryObserver']) {
    assert(
      retained.has(required),
      reader + ' failed to include the core ' + required,
    )
  }
  const forbidden = [...unused]
  const hydratesQueries = reader === 'solid' || reader.endsWith('-hydration')
  if (hydratesQueries)
    assert(retained.has('hydration'), reader + ' omitted query hydration')
  else forbidden.push('hydration', 'infiniteQueryBehavior')
  if (reader !== 'lit' && reader !== 'vue') forbidden.push('fetchOptimistic')
  for (const feature of forbidden) {
    assert(
      !retained.has(feature),
      reader + ' read-only entry includes ' + feature,
    )
  }
  const includes = (name: string) =>
    retained.has(name) ? 'Included' : 'Omitted'
  rows.push(
    `| ${reader.replace('-hydration', ' + HydrationBoundary')} | ${includes('hydration')} | ${includes('infiniteQueryBehavior')} | ${includes('fetchOptimistic')} |`,
  )
}

console.log('### Read-only imports across framework adapters')
console.log()
console.log(
  'The production ESM reader entries for Angular, Lit, Preact, React, Solid, Svelte and Vue all omit the mutation cache and observer, serial mutation queues, polling, selection, placeholder data, and the infinite and multi-query observers. Each entry includes the query client, cache and ordinary observer.',
)
console.log()
console.log(
  '| Reader | Hydration | Infinite fetch behavior | Optimistic fetch |',
)
console.log('| --- | --- | --- | --- |')
console.log(rows.join('\n'))
