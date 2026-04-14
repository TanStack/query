import assert from 'node:assert/strict'
import {
  baseUrl,
  readNumberFromTail,
  waitForText,
  withBrowserPage,
} from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and reset demo state')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await page.click('[data-testid="reset-demo-state"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await waitForText(page, '[data-testid="request-count"]', '1')

    console.log('Step 2: force next fetch failure and assert error state')
    await page.click('[data-testid="fail-next-fetch"]')
    await page.click('[data-testid="refetch"]')
    await waitForText(page, '[data-testid="query-status"]', 'error', 10_000)
    await waitForText(
      page,
      '[data-testid="query-error"]',
      'Forced fetch failure',
      10_000,
    )

    const failedCount = await readNumberFromTail(
      page,
      '[data-testid="request-count"]',
    )
    assert.equal(
      failedCount,
      1,
      'failed fetch should not increment server request count',
    )

    console.log('Step 3: refetch again and assert recovery')
    await page.click('[data-testid="refetch"]')
    await waitForText(page, '[data-testid="query-status"]', 'success', 10_000)

    const recoveredCount = await readNumberFromTail(
      page,
      '[data-testid="request-count"]',
    )
    assert.equal(
      recoveredCount,
      2,
      'successful recovery refetch should increment count',
    )

    console.log('Query error scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
