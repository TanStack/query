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
    `Timed out waiting for request count to increase above ${baseline} after reconnect.`,
  )
}

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and reset demo state')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await page.click('[data-testid="reset-demo-state"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')

    const before = await readNumberFromTail(
      page,
      '[data-testid="request-count"]',
    )

    console.log('Step 2: remove and re-add the same demo element')
    await page.evaluate(() => {
      const provider = document.querySelector('demo-query-provider')
      if (!provider) {
        throw new Error('demo-query-provider not found')
      }

      const demoElement = provider.querySelector('tanstack-lit-query-demo')
      if (!demoElement) {
        throw new Error('tanstack-lit-query-demo not found')
      }

      provider.removeChild(demoElement)
      provider.appendChild(demoElement)
    })

    await waitForText(page, '[data-testid="query-status"]', 'success', 10_000)

    const after = await waitForRequestCountIncrease(page, before, 10_000)
    assert.ok(
      after > before,
      'reconnected element should trigger query lifecycle refresh',
    )

    await waitForText(
      page,
      '[data-testid="active-fetches"]',
      'fetches: 0',
      10_000,
    )

    console.log('Lifecycle reconnect scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
