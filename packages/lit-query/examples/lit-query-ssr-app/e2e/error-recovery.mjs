import assert from 'node:assert/strict'
import {
  armNextDataError,
  baseUrl,
  getRequestCount,
  resetTestState,
  waitForText,
  withBrowserPage,
} from './lib.mjs'

async function run() {
  await withBrowserPage(
    async ({ page }) => {
      console.log('Step 3: force the next SSR prefetch to fail')
      await resetTestState()
      await armNextDataError()

      const failedSsrResponse = await fetch(baseUrl)
      assert.equal(failedSsrResponse.status, 500)
      assert.match(await failedSsrResponse.text(), /SSR render failed\./)
      assert.equal(await getRequestCount(), 0)

      console.log(
        'Step 4: open the SSR page and verify the happy-path baseline',
      )
      await resetTestState()
      await page.goto(baseUrl, {
        timeout: 20_000,
        waitUntil: 'networkidle',
      })

      await waitForText(page, '[data-testid="message"]', 'Hello from SSR!')
      await waitForText(
        page,
        '[data-testid="request-count"]',
        'Request count: 1',
      )
      assert.equal(await getRequestCount(), 1)

      console.log('Step 5: force the next client refetch to fail')
      await armNextDataError()
      await page.click('[data-testid="refetch-button"]')
      await waitForText(page, '[data-testid="status"]', 'Error', 10_000)
      await waitForText(
        page,
        '[data-testid="error-message"]',
        'Forced data failure',
        10_000,
      )
      assert.equal(await getRequestCount(), 1)

      console.log(
        'Step 6: reset the server and verify the app recovers on reload',
      )
      await resetTestState()
      await page.reload({
        timeout: 20_000,
        waitUntil: 'networkidle',
      })
      await waitForText(page, '[data-testid="message"]', 'Hello from SSR!')
      await waitForText(
        page,
        '[data-testid="request-count"]',
        'Request count: 1',
      )
      assert.equal(await getRequestCount(), 1)

      console.log('SSR error scenario passed.')
    },
    {
      assertNoConsoleIssues: false,
    },
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
