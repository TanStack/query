/**
 * @jest-environment node
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  usePaginatedQuery,
  ReactQueryCacheProvider,
  makeQueryCache,
  makeServerQueryCache,
  useQuery,
} from '../index'
import { sleep } from './utils'

describe('Server Side Rendering', () => {
  describe('default cache', () => {
    it('should not trigger fetch', () => {
      const queryCache = makeQueryCache()
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

    // See https://github.com/tannerlinsley/react-query/issues/70
    it('should not add initialData to the cache', () => {
      const queryCache = makeQueryCache()
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

      expect(queryCache.queries).toEqual({})
    })

    it('should not add prefetched data to the cache', async () => {
      const queryCache = makeQueryCache()
      const fetchFn = () => Promise.resolve('data')
      const data = await queryCache.prefetchQuery('key', fetchFn)

      expect(data).toBe('data')
      expect(queryCache.getQuery('key')).toBeFalsy()
    })
  })

  describe('server enabled cache', () => {
    it('should not trigger fetch', () => {
      const queryCache = makeServerQueryCache()
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
      const queryCache = makeServerQueryCache()
      const fetchFn = () => Promise.resolve('data')
      const data = await queryCache.prefetchQuery('key', fetchFn)

      expect(data).toBe('data')
      expect(queryCache.getQuery('key').state.data).toBe('data')
    })

    it('should return existing data from the cache', async () => {
      const queryCache = makeServerQueryCache()
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
      const queryCache = makeServerQueryCache()
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

      const queryCache = makeServerQueryCache()
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

    it('should throw an error with Suspense', async () => {
      expect.assertions(1)

      const queryCache = makeServerQueryCache()
      const queryFn = jest.fn(() => Promise.resolve())

      try {
        await queryCache.prefetchQuery('test', queryFn, { suspense: true })
      } catch (error) {
        expect(error.message).toBe(
          'ServerQueryCache does not yet support Suspense'
        )
      }
    })
  })
})
