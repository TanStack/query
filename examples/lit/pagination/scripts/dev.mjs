import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { API_PORT } from '../config/ports.js'

const viteCommand = process.platform === 'win32' ? 'vite.cmd' : 'vite'
const cwd = new URL('..', import.meta.url)

function forwardOutput(prefix, stream, output) {
  stream.on('data', (chunk) => {
    output.write(`${prefix}${chunk}`)
  })
}

function start(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...extraEnv,
    },
  })

  forwardOutput(`[${name}] `, child.stdout, process.stdout)
  forwardOutput(`[${name}] `, child.stderr, process.stderr)

  return child
}

async function stop(child) {
  if (!child || child.exitCode !== null) {
    return
  }

  child.kill('SIGTERM')
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ])

  if (child.exitCode === null) {
    child.kill('SIGKILL')
    await Promise.race([
      once(child, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ])
  }
}

async function run() {
  const api = start('api', process.execPath, ['./server/index.mjs'])
  const web = start('web', viteCommand, [], {
    VITE_PAGINATION_API_PORT: String(API_PORT),
  })

  const shutdown = async () => {
    await Promise.all([stop(web), stop(api)])
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  const [winner] = await Promise.race([
    once(api, 'exit').then(([code]) => ({ name: 'api', code })),
    once(web, 'exit').then(([code]) => ({ name: 'web', code })),
  ])

  await shutdown()

  if (winner.code !== 0 && winner.code !== null) {
    process.exitCode = winner.code
  } else {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
