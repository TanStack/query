import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { SourceMap } from 'node:module'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { build, normalizePath } from 'vite'
import type { Rolldown } from 'vite'

type Chunk = Rolldown.OutputChunk
type Adapter = '@tanstack/react-query' | '@tanstack/react-query-pluggable'
type Phase = 'catalog' | 'bookmarks'
const phases = ['catalog', 'bookmarks'] as const
const queryPackage =
  /\/(?:packages|node_modules\/@tanstack)\/(?:query-core|react-query)(?:-pluggable)?\//

// Follow static imports only. The bookmark route starts a second traversal
// when React.lazy invokes its dynamic import.
function routeGraph(chunks: Array<Chunk>) {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  function dependencies(entry: Chunk) {
    const reached = new Set<Chunk>()
    function visit(chunk: Chunk) {
      if (reached.has(chunk)) return
      reached.add(chunk)
      for (const file of chunk.imports) {
        const dependency = byName.get(file)
        assert(dependency, `Missing static dependency ${file}`)
        visit(dependency)
      }
    }
    visit(entry)
    return reached
  }
  const entries = chunks.filter((chunk) => chunk.isEntry)
  assert.equal(entries.length, 1, 'Expected one application entry')
  const [catalog] = entries
  const bookmarks = chunks.find((chunk) =>
    chunk.facadeModuleId?.endsWith('/src/paginated.tsx'),
  )
  assert(
    catalog && bookmarks && bookmarks.isDynamicEntry,
    'Missing lazy route entries',
  )
  const initial = dependencies(catalog)
  assert(!initial.has(bookmarks), 'Bookmarks was loaded with the catalog')
  assert(
    [...initial].some((chunk) =>
      chunk.dynamicImports.includes(bookmarks.fileName),
    ),
    'Missing dynamic import to bookmarks',
  )
  const deferred = new Set(
    [...dependencies(bookmarks)].filter((chunk) => !initial.has(chunk)),
  )
  assert.equal(
    initial.size + deferred.size,
    chunks.length,
    'Unmeasured application chunk',
  )
  return {
    catalog: initial,
    bookmarks: deferred,
    entries: { catalog: catalog.fileName, bookmarks: bookmarks.fileName },
  }
}

function queryExports(chunks: Set<Chunk>, owns: (id: string) => boolean) {
  const exports = new Map<string, Set<string>>()
  for (const chunk of chunks) {
    for (const [id, module] of Object.entries(chunk.modules)) {
      if (!module.renderedLength) continue
      assert(
        !queryPackage.test(id) || owns(id),
        `Unexpected Query package ${id}`,
      )
      if (owns(id)) {
        assert(!exports.has(id), `Query module appears in two chunks: ${id}`)
        exports.set(id, new Set(module.renderedExports))
      }
    }
  }
  return exports
}

// Final minification can discard functions after Rolldown has recorded its
// rendered exports. Compare the Query sources still mapped to output bytes.
function mappedQuerySources(
  chunks: Set<Chunk>,
  outDir: string,
  owns: (id: string) => boolean,
) {
  const sources = new Set<string>()
  for (const chunk of chunks) {
    if (!Object.keys(chunk.modules).some(owns)) continue
    const map = chunk.map
    assert(map, `Missing source map for ${chunk.fileName}`)
    const querySources = new Map<string, string>()
    for (const source of map.sources) {
      const id = normalizePath(
        path.resolve(outDir, path.dirname(chunk.fileName), source),
      )
      if (owns(id)) querySources.set(source, id)
    }
    const trace = new SourceMap({ ...map, sourceRoot: '' })
    for (const [line, content] of chunk.code.split('\n').entries()) {
      for (let column = 0; column < content.length; column++) {
        const entry = trace.findEntry(line, column)
        if (!('originalSource' in entry)) continue
        const source = querySources.get(entry.originalSource)
        if (source) sources.add(source)
      }
    }
  }
  assert(sources.size > 0, 'Expected mapped Query bytes on this route')
  return sources
}

