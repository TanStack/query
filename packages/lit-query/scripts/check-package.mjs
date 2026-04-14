import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')

const rawOutput = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: repoRoot,
  encoding: 'utf8',
})

const packResult = JSON.parse(rawOutput)
const packedFiles = Array.isArray(packResult)
  ? (packResult[0]?.files ?? [])
  : (packResult.files ?? [])

const disallowedPrefixes = ['docs/', 'src/tests/']
const leakedFiles = packedFiles
  .map((file) => file.path)
  .filter((filePath) =>
    disallowedPrefixes.some((prefix) => filePath.startsWith(prefix)),
  )

if (leakedFiles.length > 0) {
  console.error(
    `Disallowed files are included in the package tarball:\n${leakedFiles.join('\n')}`,
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      fileCount: packedFiles.length,
      disallowedPrefixes,
    },
    null,
    2,
  ),
)
