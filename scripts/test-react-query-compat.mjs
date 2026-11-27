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

const adapter = process.cwd()
const repository = resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const core = join(adapter, 'src/runtime/index.ts')
const pluggable = basename(adapter) === 'react-query-no-core-pluggable'
const fixture = join(adapter, 'tests/compat-client.ts')
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
    })

    if (pluggable && suite === 'query-core') {
      const tests = join(source, '__tests__')
      writeFileSync(
        join(tests, 'clientOptions.ts'),
        `export type { AdapterClientOptions } from '${importPath(tests, fixture)}'\n`,
      )
    }

    for (const file of readdirSync(implementation, { withFileTypes: true })) {
      if (!file.isFile() || !/\.tsx?$/.test(file.name)) continue
      const target = importPath(source, join(implementation, file.name))
      let exports = `export * from '${target}'\n`
      if (pluggable && ['index.ts', 'queryClient.ts'].includes(file.name)) {
        const client = importPath(source, fixture)
        exports += `export { QueryClient } from '${client}'\n`
      }
      writeFileSync(join(source, file.name), exports)
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
        paths: { '@tanstack/query-core': [core] },
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
