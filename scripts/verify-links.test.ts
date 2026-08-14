import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const verifyLinks = fileURLToPath(new URL('./verify-links.ts', import.meta.url))

test('accepts framework example links on every platform', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'tanstack-query-verify-links-'))

  try {
    mkdirSync(join(fixture, 'docs/framework/react'), { recursive: true })
    mkdirSync(join(fixture, 'examples/react/basic'), { recursive: true })
    writeFileSync(
      join(fixture, 'docs/framework/react/quick-start.md'),
      '[Basic example](./examples/basic)\n',
    )

    const output = execFileSync(
      process.execPath,
      ['--experimental-strip-types', verifyLinks],
      { cwd: fixture, encoding: 'utf8' },
    )

    assert.match(output, /No broken links found/)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})
