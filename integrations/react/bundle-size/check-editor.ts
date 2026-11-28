import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import type ts from 'typescript'

const files = [
  'src/main.tsx',
  'src/remote.tsx',
  ...(process.argv.includes('--baseline') ? ['src/v6-query.ts'] : []),
  'src/treeshakable-query.ts',
]
const requests = files.flatMap((name, index) => {
  const file = resolve(import.meta.dirname, name)
  return ['open', 'semanticDiagnosticsSync'].map((command, offset) =>
    JSON.stringify({
      seq: index * 2 + offset + 1,
      type: 'request',
      command,
      arguments: { file },
    }),
  )
})
const tsserver = createRequire(import.meta.url).resolve(
  'typescript/lib/tsserver.js',
)
const run = spawnSync(
  process.execPath,
  [tsserver, '--disableAutomaticTypingAcquisition'],
  {
    input: requests.join('\n') + '\n',
    encoding: 'utf8',
  },
)
if (run.error) throw run.error
assert.equal(run.status, 0, run.stderr)

// tsserver frames each JSON message with a Content-Length header.
const diagnostics: Array<ts.server.protocol.SemanticDiagnosticsSyncResponse> =
  run.stdout
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line))
    .filter((message) => message.command === 'semanticDiagnosticsSync')
for (const [index, file] of files.entries()) {
  const report = diagnostics.find(
    (response) => response.request_seq === index * 2 + 2,
  )
  assert.ok(
    report?.success,
    report?.message ?? `Missing editor diagnostics for ${file}`,
  )
  assert.deepEqual(report.body, [], file)
}