async function measureAdapter(
  root: string,
  source: string,
  adapter: Adapter,
  owners: ReadonlyArray<string>,
) {
  const pluggable = adapter === '@tanstack/react-query-pluggable'
  const owns = (id: string) =>
    owners.some((directory) => id.startsWith(directory))
  const name = path.posix.basename(adapter)
  const outDir = path.join(root, 'dist/lazy-routes', name)
  const packageScope = path.join(source, 'packages', name, 'package.json')
  async function routeBuild(groups?: Record<Phase, Map<string, Set<string>>>) {
    const result = await build({
      root: path.join(root, 'src/lazy'),
      publicDir: path.join(root, 'public'),
      base: './',
      configFile: false,
      mode: 'production',
      logLevel: 'warn',
      resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
          '#catalog-hooks': path.join(
            root,
            'src',
            pluggable ? 'pluggable-catalog.ts' : 'v6-catalog.ts',
          ),
          '#query-hooks': path.join(
            root,
            'src',
            pluggable ? 'pluggable-query.ts' : 'v6-query.ts',
          ),
        },
      },
      plugins: [
        {
          name: 'resolve-lazy-route-adapter',
          enforce: 'pre',
          resolveId(id) {
            if (id === '#adapter')
              return this.resolve(adapter, packageScope, { skipSelf: true })
            return null
          },
        },
      ],
      build: {
        outDir,
        emptyOutDir: true,
        write: !!groups,
        sourcemap: 'hidden',
        reportCompressedSize: false,
        rolldownOptions: {
          checks: { moduleLevelDirective: false },
          ...(groups && {
            output: {
              codeSplitting: {
                groups: [
                  // Query imports React, and the shell imports Query. Keep React and
                  // its CommonJS interop outside the shell to avoid a chunk cycle.
                  {
                    name: 'react-vendor',
                    test: (id: string) =>
                      /\/node_modules\/(?:react|react-dom|scheduler)\//.test(
                        id,
                      ) || id.includes('rolldown/runtime'),
                    includeDependenciesRecursively: true,
                  },
                  ...phases.map((phase) => ({
                    name: `query-${phase}`,
                    test: (id: string) => groups[phase].has(id),
                    includeDependenciesRecursively: false,
                  })),
                ],
              },
            },
          }),
        },
      },
    })
    assert('output' in result)
    return result.output.filter((output) => output.type === 'chunk')
  }
  const ordinary = routeGraph(await routeBuild())
  const groups = {
    catalog: queryExports(ordinary.catalog, owns),
    bookmarks: queryExports(ordinary.bookmarks, owns),
  }
  assert(
    [...groups.catalog.keys()].every((id) => !groups.bookmarks.has(id)),
    'A Query module was assigned to both routes',
  )
  for (const dir of owners)
    assert(
      [...groups.catalog.keys()].some((id) => id.startsWith(dir)),
      `Missing eager runtime from ${dir}`,
    )
  const published = routeGraph(await routeBuild(groups))
  const requests = {
    catalog: [] as Array<string>,
    bookmarks: [] as Array<string>,
    routeEntries: published.entries,
  }
  const bytes = { catalog: 0, bookmarks: 0 }
  for (const phase of phases) {
    const chunks = published[phase]
    assert.deepEqual(
      queryExports(chunks, owns),
      groups[phase],
      `${name} changed retained Query exports for ${phase}`,
    )
    const sources = mappedQuerySources(ordinary[phase], outDir, owns)
    assert.deepEqual(
      mappedQuerySources(chunks, outDir, owns),
      sources,
      `${name} changed emitted Query sources for ${phase}`,
    )
    // v6 constructs a mutation cache on startup and includes its infinite fetch behavior.
    // The pluggable pair first needs both when the bookmarks route opens.
    const firstVisit: Record<string, Phase> = {
      mutationCache: pluggable ? 'bookmarks' : 'catalog',
      infiniteQueryBehavior: pluggable ? 'bookmarks' : 'catalog',
      mutationObserver: 'bookmarks',
      useMutation: 'bookmarks',
      infiniteQueryObserver: 'bookmarks',
    }
    for (const [feature, visit] of Object.entries(firstVisit)) {
      assert.equal(
        [...sources].some((id) => path.basename(id) === feature + '.js'),
        visit === phase,
        `${name} ${phase}: ${feature}`,
      )
    }
    for (const chunk of chunks) {
      const ids = Object.entries(chunk.modules)
        .filter(([, module]) => module.renderedLength > 0)
        .map(([id]) => id)
      if (!ids.some(owns)) continue
      assert.equal(chunk.name, `query-${phase}`)
      assert(
        !chunk.imports.some(
          (file) =>
            file === published.entries.catalog ||
            file === published.entries.bookmarks,
        ),
        `Query runtime imports an application entry: ${chunk.fileName}`,
      )
      assert(ids.every(owns), `Foreign code in ${chunk.fileName}`)
      const file = await readFile(path.join(outDir, chunk.fileName))
      assert.equal(
        file.toString('utf8'),
        chunk.code,
        `Emitted contents differ for ${chunk.fileName}`,
      )
      bytes[phase] += gzipSync(file, { level: 9 }).length
      requests[phase].push(chunk.fileName)
    }
    assert(requests[phase].length, `No Query requests for ${phase}`)
  }
  await writeFile(
    path.join(outDir, 'query-requests.json'),
    JSON.stringify(requests),
  )
  return bytes
}

export async function measureLazyRoutes({
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
  runtimeOwners: (source: string, adapter: Adapter) => ReadonlyArray<string>
  formatChange: (bytes: number, baselineBytes: number) => string
}) {
  const source = baseCheckout ?? checkout
  const stock = await measureAdapter(
    root,
    source,
    baseline,
    runtimeOwners(source, baseline),
  )
  const experiment = await measureAdapter(
    root,
    checkout,
    pluggable,
    runtimeOwners(checkout, pluggable),
  )
  const rows = [
    ['Cold catalog', stock.catalog, experiment.catalog],
    [
      'First bookmarks render (additional)',
      stock.bookmarks,
      experiment.bookmarks,
    ],
    [
      'Catalog and bookmarks (cumulative)',
      stock.catalog + stock.bookmarks,
      experiment.catalog + experiment.bookmarks,
    ],
    ['Return to catalog (additional, checked in Chromium)', 0, 0],
  ] as const
  return [
    '### Lazy bookmarks on navigation or scroll',
    '',
    'One React app keeps its QueryClient mounted. The catalog loads at startup. React.lazy imports the same bookmarks module when the user opens the route or scrolls the shelf into view. Each Query-only file is gzipped individually at level 9. The benchmark checks module and export placement against Vite’s default production build. The cumulative row counts each URL once.',
    '',
    'The v6 catalog includes the mutation cache and infinite fetch behavior. Pluggable downloads those with bookmarks. Both apps defer the mutation hook and infinite observer until bookmarks are first rendered.',
    '',
    '| User action | React Query v6 | React Query Pluggable | Change vs v6 |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map(
      ([visit, base, next]) =>
        `| ${visit} | ${base.toLocaleString('en-US')} B | ${next.toLocaleString('en-US')} B | ${base ? formatChange(next, base) : '0 B'} |`,
    ),
  ].join('\n')
}
