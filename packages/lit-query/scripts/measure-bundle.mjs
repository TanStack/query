import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const distDir = path.join(repoRoot, 'dist')
const entryFile = path.join(distDir, 'index.js')

async function getDirSizeBytes(dirPath) {
  let total = 0
  const entries = await readdir(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      total += await getDirSizeBytes(fullPath)
    } else if (entry.isFile()) {
      total += (await stat(fullPath)).size
    }
  }
  return total
}

async function run() {
  const entry = await readFile(entryFile)
  const entryGzip = gzipSync(entry)
  const distBytes = await getDirSizeBytes(distDir)

  const output = {
    measuredAt: new Date().toISOString(),
    entryJsBytes: entry.length,
    entryJsGzipBytes: entryGzip.length,
    distTotalBytes: distBytes,
  }

  console.log(JSON.stringify(output, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
