import { afterEach, assert, describe, expect, it, vi } from 'vitest'

interface RequestManifest {
  catalog: Array<string>
  bookmarks: Array<string>
  routeEntries: { catalog: string; bookmarks: string }
}

async function openCatalog(adapter: string, layout: 'routes' | 'scroll') {
  const prefix = '/lazy-routes/' + adapter + '/'
  const response = await fetch(prefix + 'query-requests.json')
  assert(response.ok, 'Missing measured Query requests for ' + adapter)
  const manifest: RequestManifest = await response.json()

  const frame = document.createElement('iframe')
  frame.height = '500'
  frame.width = '640'
  frame.src =
    prefix + 'index.html' + (layout === 'scroll' ? '?layout=scroll' : '')
  document.body.append(frame)
  await expect
    .poll(() => frame.contentDocument?.querySelector('li')?.textContent)
    .toBe('Middlemarch')
  const app = frame.contentDocument
  const view = app?.defaultView
  assert(app && view, 'Missing lazy app')

  const resources = () =>
    view.performance.getEntriesByType('resource').flatMap((entry) => {
      const url = new URL(entry.name)
      return url.pathname.startsWith(prefix)
        ? [{ file: url.pathname.slice(prefix.length), start: entry.startTime }]
        : []
    })
  const queryFiles = () =>
    resources()
      .map(({ file }) => file)
      .filter((file) => /^assets\/query-(catalog|bookmarks)-/.test(file))
      .sort()
  const copiesOf = (file: string) =>
    resources().filter((entry) => entry.file === file).length
  await expect.poll(queryFiles).toEqual([...manifest.catalog].sort())
  await expect.poll(() => copiesOf(manifest.routeEntries.catalog)).toBe(1)
  expect(copiesOf(manifest.routeEntries.bookmarks)).toBe(0)
  await expect.poll(() => copiesOf('books-1.json')).toBe(1)

  const allQueryFiles = [...manifest.catalog, ...manifest.bookmarks].sort()
  async function expectDeferredRequests(start: number) {
    await expect.poll(queryFiles).toEqual(allQueryFiles)
    for (const file of [
      manifest.routeEntries.bookmarks,
      ...manifest.bookmarks,
    ]) {
      await expect.poll(() => copiesOf(file)).toBe(1)
      const resource = resources().find((entry) => entry.file === file)
      assert(resource)
      expect(resource.start).toBeGreaterThanOrEqual(start)
    }
  }
  function expectReusedFiles() {
    expect(queryFiles()).toEqual(allQueryFiles)
    expect(copiesOf(manifest.routeEntries.catalog)).toBe(1)
    expect(copiesOf(manifest.routeEntries.bookmarks)).toBe(1)
  }
  return { app, view, copiesOf, expectDeferredRequests, expectReusedFiles }
}

function click(parent: ParentNode, label: string) {
  const button = [...parent.querySelectorAll('button')].find(
    (item) => item.textContent === label,
  )
  assert(button, 'Missing button ' + label)
  button.click()
}

afterEach(() => {
  document.querySelector('iframe')?.remove()
  localStorage.removeItem('bookmark')
})

describe.each(['react-query', 'react-query-pluggable'])(
  '%s lazy bookmarks',
  (adapter) => {
    it('downloads bookmarks on navigation and reuses its code and cached pages on revisit', async () => {
      const { app, view, copiesOf, expectDeferredRequests, expectReusedFiles } =
        await openCatalog(adapter, 'routes')
      const beforeNavigation = view.performance.now()
      click(app, 'Bookmarks')
      await expect
        .poll(() => app.querySelector('li button')?.textContent)
        .toBe('Bookmark')
      await expectDeferredRequests(beforeNavigation)
      click(app, 'Load more')
      await expect.poll(() => app.querySelectorAll('li').length).toBe(4)
      const villette = [...app.querySelectorAll('li')].find((row) =>
        row.textContent.includes('Villette'),
      )
      assert(villette, 'Missing second page of books')
      click(villette, 'Bookmark')
      await expect
        .poll(() => app.body.textContent)
        .toContain('Bookmarked: Villette')
      await expect.poll(() => copiesOf('books-1.json')).toBe(2)
      await expect.poll(() => copiesOf('books-2.json')).toBe(1)

      const revisitFetch = vi.spyOn(view, 'fetch')
      click(app, 'Catalog')
      await expect
        .poll(() => app.querySelector('li')?.textContent)
        .toBe('Middlemarch')
      click(app, 'Bookmarks')
      await expect.poll(() => app.querySelectorAll('li').length).toBe(4)
      await expect
        .poll(() => app.body.textContent)
        .toContain('Bookmarked: Villette')
      expect(revisitFetch).not.toHaveBeenCalled()
      expectReusedFiles()
    })

    it('downloads the below-fold shelf when scrolled into view and reuses its code on a second scroll', async () => {
      const { app, view, expectDeferredRequests, expectReusedFiles } =
        await openCatalog(adapter, 'scroll')
      const shelf = app.querySelector<HTMLElement>('#bookmarks-shelf')
      assert(shelf, 'Missing bookmarks shelf')
      const top = () => shelf.getBoundingClientRect().top
      expect(top()).toBeGreaterThanOrEqual(view.innerHeight)
      expect(shelf.querySelector('li button')).toBeNull()
      const beforeScroll = view.performance.now()
      shelf.scrollIntoView()
      await expect.poll(top).toBeLessThan(view.innerHeight)
      await expect
        .poll(() => shelf.querySelector('li')?.textContent)
        .toContain('Middlemarch')
      await expectDeferredRequests(beforeScroll)

      view.scrollTo(0, 0)
      await expect.poll(top).toBeGreaterThanOrEqual(view.innerHeight)
      shelf.scrollIntoView()
      await expect.poll(top).toBeLessThan(view.innerHeight)
      expect(shelf.querySelector('li button')?.textContent).toBe('Bookmark')
      expectReusedFiles()
    })
  },
)
