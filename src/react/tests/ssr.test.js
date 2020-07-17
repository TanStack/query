/**
 * @jest-environment node
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  usePaginatedQuery,
  ReactQueryCacheProvider,
  queryCache,
  makeQueryCache,
  useQuery,
} from '../index'
import { sleep } from './utils'

describe('Server Side Rendering', () => {
  // A frozen cache does not cache any data. This is the default
  // for the global cache in a node-environment, since it's
  // otherwise easy to cache data between separate requests,
  // which is a security risk.
  //
  // See https://github.com/tannerlinsley/react-query/issues/70
  it('global cache should be frozen by default', async () => {
    const fetchFn = () => Promise.resolve('data')
    const data = await queryCache.prefetchQuery('key', fetchFn)

    expect(data).toBe('data')
    expect(queryCache.getQuery('key')).toBeFalsy()

    queryCache.clear({ notify: false })
  })

  // When consumers of the library create a cache explicitly by
  // calling makeQueryCache, they take on the responsibility of
  // not using that cache to cache data between requests or do so
  // in a safe way.
  it('created caches should be unfrozen by default', async () => {
    const queryCache = makeQueryCache()
    const fetchFn = () => Promise.resolve('data')
    const data = await queryCache.prefetchQuery('key', fetchFn)

    expect(data).toBe('data')
    expect(queryCache.getQuery('key')).toBeTruthy()
  })

  describe('frozen cache', () => {
    it('should not trigger fetch', () => {
      const queryCache = makeQueryCache({ frozen: true })
      const queryFn = jest.fn()

      function Page() {
        const query = useQuery('test', queryFn)

        const content = `status ${query.status}`

        return (
          <div>
            <div>{content}</div>
          </div>
        )
      }

      const markup = renderToString(
        <ReactQueryCacheProvider queryCache={queryCache}>
          <Page />
        </ReactQueryCacheProvider>
      )

      expect(markup).toContain('status loading')
      expect(queryFn).toHaveBeenCalledTimes(0)
    })

    it('should not add initialData to the cache', () => {
      const queryCache = makeQueryCache({ frozen: true })

      function Page() {
        const [page, setPage] = React.useState(1)
        const { resolvedData } = usePaginatedQuery(
          ['data', page],
          async (queryName, page) => {
            return page
          },
          { initialData: '1' }
        )

        return (
          <ReactQueryCacheProvider queryCache={queryCache}>
            <h1 data-testid="title">{resolvedData}</h1>
            <button onClick={() => setPage(page + 1)}>next</button>
          </ReactQueryCacheProvider>
        )
      }

      renderToString(<Page />)

      expect(queryCache.queries).toEqual({})
    })

    it('should not add prefetched data to the cache', async () => {
      const queryCache = makeQueryCache({ frozen: true })
      const fetchFn = () => Promise.resolve('data')
      const data = await queryCache.prefetchQuery('key', fetchFn)

      expect(data).toBe('data')
      expect(queryCache.getQuery('key')).toBeFalsy()
    })
  })

  describe('unfrozen cache', () => {
    it('should not trigger fetch', () => {
      const queryCache = makeQueryCache({ frozen: false })
      const queryFn = jest.fn()

      function Page() {
        const query = useQuery('test', queryFn)

        const content = `status ${query.status}`

        return (
          <div>
            <div>{content}</div>
          </div>
        )
      }

      const markup = renderToString(
        <ReactQueryCacheProvider queryCache={queryCache}>
          <Page />
        </ReactQueryCacheProvider>
      )

      expect(markup).toContain('status loading')
      expect(queryFn).toHaveBeenCalledTimes(0)
    })

    it('should add prefetched data to cache', async () => {
      const queryCache = makeQueryCache({ frozen: false })
      const fetchFn = () => Promise.resolve('data')
      const data = await queryCache.prefetchQuery('key', fetchFn)

      expect(data).toBe('data')
      expect(queryCache.getQuery('key').state.data).toBe('data')
    })

    it('should return existing data from the cache', async () => {
      const queryCache = makeQueryCache({ frozen: false })
      const queryFn = jest.fn(() => sleep(10))

      function Page() {
        const query = useQuery('test', queryFn)

        const content = `status ${query.status}`

        return (
          <div>
            <div>{content}</div>
          </div>
        )
      }

      await queryCache.prefetchQuery('test', queryFn)

      const markup = renderToString(
        <ReactQueryCacheProvider queryCache={queryCache}>
          <Page />
        </ReactQueryCacheProvider>
      )

      expect(markup).toContain('status success')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should add initialData to the cache', () => {
      const queryCache = makeQueryCache({ frozen: false })
      function Page() {
        const [page, setPage] = React.useState(1)
        const { resolvedData } = usePaginatedQuery(
          ['data', page],
          async (queryName, page) => {
            return page
          },
          { initialData: '1' }
        )

        return (
          <div>
            <h1 data-testid="title">{resolvedData}</h1>
            <button onClick={() => setPage(page + 1)}>next</button>
          </div>
        )
      }

      renderToString(
        <ReactQueryCacheProvider queryCache={queryCache}>
          <Page />
        </ReactQueryCacheProvider>
      )

      expect(Object.keys(queryCache.queries)).toEqual(['["data",1]'])
    })

    it('should not call setTimeout', async () => {
      jest.spyOn(global, 'setTimeout')

      const queryCache = makeQueryCache({ frozen: false })
      const queryFn = jest.fn(() => Promise.resolve())

      function Page() {
        const query = useQuery('test', queryFn)

        const content = `status ${query.status}`

        return (
          <div>
            <div>{content}</div>
          </div>
        )
      }

      await queryCache.prefetchQuery('test', queryFn)

      const markup = renderToString(
        <ReactQueryCacheProvider queryCache={queryCache}>
          <Page />
        </ReactQueryCacheProvider>
      )

      expect(markup).toContain('status success')
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(global.setTimeout).toHaveBeenCalledTimes(0)

      global.setTimeout.mockRestore()
    })
  })
})
