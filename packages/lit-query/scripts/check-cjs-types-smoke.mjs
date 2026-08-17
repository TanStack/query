import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = resolve(projectDir, '..', '..')
const typeRootsDir = resolve(workspaceRoot, 'node_modules', '@types')
const tscEntrypoint = resolve(
  workspaceRoot,
  'node_modules',
  'typescript',
  'lib',
  'tsc.js',
)

const tempRoot = await mkdtemp(join(tmpdir(), 'tanstack-lit-query-cjs-smoke-'))
const packDir = resolve(tempRoot, 'pack')
const consumerDir = resolve(tempRoot, 'consumer')

try {
  const tarballPath = await packProject(packDir)

  await writeConsumerFixture(consumerDir)
  await installConsumer(consumerDir, tarballPath)
  await typecheckConsumer(consumerDir)

  console.log('CommonJS TypeScript smoke test passed.')
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

async function packProject(destination) {
  await mkdir(destination, { recursive: true })

  const { stdout } = await execFile(
    pnpmCommand,
    ['pack', '--json', '--pack-destination', destination],
    {
      cwd: projectDir,
    },
  )
  const packResult = JSON.parse(stdout)
  const filename = Array.isArray(packResult)
    ? packResult[0]?.filename
    : packResult?.filename

  if (typeof filename !== 'string') {
    throw new Error(`Unexpected pack output: ${stdout}`)
  }

  return resolve(destination, filename)
}

async function writeConsumerFixture(consumerDirectory) {
  await rm(consumerDirectory, { recursive: true, force: true })
  await mkdir(consumerDirectory, { recursive: true })

  await writeFile(
    resolve(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        private: true,
        type: 'commonjs',
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  await writeFile(
    resolve(consumerDirectory, 'index.cts'),
    [
      "const pkg = require('@tanstack/lit-query')",
      '',
      "type CreateQueryOptions = import('@tanstack/lit-query').CreateQueryOptions<string>",
      '',
      'const options: CreateQueryOptions = {',
      "  queryKey: ['cjs-smoke'],",
      "  queryFn: async () => 'ok',",
      '}',
      '',
      "if (typeof pkg.createQueryController !== 'function') {",
      "  throw new Error('createQueryController export is missing in CommonJS consumer.')",
      '}',
      '',
      'void pkg.queryOptions(options)',
      '',
    ].join('\n'),
    'utf8',
  )

  await writeFile(
    resolve(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: 'Node16',
          moduleResolution: 'Node16',
          target: 'ES2022',
          strict: true,
          noEmit: true,
          types: ['node'],
          typeRoots: [typeRootsDir],
        },
        include: ['index.cts'],
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  await writeFile(
    resolve(consumerDirectory, '.npmrc'),
    'package-lock=false\n',
    'utf8',
  )
}

async function installConsumer(consumerDirectory, tarballPath) {
  await execFile(npmCommand, ['install', '--silent', tarballPath], {
    cwd: consumerDirectory,
  })
}

async function typecheckConsumer(consumerDirectory) {
  await execFile(process.execPath, [tscEntrypoint, '-p', 'tsconfig.json'], {
    cwd: consumerDirectory,
  })
}
