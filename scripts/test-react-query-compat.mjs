// Run the original runtime and type suites against the pluggable adapter. The temporary
// projects preserve the suites' relative imports without duplicating test cases.
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join, relative, resolve, sep } from 'node:path'
import { queryClientTestPort } from './port-query-client-tests.mjs'
import { portProjectionOptions } from './port-query-projection-tests.mjs'

const adapter = process.cwd()
const repository = resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const entry = join(adapter, 'src/index.ts')
const packageName = '@tanstack/react-query-pluggable'
const shared = [
  'environmentManager',
  'focusManager',
  'onlineManager',
  'removable',
  'retryer',
  'subscribable',
  'timeoutManager',
]

// Only adapt imports in copies of the upstream tests and their setup. The
// implementation and its workspace dependencies resolve the real core package.
function importPath(from, to) {
  return './' + relative(from, to).split(sep).join('/')
}

for (const suite of ['query-core', 'react-query']) {
  const upstream = join(repository, 'packages', suite)
  const cache = join(upstream, '.cache')
  mkdirSync(cache, { recursive: true })
  const project = mkdtempSync(join(cache, 'compat-'))
  try {
    const source = join(project, 'src')
    const implementation =
      suite === 'query-core'
        ? join(adapter, 'src/runtime')
        : join(adapter, 'src')
    cpSync(join(upstream, 'src/__tests__'), join(source, '__tests__'), {
      recursive: true,
      // Only query-core exposes the extension points for non-React adapters.
      filter: (path) =>
        suite !== 'query-core' || basename(path) !== 'frameworkAdapters',
    })
    const tests = join(source, '__tests__')
    const originals = join(upstream, 'src/__tests__')
    const testFiles = readdirSync(tests, { recursive: true }).filter((file) =>
      /\.tsx?$/.test(file),
    )
    const configFiles =
      suite === 'react-query'
        ? [
            join(upstream, 'test-setup.ts'),
            join(
              repository,
              'packages/query-persist-client-core/src/createPersister.ts',
            ),
          ]
        : []
    const port = queryClientTestPort(
      upstream,
      [...testFiles.map((file) => join(originals, file)), ...configFiles],
      packageName,
    )
    function copyTestModule(from, to) {
      writeFileSync(to, port(from))
    }
    for (const file of testFiles)
      copyTestModule(join(originals, file), join(tests, file))
    portProjectionOptions(tests)

    for (const file of readdirSync(implementation, { withFileTypes: true })) {
      if (!file.isFile() || !/\.tsx?$/.test(file.name)) continue
      const target = importPath(source, join(implementation, file.name))
      writeFileSync(join(source, file.name), `export * from '${target}'\n`)
    }
    if (suite === 'query-core') {
      for (const name of shared) {
        writeFileSync(
          join(source, name + '.ts'),
          "export * from '@tanstack/query-core/primitives'\n",
        )
      }
      // The pluggable runtime exposes the page fetcher directly.
      writeFileSync(
        join(source, '__tests__/infiniteFetch.ts'),
        `export { prepareInfiniteFetch } from '../infiniteQueryBehavior'\n`,
      )
      // Upstream tests use ".." for the public package and "../foo" for internals.
      writeFileSync(
        join(source, 'index.ts'),
        `export * from '${importPath(source, entry)}'\n`,
      )
    }

    const setup = join(project, 'test-setup.ts')
    const persister = join(source, 'createPersister.ts')
    if (suite === 'react-query') {
      copyTestModule(join(upstream, 'test-setup.ts'), setup)
      copyTestModule(
        join(
          repository,
          'packages/query-persist-client-core/src/createPersister.ts',
        ),
        persister,
      )
    }
    const tsconfig = {
      extends: join(adapter, 'tsconfig.json'),
      compilerOptions: {
        rootDir: repository,
        composite: false,
        incremental: false,
        emitDeclarationOnly: false,
        noEmit: true,
        paths: {
          [packageName]: [entry],
          // This suite exercises only the per-query persistence implementation.
          ...(suite === 'react-query' && {
            '@tanstack/query-persist-client-core': [persister],
          }),
          ...Object.fromEntries(
            ['polling', 'projection', 'scope'].map((name) => [
              `@tanstack/query-test-utils/${name}`,
              [join(adapter, `tests/compat-${name}.ts`)],
            ]),
          ),
        },
      },
      include: suite === 'react-query' ? ['src', setup] : ['src'],
    }
    writeFileSync(join(project, 'tsconfig.json'), JSON.stringify(tsconfig))
    execFileSync(
      process.execPath,
      [
        join(require.resolve('vitest/package.json'), '../vitest.mjs'),
        'run',
        '--config',
        join(import.meta.dirname, 'react-query-compat.config.ts'),
        ...process.argv.slice(2),
      ],
      {
        cwd: project,
        stdio: 'inherit',
        env: { ...process.env, REACT_QUERY_COMPAT_ADAPTER: adapter },
      },
    )
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
}
