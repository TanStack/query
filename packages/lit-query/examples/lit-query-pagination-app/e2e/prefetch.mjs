import assert from 'node:assert/strict'
import { waitForText, withBrowserPage, baseUrl } from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and reset state')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await page.click('[data-testid="reset-demo-state"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')

    console.log('Step 2: prefetch next page explicitly')
    await page.click('[data-testid="prefetch-next"]')
    await waitForText(
      page,
      '[data-testid="prefetch-status"]',
      'ready:2',
      10_000,
    )

    console.log('Step 3: navigate to next page after prefetch')
    await page.click('[data-testid="next-page"]')
    await waitForText(
      page,
      '[data-testid="response-page"]',
      'response-page: 2',
      10_000,
    )
    await waitForText(page, '[data-testid="query-status"]', 'success', 10_000)
    const projectItems = await page
      .locator('[data-testid="project-name"]')
      .allTextContents()
    assert.ok(
      (projectItems[0] ?? '').startsWith('11: Project 11'),
      'page 2 should render project 11 as first list item',
    )

    console.log('Prefetch scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
