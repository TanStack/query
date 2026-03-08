import { spawn } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cwd = process.cwd()
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(scriptDir, '..')
const pnpmStoreDir = path.join(workspaceRoot, 'node_modules', '.pnpm')
const targetTypeScriptVersion = '5.9.3'

async function findSvelteCheckBin(): Promise<string> {
  const entries = await readdir(pnpmStoreDir, { withFileTypes: true })
  const match = entries.find(
    (entry) =>
      entry.isDirectory() &&
      entry.name.startsWith('svelte-check@') &&
      entry.name.includes(`typescript@${targetTypeScriptVersion}`),
  )

  if (!match) {
    throw new Error(
      `Could not find a svelte-check installation paired with TypeScript ${targetTypeScriptVersion}.`,
    )
  }

  return path.join(
    pnpmStoreDir,
    match.name,
    'node_modules',
    'svelte-check',
    'bin',
    'svelte-check',
  )
}

const svelteCheckBin = await findSvelteCheckBin()

const child = spawn(process.execPath, [svelteCheckBin, ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
