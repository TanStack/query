import { baseUrl, waitForText, withBrowserPage } from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and ensure baseline success')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')

    console.log('Step 2: force server error and verify UI')
    await page.check('[data-testid="force-error-toggle"]')
    await page.click('[data-testid="refetch"]')
    await waitForText(page, '[data-testid="query-status"]', 'error', 10_000)
    await waitForText(
      page,
      '[data-testid="query-error"]',
      'Forced server error',
      10_000,
    )

    console.log('Step 3: disable error mode and verify recovery')
    await page.uncheck('[data-testid="force-error-toggle"]')
    await page.click('[data-testid="refetch"]')
    await waitForText(page, '[data-testid="query-status"]', 'success', 10_000)

    console.log('Error recovery scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
