import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => document.querySelector('iframe')?.remove())

describe.each(['react-query', 'react-query-pluggable'])(
  '%s microfrontends',
  (adapter) => {
    it.each(['independent', 'shared'])(
      'loads each Query URL once with %s chunks',
      async (deployment) => {
        const prefix = '/microfrontends/' + adapter + '/' + deployment + '/'
        const frame = document.createElement('iframe')
        frame.src = prefix + 'index.html'
        document.body.append(frame)
        const list = () =>
          frame.contentDocument?.querySelector('li')?.textContent
        const queryUrls = () =>
          frame.contentWindow.performance
            .getEntriesByType('resource')
            .map((resource) => new URL(resource.name).pathname)
            .filter((pathname) => pathname.endsWith('/query-runtime.js'))
        await expect.poll(list).toBe('Middlemarch')
        const expected = [
          prefix +
            (deployment === 'shared' ? '' : 'query/') +
            'query-runtime.js',
        ]
        expect(queryUrls()).toEqual(expected)
        frame.contentDocument.querySelector('#bookmarks').click()
        await expect.poll(list).toContain('Bookmark')
        if (deployment === 'independent')
          expected.push(prefix + 'paginated/query-runtime.js')
        expect(queryUrls()).toEqual(expected)
        frame.contentDocument.querySelector('#catalog').click()
        await expect.poll(list).toBe('Middlemarch')
        expect(queryUrls()).toEqual(expected)
      },
    )
  },
)
