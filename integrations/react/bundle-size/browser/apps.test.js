import { afterEach, describe, expect, it } from 'vitest'
import { commands } from 'vitest/browser'

const adapters = ['react-query', 'react-query-pluggable']

function mountApp(scenario, adapter) {
  const frame = document.createElement('iframe')
  frame.title = adapter
  frame.src = `/${scenario}/${adapter}/index.html`
  document.body.append(frame)
  return frame
}

async function openApp(scenario, adapter) {
  const frame = mountApp(scenario, adapter)
  await expect
    .poll(() => frame.contentDocument?.querySelector('li')?.textContent)
    .toContain('Middlemarch')
  return frame.contentDocument
}

afterEach(() => {
  document.querySelector('iframe')?.remove()
  localStorage.removeItem('bookmark')
  localStorage.removeItem('bookmarks')
})

describe.each(adapters)('@tanstack/%s', (adapter) => {
  it('renders a fetched reading list', async () => {
    const app = await openApp('query', adapter)
    expect(
      Array.from(app.querySelectorAll('li'), (row) => row.textContent),
    ).toEqual(['Middlemarch', 'Persuasion'])
  })

  it('loads the next page and saves a bookmark', async () => {
    const app = await openApp('paginated', adapter)
    const more = Array.from(app.querySelectorAll('button')).find(
      (button) => button.textContent === 'Load more',
    )
    more.click()
    await expect.poll(() => app.querySelectorAll('li').length).toBe(4)
    const third = app.querySelectorAll('li')[2]
    expect(third.textContent).toContain('Villette')
    third.querySelector('button').click()
    await expect
      .poll(() => app.body.textContent)
      .toContain('Bookmarked: Villette')
    expect(localStorage.getItem('bookmark')).toBe('Villette')
  })

  it('retains the previous selection, queues bookmarks and refreshes the cache', async () => {
    const app = await openApp('options', adapter)
    const view = app.defaultView
    const originalFetch = view.fetch.bind(view)
    const gate = Promise.withResolvers()
    view.fetch = async (...args) => {
      if (String(args[0]).endsWith('books-2.json')) await gate.promise
      return originalFetch(...args)
    }
    const button = (label) =>
      Array.from(app.querySelectorAll('button')).find(
        (item) => item.textContent === label,
      )
    try {
      button('Next page').click()
      await expect
        .poll(() => app.querySelector('[role="status"]')?.textContent)
        .toBe('Showing the previous page')
      expect(app.querySelector('ul').textContent).toContain('Middlemarch')
    } finally {
      gate.resolve()
      view.fetch = originalFetch
    }
    await expect
      .poll(() => app.querySelector('ul').textContent)
      .toContain('Villette')
    button('Bookmark this page').click()
    await expect
      .poll(() => app.body.textContent)
      .toContain('Bookmarks: Villette, North and South')
    expect(
      Array.from(app.querySelectorAll('ol li'), (item) => item.textContent),
    ).toEqual([
      'Saving Villette',
      'Saved Villette',
      'Saving North and South',
      'Saved North and South',
    ])
  })

  it('periodically refetches regular, infinite and suspense queries', async () => {
    await commands.holdPollingBooks(adapter)
    const frame = mountApp('polling', adapter)
    try {
      await commands.waitForPollingRequest(adapter)
      await expect
        .poll(() =>
          Array.from(
            frame.contentDocument.querySelectorAll('[role="status"]'),
            (element) => element.textContent,
          ),
        )
        .toEqual(['Loading suspense query…', 'Loading suspense pages…'])
    } finally {
      await commands.releasePollingBooks(adapter)
    }
    const app = frame.contentDocument
    await expect
      .poll(() =>
        Array.from(app.querySelectorAll('li'), (item) =>
          item.textContent.includes('Middlemarch'),
        ),
      )
      .toEqual([true, true, true, true])
    const timestamps = () =>
      Array.from(app.querySelectorAll('time'), (time) => time.dateTime)
    await expect.poll(() => timestamps().length).toBe(4)
    // Two successive refreshes for every hook distinguish interval polling from a mount refetch.
    for (let refresh = 0; refresh < 2; refresh++) {
      const previous = timestamps()
      await expect
        .poll(
          () => {
            const current = timestamps()
            return (
              current.length === 4 &&
              current.every((value, index) => value > previous[index])
            )
          },
          { timeout: 4000 },
        )
        .toBe(true)
    }
  })
})
