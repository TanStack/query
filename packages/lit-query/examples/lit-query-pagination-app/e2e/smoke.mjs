import assert from 'node:assert/strict'
import { baseUrl, waitForText, withBrowserPage } from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open pagination demo')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })

    console.log('Step 2: verify initial load')
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await waitForText(page, '[data-testid="current-page"]', 'page: 1')
    await waitForText(page, '[data-testid="response-page"]', 'response-page: 1')
    await waitForText(page, '[data-testid="has-more"]', 'has-more: yes')

    const initialItems = await page
      .locator('[data-testid="project-name"]')
      .allTextContents()
    assert.equal(
      initialItems.length,
      10,
      'page 1 should render ten project items',
    )
    assert.match(initialItems[0] ?? '', /^1: Project 1 /)

    console.log('Step 3: verify placeholder behavior during page transition')
    await page.fill('[data-testid="delay-input"]', '700')
    await page.click('[data-testid="next-page"]')
    await waitForText(
      page,
      '[data-testid="is-placeholder"]',
      'isPlaceholderData: yes',
      10_000,
    )
    await waitForText(
      page,
      '[data-testid="response-page"]',
      'response-page: 2',
      10_000,
    )
    await waitForText(
      page,
      '[data-testid="is-placeholder"]',
      'isPlaceholderData: no',
      10_000,
    )

    const nextItems = await page
      .locator('[data-testid="project-name"]')
      .allTextContents()
    assert.equal(nextItems.length, 10, 'page 2 should render ten project items')
    assert.match(nextItems[0] ?? '', /^11: Project 11 /)

    console.log('Smoke scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
