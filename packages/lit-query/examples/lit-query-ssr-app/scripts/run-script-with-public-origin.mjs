import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scriptName = process.argv[2]

if (!scriptName) {
  throw new Error('Missing npm script name for public-origin wrapper.')
}

const child = spawn(npmCommand, ['run', scriptName], {
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
