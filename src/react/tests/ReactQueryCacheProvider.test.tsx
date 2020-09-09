import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'

import { sleep, queryKey } from './utils'
import {
  ReactQueryCacheProvider,
  useQuery,
  useQueryCache,
  queryCache,
  QueryCache,
} from '../..'

describe('ReactQueryCacheProvider', () => {
  test('when not used, falls back to global cache', async () => {
    const key = queryKey()

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('test'))

    expect(queryCache.getQuery(key)).toBeDefined()
  })

  test('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const cache = new QueryCache()

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider queryCache={cache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(queryCache.getQuery(key)).not.toBeDefined()
    expect(cache.getQuery(key)).toBeDefined()
  })

  test('implicitly creates a new cache for all queries to use', async () => {
    const key = queryKey()

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(queryCache.getQuery(key)).not.toBeDefined()
  })

  test('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const cache1 = new QueryCache()
    const cache2 = new QueryCache()

    function Page1() {
      const { data } = useQuery(key1, async () => {
        await sleep(10)
        return 'test1'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    function Page2() {
      const { data } = useQuery(key2, async () => {
        await sleep(10)
        return 'test2'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <>
        <ReactQueryCacheProvider queryCache={cache1}>
          <Page1 />
        </ReactQueryCacheProvider>
        <ReactQueryCacheProvider queryCache={cache2}>
          <Page2 />
        </ReactQueryCacheProvider>
      </>
    )

    await waitFor(() => rendered.getByText('test1'))
    await waitFor(() => rendered.getByText('test2'))

    expect(cache1.getQuery(key1)).toBeDefined()
    expect(cache1.getQuery(key2)).not.toBeDefined()
    expect(cache2.getQuery(key1)).not.toBeDefined()
    expect(cache2.getQuery(key2)).toBeDefined()

    cache1.clear({ notify: false })
    cache2.clear({ notify: false })
  })

  test('when cache changes, previous cache is cleaned', async () => {
    const key = queryKey()

    const caches: QueryCache[] = []
    const customCache = new QueryCache()

    function Page() {
      const contextCache = useQueryCache()

      useEffect(() => {
        caches.push(contextCache)
      }, [contextCache])

      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    function App({ cache }: { cache?: QueryCache }) {
      return (
        <ReactQueryCacheProvider queryCache={cache}>
          <Page />
        </ReactQueryCacheProvider>
      )
    }

    const rendered = render(<App />)

    await waitFor(() => rendered.getByText('test'))

    expect(caches).toHaveLength(1)
    jest.spyOn(caches[0], 'clear')

    rendered.rerender(<App cache={customCache} />)

    expect(caches).toHaveLength(2)
    expect(caches[0].clear).toHaveBeenCalled()

    await waitFor(() => rendered.getByText('test'))

    customCache.clear({ notify: false })
  })

  test("uses defaultConfig for queries when they don't provide their own config", async () => {
    const key = queryKey()

    const cache = new QueryCache({
      defaultConfig: {
        queries: {
          staleTime: Infinity,
        },
      },
    })

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider queryCache={cache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(cache.getQuery(key)).toBeDefined()
    expect(cache.getQuery(key)?.config.staleTime).toBe(Infinity)
    cache.clear({ notify: false })
  })
})
