import assert from 'node:assert/strict'
import {
  baseUrl,
  waitForNthText,
  waitForText,
  withBrowserPage,
} from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log('Step 1: open page and reset baseline state')
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 20_000 })
    await waitForText(page, '[data-testid="query-status"]', 'success')
    await page.click('[data-testid="reset-demo-state"]')
    await waitForText(page, '[data-testid="query-status"]', 'success')

    console.log('Step 2: create a project and verify page 1 refreshes')
    await page.fill('[data-testid="project-name-input"]', 'Release Console')
    await page.fill('[data-testid="project-owner-input"]', 'Platform Ops')
    await page.click('[data-testid="create-project"]')
    await waitForText(
      page,
      '[data-testid="create-mutation-status"]',
      'success',
      10_000,
    )
    await waitForText(page, '[data-testid="query-status"]', 'success', 10_000)
    await waitForNthText(
      page,
      '[data-testid="project-name"]',
      0,
      'Release Console',
      10_000,
    )
    await waitForText(
      page,
      '[data-testid="total-mutation-count"]',
      'total-mutations: 1',
      10_000,
    )

    console.log(
      'Step 3: favorite the new project and verify optimistic state sticks',
    )
    await page.locator('[data-testid="toggle-favorite"]').first().click()
    await waitForText(
      page,
      '[data-testid="favorite-mutation-status"]',
      'success',
      10_000,
    )
    await waitForNthText(
      page,
      '[data-testid="project-favorite-state"]',
      0,
      'favorite',
      10_000,
    )
    await waitForText(
      page,
      '[data-testid="total-mutation-count"]',
      'total-mutations: 2',
      10_000,
    )

    console.log('Step 4: force the next mutation to fail and verify rollback')
    await page.click('[data-testid="arm-mutation-error"]')
    await waitForText(
      page,
      '[data-testid="mutation-control-status"]',
      'armed',
      10_000,
    )
    await page.locator('[data-testid="toggle-favorite"]').first().click()
    await waitForText(
      page,
      '[data-testid="favorite-mutation-status"]',
      'error',
      10_000,
    )
    await waitForText(
      page,
      '[data-testid="favorite-mutation-error"]',
      'Forced mutation failure',
      10_000,
    )
    await waitForNthText(
      page,
      '[data-testid="project-favorite-state"]',
      0,
      'favorite',
      10_000,
    )

    console.log('Step 5: retry the same mutation successfully')
    await page.locator('[data-testid="toggle-favorite"]').first().click()
    await waitForText(
      page,
      '[data-testid="favorite-mutation-status"]',
      'success',
      10_000,
    )
    await waitForNthText(
      page,
      '[data-testid="project-favorite-state"]',
      0,
      'standard',
      10_000,
    )

    const firstProject = await page
      .locator('[data-testid="project-name"]')
      .first()
      .innerText()
    assert.match(
      firstProject,
      /Release Console/,
      'created project should remain at the top',
    )

    console.log('Mutation scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
