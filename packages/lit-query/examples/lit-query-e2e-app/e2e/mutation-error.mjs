import assert from 'node:assert/strict'
import { baseUrl, waitForText, withBrowserPage } from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and reset demo state')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await page.click('[data-testid="reset-demo-state"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')

    const initialItems = await page
      .locator('[data-testid="todo-item"]')
      .allTextContents()
    assert.equal(initialItems.length, 2, 'baseline should contain two todos')

    console.log('Step 2: force next mutation failure and assert error')
    await page.fill(
      '[data-testid="new-todo-input"]',
      'Mutation should fail once',
    )
    await page.click('[data-testid="fail-next-mutation"]')
    await page.click('[data-testid="add-todo"]')
    await waitForText(page, '[data-testid="mutation-status"]', 'error', 10_000)
    await waitForText(
      page,
      '[data-testid="mutation-error"]',
      'Forced mutation failure',
      10_000,
    )

    let currentItems = await page
      .locator('[data-testid="todo-item"]')
      .allTextContents()
    assert.equal(
      currentItems.length,
      2,
      'failed mutation must not append todo to cache',
    )

    console.log('Step 3: submit again and assert recovery')
    await page.fill('[data-testid="new-todo-input"]', 'Mutation recovers')
    await page.click('[data-testid="add-todo"]')
    await waitForText(
      page,
      '[data-testid="mutation-status"]',
      'success',
      10_000,
    )

    currentItems = await page
      .locator('[data-testid="todo-item"]')
      .allTextContents()
    assert.equal(
      currentItems.length,
      3,
      'successful retry should append exactly one todo',
    )

    console.log('Mutation error scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
