import assert from 'node:assert/strict'
import {
  getRequestCount,
  resetTestState,
  waitForText,
  withBrowserPage,
} from './lib.mjs'

async function run() {
  await withBrowserPage(async ({ page, baseUrl }) => {
    console.log('Step 3: fetch the SSR HTML and verify it is pre-rendered')
    await resetTestState()
    const ssrResponse = await fetch(baseUrl)
    assert.equal(ssrResponse.status, 200)
    const controllerCreationHeader = ssrResponse.headers.get(
      'x-ssr-query-controller-created',
    )
    assert.ok(
      controllerCreationHeader &&
        Number.parseInt(controllerCreationHeader, 10) >= 1,
      'Expected SSR response to confirm createQueryController ran during render.',
    )
    const ssrHtml = await ssrResponse.text()

    assert.match(ssrHtml, /Hello from SSR!/)
    assert.doesNotMatch(ssrHtml, /Loading\.\.\./)

    const dehydratedStateMatch = ssrHtml.match(
      /<script id="__QUERY_STATE__" type="application\/json">([\s\S]*?)<\/script>/,
    )
    assert.ok(
      dehydratedStateMatch?.[1],
      'Expected dehydrated state to be embedded in __QUERY_STATE__.',
    )

    const dehydratedState = JSON.parse(dehydratedStateMatch[1].trim())
    assert.ok(
      Array.isArray(dehydratedState.queries) &&
        dehydratedState.queries.length > 0,
      'Expected dehydrated state to contain at least one query.',
    )
    assert.equal(await getRequestCount(), 1)

    console.log('Step 4: open the page in Chromium and verify hydration')
    await resetTestState()

    await page.goto(baseUrl, {
      timeout: 20_000,
      waitUntil: 'networkidle',
    })

    await waitForText(page, '[data-testid="message"]', 'Hello from SSR!')
    await waitForText(page, '[data-testid="request-count"]', 'Request count: 1')

    await new Promise((resolve) => setTimeout(resolve, 1_000))
    assert.equal(await getRequestCount(), 1)

    console.log('Step 5: trigger a manual refetch')
    await page.click('[data-testid="refetch-button"]')
    await waitForText(page, '[data-testid="request-count"]', 'Request count: 2')
    await new Promise((resolve) => setTimeout(resolve, 500))
    assert.equal(await getRequestCount(), 2)

    console.log('SSR smoke test passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
