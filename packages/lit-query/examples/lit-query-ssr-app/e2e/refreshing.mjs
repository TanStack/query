import assert from 'node:assert/strict'
import {
  armNextDataDelay,
  baseUrl,
  getRequestCount,
  resetTestState,
  waitForDisabledState,
  waitForText,
  withBrowserPage,
} from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 3: open the SSR page and verify the hydrated baseline')
    await resetTestState()
    await page.goto(baseUrl, {
      timeout: 20_000,
      waitUntil: 'networkidle',
    })

    await waitForText(page, '[data-testid="status"]', 'Ready')
    await waitForText(page, '[data-testid="request-count"]', 'Request count: 1')
    assert.equal(await getRequestCount(), 1)

    console.log('Step 4: delay the next fetch and assert the refreshing state')
    await armNextDataDelay(1_500)
    await page.click('[data-testid="refetch-button"]')

    await waitForText(page, '[data-testid="status"]', 'Refreshing', 10_000)
    await waitForDisabledState(
      page,
      '[data-testid="refetch-button"]',
      true,
      10_000,
    )

    console.log('Step 5: wait for the delayed refetch to settle')
    await waitForText(page, '[data-testid="status"]', 'Ready', 10_000)
    await waitForText(page, '[data-testid="request-count"]', 'Request count: 2')
    await waitForDisabledState(
      page,
      '[data-testid="refetch-button"]',
      false,
      10_000,
    )
    assert.equal(await getRequestCount(), 2)

    console.log('SSR refreshing scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
