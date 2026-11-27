import { afterEach, describe, expect, it } from 'vitest'

const adapters = [
  'react-query',
  'react-query-no-core',
  'react-query-no-core-pluggable',
]

async function openApp(scenario, adapter) {
  const frame = document.createElement('iframe')
  frame.title = adapter
  frame.src = `/${scenario}/${adapter}/index.html`
  document.body.append(frame)
  await expect
    .poll(() => frame.contentDocument?.querySelector('li')?.textContent)
    .toContain('Middlemarch')
  return frame.contentDocument
}

afterEach(() => {
  document.querySelector('iframe')?.remove()
  localStorage.removeItem('bookmark')
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

  it('periodically refetches regular, infinite and suspense queries', async () => {
    const app = await openApp('polling', adapter)
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
