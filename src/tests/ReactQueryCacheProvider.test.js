import React, { useEffect } from 'react'
import { render, cleanup, waitForElement } from '@testing-library/react'
import {
  ReactQueryCacheProvider,
  makeQueryCache,
  queryCache,
  useQuery,
  useQueryCache,
} from '../index'
import { sleep } from './utils'

describe('ReactQueryCacheProvider', () => {
  afterEach(() => {
    cleanup()
    queryCache.clear()
  })

  test('when not used, falls back to global cache', async () => {
    function Page() {
      const { data } = useQuery('test', async () => {
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

    await waitForElement(() => rendered.getByText('test'))

    expect(queryCache.getQuery('test')).toBeDefined()
  })
  test('sets a specific cache for all queries to use', async () => {
    const cache = makeQueryCache()

    function Page() {
      const { data } = useQuery('test', async () => {
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

    await waitForElement(() => rendered.getByText('test'))

    expect(queryCache.getQuery('test')).not.toBeDefined()
    expect(cache.getQuery('test')).toBeDefined()
  })
  test('implicitly creates a new cache for all queries to use', async () => {
    function Page() {
      const { data } = useQuery('test', async () => {
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

    await waitForElement(() => rendered.getByText('test'))

    expect(queryCache.getQuery('test')).not.toBeDefined()
  })
  test('allows multiple caches to be partitioned', async () => {
    const cache1 = makeQueryCache()
    const cache2 = makeQueryCache()

    function Page1() {
      const { data } = useQuery('test1', async () => {
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
      const { data } = useQuery('test2', async () => {
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

    await waitForElement(() => rendered.getByText('test1'))
    await waitForElement(() => rendered.getByText('test2'))

    expect(cache1.getQuery('test1')).toBeDefined()
    expect(cache1.getQuery('test2')).not.toBeDefined()
    expect(cache2.getQuery('test1')).not.toBeDefined()
    expect(cache2.getQuery('test2')).toBeDefined()
  })
  test('when cache changes, previous cache is cleaned', () => {
    let caches = []
    const customCache = makeQueryCache()

    function Page() {
      const queryCache = useQueryCache()
      useEffect(() => {
        caches.push(queryCache)
      }, [queryCache])

      const { data } = useQuery('test', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    function App({ cache }) {
      return (
        <ReactQueryCacheProvider queryCache={cache}>
          <Page />
        </ReactQueryCacheProvider>
      )
    }

    const rendered = render(<App />)

    expect(caches).toHaveLength(1)
    jest.spyOn(caches[0], 'clear')

    rendered.rerender(<App cache={customCache} />)

    expect(caches).toHaveLength(2)
    expect(caches[0].clear).toHaveBeenCalled()
  })
})
