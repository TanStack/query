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
    const includesPolling = modules.some((id) =>
      id.endsWith('/runtime/refetchInterval.js'),
    )
    if (includesPolling !== (screen === 'polling')) {
      throw new Error(
        `Unexpected refetchInterval implementation in ${screen}: included=${includesPolling}`,
      )
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
  'Gzip level 9 and Brotli quality 11 are applied to each JavaScript chunk before summing. All workloads use the default client. Only the polling app imports the pluggable refetchInterval helper.',
  '',
)
const report = lines.join('\n')
await writeFile(path.join(root, 'dist/report.md'), report)
process.stdout.write(report)
