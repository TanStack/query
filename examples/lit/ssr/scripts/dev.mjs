import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const tsxCommand = process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function runBuild() {
  const result = spawnSync(npmCommand, ['run', 'build'], {
    cwd,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

async function run() {
  runBuild()

  const server = spawn(tsxCommand, ['./server/index.mjs'], {
    cwd,
    stdio: 'inherit',
  })

  const stopServer = (signal) => {
    if (server.exitCode === null) {
      server.kill(signal)
    }
  }

  process.on('SIGINT', () => stopServer('SIGINT'))
  process.on('SIGTERM', () => stopServer('SIGTERM'))

  const outcome = await Promise.race([
    once(server, 'error').then(([error]) => {
      throw error
    }),
    once(server, 'exit').then(([code]) => ({ code })),
  ])

  process.exitCode = outcome.code ?? 0
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
