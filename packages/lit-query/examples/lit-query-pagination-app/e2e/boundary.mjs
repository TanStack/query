import assert from 'node:assert/strict'
import { baseUrl, waitForText, withBrowserPage } from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and ensure baseline')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')

    console.log('Step 2: walk to final page')
    for (let expectedPage = 2; expectedPage <= 5; expectedPage += 1) {
      await page.click('[data-testid="next-page"]')
      await waitForText(
        page,
        '[data-testid="response-page"]',
        `response-page: ${expectedPage}`,
        10_000,
      )
    }

    await waitForText(page, '[data-testid="has-more"]', 'has-more: no', 10_000)
    const nextDisabled = await page.isDisabled('[data-testid="next-page"]')
    assert.equal(nextDisabled, true, 'next button should disable on final page')

    console.log('Step 3: navigate back one page')
    await page.click('[data-testid="previous-page"]')
    await waitForText(
      page,
      '[data-testid="response-page"]',
      'response-page: 4',
      10_000,
    )

    const previousDisabled = await page.isDisabled(
      '[data-testid="previous-page"]',
    )
    assert.equal(
      previousDisabled,
      false,
      'previous should remain enabled above page 1',
    )

    console.log('Boundary scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
