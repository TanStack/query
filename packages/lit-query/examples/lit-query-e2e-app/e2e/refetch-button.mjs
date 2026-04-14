import assert from 'node:assert/strict'
import {
  baseUrl,
  readNumberFromTail,
  waitForText,
  withBrowserPage,
} from './lib.mjs'

async function waitForRequestCountIncrease(page, baseline, timeoutMs = 10_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const value = await readNumberFromTail(
      page,
      '[data-testid="request-count"]',
    )
    if (value > baseline) {
      return value
    }
    await page.waitForTimeout(100)
  }

  throw new Error(
    `Timed out waiting for request count to increase above ${baseline} after refetch.`,
  )
}

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and reset demo state')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await page.click('[data-testid="reset-demo-state"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await waitForText(
      page,
      '[data-testid="active-fetches"]',
      'fetches: 0',
      10_000,
    )

    const before = await readNumberFromTail(
      page,
      '[data-testid="request-count"]',
    )

    console.log('Step 2: click refetch and assert request count increment')
    await page.click('[data-testid="refetch"]')
    const after = await waitForRequestCountIncrease(page, before, 10_000)
    assert.ok(
      after > before,
      'manual refetch should trigger at least one additional server request',
    )

    console.log('Step 3: wait for counters to settle')
    await waitForText(
      page,
      '[data-testid="active-fetches"]',
      'fetches: 0',
      10_000,
    )
    await waitForText(
      page,
      '[data-testid="active-mutations"]',
      'mutations: 0',
      10_000,
    )

    console.log('Refetch button scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
