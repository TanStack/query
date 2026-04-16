import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageManagerCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scriptName = process.argv[2]

if (!scriptName) {
  throw new Error('Missing script name for public-origin wrapper.')
}

const child = spawn(packageManagerCommand, ['run', scriptName], {
  cwd,
  env: {
    ...process.env,
    SSR_PUBLIC_ORIGIN: process.env.SSR_PUBLIC_ORIGIN ?? 'http://localhost:4174',
  },
  stdio: 'inherit',
})

const forwardSignal = (signal) => {
  if (child.exitCode === null) {
    child.kill(signal)
  }
}

process.on('SIGINT', () => forwardSignal('SIGINT'))
process.on('SIGTERM', () => forwardSignal('SIGTERM'))

child.on('error', (error) => {
  console.error(error)
  process.exitCode = 1
})

const [code] = await once(child, 'exit')
process.exitCode = code ?? 1
