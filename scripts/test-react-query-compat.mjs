// Run the original runtime and type suites against the pluggable adapter. The temporary
// projects preserve the suites' relative imports without duplicating test cases.
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative, resolve, sep } from 'node:path'
import { queryClientTestPort } from './port-query-client-tests.mjs'
import { portProjectionOptions } from './port-query-projection-tests.mjs'

const adapter = process.cwd()
const repository = resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const entry = join(adapter, 'src/index.ts')
const packageName = '@tanstack/react-query-pluggable'
const coreName = '@tanstack/query-core-pluggable'
const coreSource = join(repository, 'packages/query-core-pluggable/src')

// Only adapt imports in copies of the upstream tests and their setup. The
// implementation and its workspace dependencies resolve the real core package.
function importPath(from, to) {
  return './' + relative(from, to).split(sep).join('/')
}

const args = process.argv.slice(2)
const selected = args.find((arg) => arg.startsWith('--suite='))?.slice(8)
if (selected && !['query-core', 'react-query'].includes(selected))
  throw new Error('Unknown test suite ' + selected)
for (const suite of selected ? [selected] : ['query-core', 'react-query']) {
  const upstream = join(repository, 'packages', suite)
  const experiment = join(repository, 'packages', suite + '-pluggable')
  const cache = join(experiment, '.cache', suite)
  mkdirSync(cache, { recursive: true })
  const project = mkdtempSync(join(cache, 'compat-'))
  try {
    const source = join(project, 'src')
    const implementation =
      suite === 'query-core' ? coreSource : join(adapter, 'src')
    const tests = join(source, '__tests__')
    const originals = join(upstream, 'src/__tests__')
    cpSync(originals, tests, { recursive: true })
    // Use exactly the dependencies installed for the corresponding v6 suite.
    symlinkSync(
      join(upstream, 'node_modules'),
      join(project, 'node_modules'),
      'junction',
    )
    // Only divergent expectations need a patch. Git checks its context so an
    // incompatible change to an upstream case fails the compatibility run.
    execFileSync(
      'git',
      [
        'apply',
        '--directory=' + relative(repository, project),
        join(experiment, 'tests/compat', suite + '.patch'),
      ],
      { cwd: repository },
    )
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
    const copies = new Map(
      testFiles.map((f) => [join(originals, f), join(tests, f)]),
    )
    const compatPaths = { '#compat/*': [join(adapter, 'tests/compat-*.ts')] }
    const port = queryClientTestPort(
      upstream,
      [...copies.keys(), ...configFiles],
      coreName,
      copies,
      compatPaths,
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
    if (suite === 'react-query') {
      // Exercise the same upstream cases through the required descriptor API.
      const compat = join(adapter, 'tests/compat-useQuery.ts')
      for (const module of ['index', 'useQuery']) {
        const real = importPath(source, join(implementation, module))
        writeFileSync(
          join(source, module + '.ts'),
          `export * from '${real}'\nexport { useQuery } from '${importPath(source, compat)}'\n`,
        )
      }
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
          [coreName]: [join(coreSource, 'index.ts')],
          // This suite exercises only the per-query persistence implementation.
          ...(suite === 'react-query' && {
            '@tanstack/query-persist-client-core': [persister],
          }),
          ...Object.fromEntries(
            ['polling', 'projection', 'scope', 'descriptors', 'result'].map(
              (name) => [
                `#compat/${name}`,
                [join(adapter, `tests/compat-${name}.ts`)],
              ],
            ),
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
        ...args.filter((arg) => !arg.startsWith('--suite=')),
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
