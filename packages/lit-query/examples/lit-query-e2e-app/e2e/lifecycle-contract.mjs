import assert from 'node:assert/strict'
import { baseUrl, waitForText, withBrowserPage } from './lib.mjs'

const missingClientMessage =
  'No QueryClient available. Pass one explicitly or render within QueryClientProvider.'

async function readText(page, selector) {
  return page.locator(selector).innerText()
}

async function moveConsumer(page, target) {
  await page.evaluate((nextTarget) => {
    const root = document.querySelector('lifecycle-contract-root')
    if (!root || typeof root.moveConsumerTo !== 'function') {
      throw new Error('lifecycle-contract-root is not ready.')
    }

    root.moveConsumerTo(nextTarget)
  }, target)
}

async function assertStableInstance(page, expectedInstance) {
  const currentInstance = await readText(
    page,
    '[data-testid="contract-instance-id"]',
  )
  assert.equal(
    currentInstance,
    expectedInstance,
    'expected the same consumer instance to survive reparenting',
  )
}

async function run() {
  await withBrowserPage(async ({ page }) => {
    console.log(
      'Step 1: open the lifecycle contract fixture and verify missing-client resolution',
    )
    await page.goto(`${baseUrl}/lifecycle-contract.html`, {
      waitUntil: 'commit',
      timeout: 20_000,
    })

    await waitForText(
      page,
      '[data-testid="contract-location"]',
      'location: orphan',
    )
    await waitForText(
      page,
      '[data-testid="contract-query-status"]',
      'query: missing-client',
    )
    await waitForText(
      page,
      '[data-testid="contract-error"]',
      missingClientMessage,
    )

    const initialInstance = await readText(
      page,
      '[data-testid="contract-instance-id"]',
    )

    console.log('Step 2: reparent under provider A and verify clean recovery')
    await moveConsumer(page, 'provider-a')
    await waitForText(
      page,
      '[data-testid="contract-location"]',
      'location: provider-a',
    )
    await waitForText(
      page,
      '[data-testid="contract-query-status"]',
      'query: success',
    )
    await waitForText(
      page,
      '[data-testid="contract-provider-value"]',
      'provider: provider-a',
    )
    await waitForText(
      page,
      '[data-testid="contract-payload"]',
      'payload: provider-a cache',
    )
    await assertStableInstance(page, initialInstance)

    console.log(
      'Step 3: move back outside any provider and verify stale context is cleared',
    )
    await moveConsumer(page, 'orphan')
    await waitForText(
      page,
      '[data-testid="contract-location"]',
      'location: orphan',
    )
    await waitForText(
      page,
      '[data-testid="contract-query-status"]',
      'query: missing-client',
    )
    await waitForText(
      page,
      '[data-testid="contract-error"]',
      missingClientMessage,
    )
    await assertStableInstance(page, initialInstance)

    console.log(
      'Step 4: reparent under provider B and verify nearest-provider rebinding',
    )
    await moveConsumer(page, 'provider-b')
    await waitForText(
      page,
      '[data-testid="contract-location"]',
      'location: provider-b',
    )
    await waitForText(
      page,
      '[data-testid="contract-query-status"]',
      'query: success',
    )
    await waitForText(
      page,
      '[data-testid="contract-provider-value"]',
      'provider: provider-b',
    )
    await waitForText(
      page,
      '[data-testid="contract-payload"]',
      'payload: provider-b cache',
    )
    await assertStableInstance(page, initialInstance)

    console.log('Lifecycle contract scenario passed.')
  })
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
