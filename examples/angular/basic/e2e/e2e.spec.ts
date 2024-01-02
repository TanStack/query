import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173')
})

test('basic dev works', async ({ page }) => {
  const title = page.locator('h1')
  expect(await title.innerText()).toContain('Posts')
})

test('first link should show "loading" indicator first time, but not subsequent times', async ({
  page,
}) => {
  // re-used functions for some common steps
  const clickFirstLinkToGetToDetailPage = async () => {
    const firstLink = page.locator('a', {
      hasText:
        'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
    })
    await firstLink.click()
    const disclaimer = page.locator('p', {
      hasText:
        'As you visit the posts below, you will notice them in a loading state the first time you load them.',
    })
    expect(await disclaimer.count()).toBe(1)
  }
  const assertDetailPageContents = async () => {
    const firstLinkTitle = page.locator('post div h1')
    expect(await firstLinkTitle.innerText()).toContain(
      'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
    )
    const firstLinkBody = page.locator('post div p')
    expect(await firstLinkBody.innerText()).toContain(
      'quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto',
    )
  }

  // loading indicator should be present on first detail load
  await clickFirstLinkToGetToDetailPage()
  const loadingIndicator = page.locator('post div', { hasText: 'Loading...' })
  expect(await loadingIndicator.count()).toBe(1)
  await assertDetailPageContents()

  // back to main page (without browser reload!)
  const backLink = page.locator('a', { hasText: 'Back' })
  await backLink.click()
  const title = page.locator('h1')
  expect(await title.innerText()).toContain('Posts')

  // loading indicator should not be present on second detail load
  await clickFirstLinkToGetToDetailPage()
  expect(await loadingIndicator.count()).toBe(0)
  await assertDetailPageContents()
})
