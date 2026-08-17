import { spawnSync } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { compile } from 'octane/compiler'
import { build } from 'vite'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const temporaryDirectory = await mkdtemp(join(packageRoot, '.pack-smoke-'))
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed`)
  }
  return result.stdout
}

try {
  const packedResult = JSON.parse(
    run(packageManager, [
      'pack',
      '--pack-destination',
      temporaryDirectory,
      '--json',
    ]),
  )
  const tarballPath = isAbsolute(packedResult.filename)
    ? packedResult.filename
    : join(temporaryDirectory, packedResult.filename)
  run('tar', ['-xzf', tarballPath, '-C', temporaryDirectory])

  const extractedRoot = join(
    temporaryDirectory,
    'node_modules/@tanstack/octane-query',
  )
  await mkdir(dirname(extractedRoot), { recursive: true })
  await rename(join(temporaryDirectory, 'package'), extractedRoot)
  const packedManifest = JSON.parse(
    await readFile(join(extractedRoot, 'package.json'), 'utf8'),
  )
  const requiredFiles = [
    'README.md',
    'src/index.ts',
    'src/HydrationBoundary.tsrx',
    'src/HydrationBoundary.tsrx.d.ts',
    'src/QueryClientProvider.tsrx',
    'src/QueryClientProvider.tsrx.d.ts',
    'src/QueryErrorResetBoundary.tsrx',
    'src/QueryErrorResetBoundary.tsrx.d.ts',
  ]

  for (const file of requiredFiles) {
    await readFile(join(extractedRoot, file))
  }

  if (packedResult.files.some((file) => file.path.includes('/__tests__/'))) {
    throw new Error('Packed package contains source tests')
  }
  if (packedManifest.dependencies['@tanstack/query-core'] === 'workspace:*') {
    throw new Error(
      'Packed manifest contains an unresolved workspace dependency',
    )
  }
  if (
    JSON.stringify(packedManifest.octane?.hookSlots?.manual) !==
    JSON.stringify(['src'])
  ) {
    throw new Error(
      'Packed manifest is missing the manual Octane slot contract',
    )
  }

  const consumerPath = join(temporaryDirectory, 'consumer.tsrx')
  await writeFile(
    consumerPath,
    `import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/octane-query'

const client = new QueryClient()

function Result() @{
  const query = useQuery({ queryKey: ['pack-smoke'], queryFn: () => Promise.resolve('ok') })
  <span>{String(query.data ?? query.status)}</span>
}

export function App() @{
  <QueryClientProvider client={client}>
    <Result />
  </QueryClientProvider>
}
`,
  )

  const compiledModes = new Set()
  const compilerPlugin = {
    name: 'tanstack-octane-query:pack-smoke-compiler',
    enforce: 'pre',
    transform(code, id, options) {
      const filename = id.split('?', 1)[0]
      if (!filename.endsWith('.tsrx')) {
        return null
      }
      const mode = options?.ssr ? 'server' : 'client'
      compiledModes.add(mode)
      return compile(code, filename, { mode })
    },
  }
  const sharedConfig = {
    configFile: false,
    logLevel: 'silent',
    root: temporaryDirectory,
    plugins: [compilerPlugin],
    resolve: {
      alias: {
        '@tanstack/query-core': join(packageRoot, '../query-core/src/index.ts'),
      },
      conditions: ['module'],
    },
  }

  await build({
    ...sharedConfig,
    build: {
      write: false,
      lib: { entry: consumerPath, formats: ['es'] },
    },
  })
  await build({
    ...sharedConfig,
    build: {
      write: false,
      ssr: consumerPath,
    },
    ssr: {
      noExternal: ['@tanstack/octane-query'],
    },
  })

  if (!compiledModes.has('client') || !compiledModes.has('server')) {
    throw new Error(
      'Packed consumer was not compiled in client and server modes',
    )
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}
