import assert from 'node:assert/strict'
import { basename, join } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { build } from 'vite'

const frameworks = [
  'angular',
  'lit',
  'preact',
  'react',
  'solid',
  'svelte',
  'vue',
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

for (const framework of frameworks) {
  const entry = join(import.meta.dirname, 'entries', framework + '.ts')
  const result = await build({
    root: import.meta.dirname,
    configFile: false,
    logLevel: 'error',
    plugins: framework === 'svelte' ? [svelte()] : [],
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
      framework + ' failed to include the core ' + required,
    )
  }
  const forbidden = [...unused]
  if (framework !== 'solid')
    forbidden.push('hydration', 'infiniteQueryBehavior')
  if (framework !== 'lit' && framework !== 'vue')
    forbidden.push('fetchOptimistic')
  for (const feature of forbidden) {
    assert(
      !retained.has(feature),
      framework + ' read-only entry includes ' + feature,
    )
  }
  const includes = (name: string) =>
    retained.has(name) ? 'Included' : 'Omitted'
  rows.push(
    `| ${framework} | ${includes('hydration')} | ${includes('infiniteQueryBehavior')} | ${includes('fetchOptimistic')} |`,
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
