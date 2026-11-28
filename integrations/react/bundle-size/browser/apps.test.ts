import { afterEach, assert, describe, expect, it } from 'vitest'
import { commands } from 'vitest/browser'

const adapters = ['v6', 'treeshakable'] as const
type Adapter = (typeof adapters)[number]
type Scenario = 'query' | 'paginated' | 'options' | 'polling'

function mountApp(scenario: Scenario, adapter: Adapter) {
  const frame = document.createElement('iframe')
  frame.title = adapter
  frame.src = `/${scenario}/${adapter}/index.html`
  document.body.append(frame)
  return frame
}

async function openApp(scenario: Scenario, adapter: Adapter) {
  const frame = mountApp(scenario, adapter)
  await expect
    .poll(() => frame.contentDocument?.querySelector('li')?.textContent)
    .toContain('Middlemarch')
  const app = frame.contentDocument
  assert(app, 'Missing document for ' + frame.src)
  return app
}

afterEach(() => {
  document.querySelector('iframe')?.remove()
  localStorage.removeItem('bookmark')
  localStorage.removeItem('bookmarks')
})

describe.each(adapters)('React Query %s', (adapter) => {
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
    assert(more, 'Missing Load more button')
    more.click()
    await expect.poll(() => app.querySelectorAll('li').length).toBe(4)
    const third = app.querySelectorAll('li')[2]
    assert(third, 'Missing third book')
    expect(third.textContent).toContain('Villette')
    const bookmark = third.querySelector('button')
    assert(bookmark, 'Missing bookmark button')
    bookmark.click()
    await expect
      .poll(() => app.body.textContent)
      .toContain('Bookmarked: Villette')
    expect(localStorage.getItem('bookmark')).toBe('Villette')
  })

  it('retains the previous selection, queues bookmarks and refreshes the cache', async () => {
    const app = await openApp('options', adapter)
    const view = app.defaultView
    assert(view, 'Missing app window')
    const originalFetch = view.fetch.bind(view)
    const gate = Promise.withResolvers<void>()
    view.fetch = async (...args) => {
      if (String(args[0]).endsWith('books-2.json')) await gate.promise
      return originalFetch(...args)
    }
    const button = (label: string) => {
      const element = Array.from(app.querySelectorAll('button')).find(
        (item) => item.textContent === label,
      )
      assert(element, 'Missing button: ' + label)
      return element
    }
    try {
      button('Next page').click()
      await expect
        .poll(() => app.querySelector('[role="status"]')?.textContent)
        .toBe('Showing the previous page')
      expect(app.querySelector('ul')?.textContent).toContain('Middlemarch')
    } finally {
      gate.resolve()
      view.fetch = originalFetch
    }
    await expect
      .poll(() => app.querySelector('ul')?.textContent)
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
            frame.contentDocument?.querySelectorAll('[role="status"]') ?? [],
            (element) => element.textContent,
          ),
        )
        .toEqual(['Loading suspense query…', 'Loading suspense pages…'])
    } finally {
      await commands.releasePollingBooks(adapter)
    }
    const app = frame.contentDocument
    assert(app, 'Missing polling app')
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
              current.every((value, index) => {
                const lastUpdate = previous[index]
                return lastUpdate !== undefined && value > lastUpdate
              })
            )
          },
          { timeout: 4000 },
        )
        .toBe(true)
    }
  })
})
