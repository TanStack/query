import assert from 'node:assert/strict'
import { baseUrl, waitForText, withBrowserPage } from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })

    console.log('Step 2: wait for initial query success')
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await waitForText(page, '[data-testid="request-count"]', '1')
    await waitForText(page, '[data-testid="data-source"]', 'server')

    let todoItems = await page
      .locator('[data-testid="todo-item"]')
      .allTextContents()
    assert.equal(
      todoItems.length,
      2,
      'initial server query should return two todos',
    )

    console.log('Step 3: run mutation and assert cache update')
    await page.fill(
      '[data-testid="new-todo-input"]',
      'Validate mutation wiring',
    )
    await page.click('[data-testid="add-todo"]')
    await waitForText(page, '[data-testid="mutation-status"]', 'success')
    await waitForText(page, '[data-testid="data-source"]', 'cache')

    todoItems = await page
      .locator('[data-testid="todo-item"]')
      .allTextContents()
    assert.equal(
      todoItems.length,
      3,
      'mutation onSuccess should append a todo in cache',
    )

    console.log('Step 4: invalidate and assert refetch from server')
    await page.click('[data-testid="invalidate"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await waitForText(page, '[data-testid="request-count"]', '2')
    await waitForText(page, '[data-testid="data-source"]', 'server')

    console.log('Step 5: direct cache write')
    await page.click('[data-testid="seed-cache"]')
    await waitForText(page, '[data-testid="data-source"]', 'cache')

    todoItems = await page
      .locator('[data-testid="todo-item"]')
      .allTextContents()
    assert.equal(
      todoItems.length,
      4,
      'direct setQueryData should update list in UI',
    )

    const fetches = await page
      .locator('[data-testid="active-fetches"]')
      .innerText()
    const mutations = await page
      .locator('[data-testid="active-mutations"]')
      .innerText()
    assert.match(
      fetches,
      /fetches: 0$/,
      'fetching count should settle back to zero',
    )
    assert.match(
      mutations,
      /mutations: 0$/,
      'mutating count should settle back to zero',
    )

    console.log('Step 6: verify basic-query standalone page')
    await page.goto(`${baseUrl}/basic-query.html`, {
      waitUntil: 'commit',
      timeout: 20_000,
    })
    await waitForText(page, '[data-testid="basic-query-status"]', 'success')
    const basicItems = await page
      .locator('[data-testid="basic-todo-item"]')
      .allTextContents()
    assert.equal(
      basicItems.length,
      2,
      'basic query page should render initial todos',
    )

    console.log('Step 7: verify mutation standalone page')
    await page.goto(`${baseUrl}/mutation.html`, {
      waitUntil: 'commit',
      timeout: 20_000,
    })
    await waitForText(page, '[data-testid="mutation-query-status"]', 'success')
    await page.fill('[data-testid="mutation-input"]', 'Mutation page todo')
    await page.click('[data-testid="mutation-add"]')
    await waitForText(
      page,
      '[data-testid="mutation-mutation-status"]',
      'success',
    )
    const mutationItems = await page
      .locator('[data-testid="mutation-todo-item"]')
      .allTextContents()
    assert.equal(
      mutationItems.length,
      3,
      'mutation page should append a new todo',
    )

    console.log('E2E smoke test passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
