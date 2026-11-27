// Run the original runtime and type suites against each adapter. The temporary
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
import { portProjectionOptions } from './port-query-projection-tests.mjs'

const adapter = process.cwd()
const repository = resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const entry = join(adapter, 'src/index.ts')
const pluggable = basename(adapter) === 'react-query-no-core-pluggable'
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
    if (pluggable) {
      portProjectionOptions(join(source, '__tests__'))
    }

    for (const file of readdirSync(implementation, { withFileTypes: true })) {
      if (!file.isFile() || !/\.tsx?$/.test(file.name)) continue
      const target = importPath(source, join(implementation, file.name))
      writeFileSync(join(source, file.name), `export * from '${target}'\n`)
    }
    if (suite === 'query-core') {
      // The React runtimes expose the page fetcher directly.
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

    const setup = join(repository, 'packages/react-query/test-setup.ts')
    const tsconfig = {
      extends: join(adapter, 'tsconfig.json'),
      compilerOptions: {
        rootDir: repository,
        composite: false,
        incremental: false,
        emitDeclarationOnly: false,
        noEmit: true,
        paths: {
          '@tanstack/query-core': [entry],
          // The React suite uses per-query persistence. The separate whole-client
          // persister subscribes through the original client's mutation-cache method.
          ...(pluggable &&
            suite === 'react-query' && {
              '@tanstack/query-persist-client-core': [
                join(
                  repository,
                  'packages/query-persist-client-core/src/createPersister.ts',
                ),
              ],
            }),
          ...(pluggable &&
            Object.fromEntries(
              ['polling', 'cacheOperations', 'projection', 'scope'].map(
                (name) => [
                  `@tanstack/query-test-utils/${name}`,
                  [join(adapter, `tests/compat-${name}.ts`)],
                ],
              ),
            )),
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
