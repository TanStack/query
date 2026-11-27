import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { build } from 'vite'

const root = import.meta.dirname
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
]

async function measure(packageName, screen) {
  const withPlugins = packageName === pluggable && screen === 'paginated'
  const outDir = path.join(root, 'dist', screen, packageName.split('/')[1])
  const result = await build({
    root,
    base: './',
    configFile: false,
    mode: 'production',
    logLevel: 'warn',
    resolve: {
      alias: {
        '#adapter': packageName,
        '#client': path.join(
          root,
          'src',
          withPlugins ? 'plugin-client.js' : 'client.js',
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
    modules.some((id) =>
      /\/(?:packages|node_modules\/@tanstack)\/query-types\//.test(id),
    )
  ) {
    throw new Error(
      `${packageName} shipped runtime code from @tanstack/query-types`,
    )
  }
  if (
    packageName !== baseline &&
    modules.some((id) =>
      /\/(?:packages|node_modules\/@tanstack)\/query-core\//.test(id),
    )
  ) {
    throw new Error(`${packageName} bundled @tanstack/query-core`)
  }
  if (
    packageName === pluggable &&
    screen === 'query' &&
    modules.some((id) =>
      /\/runtime\/(mutation|mutationCache|infiniteQueryBehavior)\.js$/.test(id),
    )
  ) {
    throw new Error(
      'The query-only client bundled an optional plugin implementation',
    )
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

const lines = [
  '## React Query app bundle size',
  '',
  'Each row includes React, React DOM and the same production Vite app. Changes are relative to `@tanstack/react-query` in the same workload and commit. A negative change is a saving.',
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
  'Gzip level 9 and Brotli quality 11 are applied to each JavaScript chunk before summing. The pluggable client registers mutation and infinite-query support for the paginated workload.',
  '',
)
const report = lines.join('\n')
await writeFile(path.join(root, 'dist/report.md'), report)
process.stdout.write(report)
