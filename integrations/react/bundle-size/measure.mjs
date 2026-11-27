import { execFileSync } from 'node:child_process'
import { readFile, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { build, normalizePath } from 'vite'

const root = import.meta.dirname
const baseCheckout = process.env.QUERY_BASE_CHECKOUT
  ? await realpath(process.env.QUERY_BASE_CHECKOUT)
  : undefined
const basePackage =
  baseCheckout && path.join(baseCheckout, 'packages/react-query')
const baseline = '@tanstack/react-query'
const pluggable = '@tanstack/react-query-no-core-pluggable'
const packages = [baseline, '@tanstack/react-query-no-core', pluggable]
const workloads = [
  { screen: 'query', title: 'Read-only list · useQuery' },
  {
    screen: 'paginated',
    title:
      'Paginated list with bookmarks · useQuery, useMutation, useInfiniteQuery',
  },
  {
    screen: 'options',
    title:
      'Selected and placeholder data, serial bookmarks and cache invalidation',
  },
  {
    screen: 'polling',
    title: 'Polling with the four regular and suspense query hooks',
  },
]

const excludedFromStandaloneApps = [
  /\/(?:packages|node_modules\/@tanstack)\/(?:query-core|(?:angular|lit|preact|solid|svelte|vue)-query[^/]*)\//,
  /\/node_modules\/(?:@angular|@lit|@vue|lit|lit-element|lit-html|preact|solid-js|svelte|vue)\//,
]

async function measure(packageName, screen) {
  const outDir = path.join(root, 'dist', screen, packageName.split('/')[1])
  const result = await build({
    root,
    base: './',
    configFile: false,
    mode: 'production',
    logLevel: 'warn',
    plugins: [
      {
        name: 'resolve-benchmark-adapter',
        enforce: 'pre',
        resolveId(id, importer) {
          if (id !== '#adapter') return
          // Resolve the public browser export using the requested checkout's package scope.
          const from =
            packageName === baseline && basePackage
              ? path.join(basePackage, 'package.json')
              : importer
          return this.resolve(packageName, from, { skipSelf: true })
        },
      },
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '#polling-option': path.join(
          root,
          'src',
          packageName === pluggable
            ? 'pluggable-interval.js'
            : 'numeric-interval.js',
        ),
        '#feature-options': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-options.js' : 'v6-options.js',
        ),
        '#screen': path.join(root, 'src', `${screen}.jsx`),
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      reportCompressedSize: false,
      // All modules in these apps execute on the client.
      rolldownOptions: { checks: { moduleLevelDirective: false } },
    },
  })
  const chunks = result.output.filter((output) => output.type === 'chunk')
  if (!chunks.some((chunk) => chunk.isEntry)) {
    throw new Error(`Missing browser entry chunk for ${packageName}`)
  }
  const modules = chunks.flatMap((chunk) =>
    Object.entries(chunk.modules)
      .filter(([, module]) => module.renderedLength > 0)
      .map(([id]) => id),
  )
  if (
    packageName === baseline &&
    basePackage &&
    !modules.some((id) => id.startsWith(normalizePath(basePackage) + '/build/'))
  ) {
    throw new Error(
      `Missing built @tanstack/react-query from base checkout ${basePackage}`,
    )
  }
  if (
    modules.some((id) =>
      /\/(?:packages|node_modules\/@tanstack)\/query-types\//.test(id),
    )
  ) {
    throw new Error(
      `${packageName} shipped runtime code from @tanstack/query-types`,
    )
  }
  if (packageName !== baseline) {
    const foreignRuntime = modules.find((id) =>
      excludedFromStandaloneApps.some((pattern) => pattern.test(id)),
    )
    if (foreignRuntime) {
      throw new Error(
        `${packageName} bundled unexpected runtime code: ${foreignRuntime}`,
      )
    }
    if (
      chunks.some((chunk) =>
        chunk.moduleIds.some((id) => id.endsWith('/build/runtime/index.js')),
      )
    ) {
      throw new Error(
        `${packageName} included an internal runtime barrel in the app`,
      )
    }
  }
  if (packageName === pluggable) {
    const features = {
      refetchInterval: screen === 'polling',
      infiniteQueryBehavior: screen === 'paginated' || screen === 'polling',
      select: screen === 'options',
      placeholderData: screen === 'options',
      serialScope: screen === 'options',
      cacheOperations: screen === 'options',
    }
    for (const [feature, expected] of Object.entries(features)) {
      const included = modules.some((id) =>
        id.endsWith(`/runtime/${feature}.js`),
      )
      if (included !== expected) {
        throw new Error(
          `Unexpected ${feature} implementation in ${screen}: included=${included}`,
        )
      }
    }
  }

  const sizes = { raw: 0, gzip: 0, brotli: 0 }
  for (const chunk of chunks) {
    const js = await readFile(path.join(outDir, chunk.fileName))
    sizes.raw += js.length
    sizes.gzip += gzipSync(js, { level: 9 }).length
    sizes.brotli += brotliCompressSync(js, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length
  }
  return sizes
}

// A combined app cannot tell whether each projection pulls in its sibling,
// or whether rendering a boundary pulls in paused-mutation restoration.
async function checkStandaloneExports() {
  const expected = {
    select: ['select', 'projectResult'],
    placeholderData: ['placeholderData', 'projectResult'],
    serialScope: ['serialScope'],
    invalidateQueries: ['cacheOperations'],
    HydrationBoundary: ['infiniteQueryBehavior'],
    hydrate: ['infiniteQueryBehavior', 'mutation', 'serialScope'],
  }
  const features = new Set(Object.values(expected).flat())
  const entry = path.join(root, 'public-export-probe.js')
  for (const [name, required] of Object.entries(expected)) {
    const results = await build({
      root,
      configFile: false,
      logLevel: 'error',
      plugins: [
        {
          name: 'import-one-public-export',
          resolveId(id) {
            if (id === entry) return id
          },
          load(id) {
            if (id === entry) return `export { ${name} } from '${pluggable}'`
          },
        },
      ],
      build: {
        write: false,
        lib: { entry, formats: ['es'], fileName: 'probe' },
        rolldownOptions: {
          external: ['react', 'react/jsx-runtime'],
          checks: { moduleLevelDirective: false },
        },
      },
    })
    const modules = results
      .flatMap(({ output }) =>
        output
          .filter((file) => file.type === 'chunk')
          .flatMap((chunk) => Object.entries(chunk.modules)),
      )
      .filter(([, module]) => module.renderedLength > 0)
    for (const feature of features) {
      const included = modules.some(([id]) =>
        id.endsWith(`/runtime/${feature}.js`),
      )
      if (included !== required.includes(feature)) {
        throw new Error(
          `Importing ${name} unexpectedly ${included ? 'included' : 'excluded'} ${feature}`,
        )
      }
    }
    if (name === 'invalidateQueries') {
      const [, operations] = modules.find(([id]) =>
        id.endsWith('/runtime/cacheOperations.js'),
      )
      if (
        operations.renderedExports.some(
          (item) => !['invalidateQueries', 'refetchQueries'].includes(item),
        )
      ) {
        throw new Error('Invalidation included unrelated bulk cache operations')
      }
    }
  }
}
await checkStandaloneExports()

const integer = new Intl.NumberFormat('en-US')
function formatSize(bytes, baselineBytes, isBaseline) {
  const size = `${integer.format(bytes)} B`
  if (isBaseline) return size
  const difference = bytes - baselineBytes
  const sign = difference > 0 ? '+' : ''
  const percent = ((100 * difference) / baselineBytes).toFixed(2)
  return `${size} (${sign}${integer.format(difference)} B, ${sign}${percent}%)`
}

// Inspect the published ESM entry points as a consumer would.
for (const name of packages.filter((name) => name !== baseline)) {
  const {
    queryOptions,
    mutationOptions,
    infiniteQueryOptions,
    QueriesObserver,
    notifyManager,
  } = await import(name)
  if (
    'getQueries' in QueriesObserver.prototype ||
    'setBatchNotifyFunction' in notifyManager
  ) {
    throw new Error(
      `${name} exposed another adapter's observer or batch notification API`,
    )
  }
  if (
    typeof queryOptions !== 'function' ||
    queryOptions !== mutationOptions ||
    queryOptions !== infiniteQueryOptions
  ) {
    throw new Error(
      `${name} must export one runtime function for all three option factories`,
    )
  }
}

function revision(directory) {
  return execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim()
}

const head = revision(root)
const base = baseCheckout ? revision(baseCheckout) : head
const lines = [
  '## React Query app bundle size',
  '',
  `Baseline adapter at \`${base}\` (${baseCheckout ? 'base checkout' : 'current checkout'}). Alternatives and fixture at \`${head}\`.`,
  '',
  'Each row includes the same React, React DOM and production Vite app. Changes are relative to the baseline for that workload. A negative change is a saving.',
]
for (const { screen, title } of workloads) {
  lines.push(
    '',
    `### ${title}`,
    '',
    '| Package | Minified JS | Gzip | Brotli |',
    '| --- | ---: | ---: | ---: |',
  )
  let baselineSizes
  for (const name of packages) {
    const sizes = await measure(name, screen)
    baselineSizes ??= sizes
    const cells = Object.entries(sizes).map(([key, value]) =>
      formatSize(value, baselineSizes[key], name === baseline),
    )
    lines.push(`| \`${name}\` | ${cells.join(' | ')} |`)
  }
}
lines.push(
  '',
  'Gzip level 9 and Brotli quality 11 are applied to each JavaScript chunk before summing. All workloads use the default client. The polling workload imports the interval scheduler. The options workload imports selection, placeholder data, serial scopes and invalidation.',
  '',
)
const report = lines.join('\n')
await writeFile(path.join(root, 'dist/report.md'), report)
process.stdout.write(report)
