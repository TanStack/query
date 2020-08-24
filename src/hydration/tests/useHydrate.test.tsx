import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ReactQueryCacheProvider, makeQueryCache, useQuery } from '../..'
import { dehydrate, useHydrate } from '../'

import type { DehydratedQueries } from '../'

describe('hydration', () => {
  function Hydrator<TResult>({
    initialQueries,
    children,
  }: {
    initialQueries: DehydratedQueries<TResult>
    children: any
  }) {
    useHydrate(initialQueries)
    return children
  }

  const fetchData: (value: string) => Promise<string> = value =>
    new Promise(res => setTimeout(() => res(value), 10))
  const dataQuery: (key: string) => Promise<string> = key => fetchData(key)
  let stringifiedQueries: string

  beforeAll(async () => {
    const serverQueryCache = makeQueryCache()
    await serverQueryCache.prefetchQuery('string', dataQuery)
    const dehydrated = dehydrate(serverQueryCache)
    stringifiedQueries = JSON.stringify(dehydrated)
    serverQueryCache.clear({ notify: false })
  })

  test('should handle global cache case', async () => {
    const dehydratedQueries = JSON.parse(stringifiedQueries)
    function Page() {
      useHydrate(dehydratedQueries)
      const { data } = useQuery('string', dataQuery)

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('string')
  })

  test('should hydrate queries to the cache on context', async () => {
    const dehydratedQueries = JSON.parse(stringifiedQueries)
    const clientQueryCache = makeQueryCache()

    function Page() {
      useHydrate(dehydratedQueries)
      const { data } = useQuery('string', dataQuery)
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider queryCache={clientQueryCache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('string')
    expect(clientQueryCache.getQuery('string')?.state.isStale).toBe(false)
    await waitFor(() =>
      expect(clientQueryCache.getQuery('string')?.state.isStale).toBe(true)
    )

    clientQueryCache.clear({ notify: false })
  })

  test('should hydrate new queries if queries change', async () => {
    const dehydratedQueries = JSON.parse(stringifiedQueries)
    const clientQueryCache = makeQueryCache()

    function Page({ queryKey }: { queryKey: string }) {
      const { data } = useQuery(queryKey, dataQuery)
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider queryCache={clientQueryCache}>
        <Hydrator initialQueries={dehydratedQueries}>
          <Page queryKey={'string'} />
        </Hydrator>
      </ReactQueryCacheProvider>
    )

    rendered.getByText('string')
    expect(clientQueryCache.getQuery('string')?.state.isStale).toBe(false)
    await waitFor(() =>
      expect(clientQueryCache.getQuery('string')?.state.isStale).toBe(true)
    )

    const intermediateCache = makeQueryCache()
    await intermediateCache.prefetchQuery('string', () =>
      dataQuery('should not change')
    )
    await intermediateCache.prefetchQuery('added string', dataQuery)
    const dehydrated = dehydrate(intermediateCache)
    intermediateCache.clear({ notify: false })

    rendered.rerender(
      <ReactQueryCacheProvider queryCache={clientQueryCache}>
        <Hydrator initialQueries={dehydrated}>
          <Page queryKey={'string'} />
          <Page queryKey={'added string'} />
        </Hydrator>
      </ReactQueryCacheProvider>
    )

    // Existing query data should not be overwritten,
    // so this should still be the original data
    rendered.getByText('string')
    // But new query data should be available immediately
    rendered.getByText('added string')
    expect(clientQueryCache.getQuery('added string')?.state.isStale).toBe(false)
    await waitFor(() =>
      expect(clientQueryCache.getQuery('added string')?.state.isStale).toBe(
        true
      )
    )

    clientQueryCache.clear({ notify: false })
  })

  test('should hydrate queries to new cache if cache changes', async () => {
    const dehydratedQueries = JSON.parse(stringifiedQueries)
    const clientQueryCache = makeQueryCache()

    function Page() {
      const { data } = useQuery('string', dataQuery)
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider queryCache={clientQueryCache}>
        <Hydrator initialQueries={dehydratedQueries}>
          <Page />
        </Hydrator>
      </ReactQueryCacheProvider>
    )

    rendered.getByText('string')
    expect(clientQueryCache.getQuery('string')?.state.isStale).toBe(false)
    await waitFor(() =>
      expect(clientQueryCache.getQuery('string')?.state.isStale).toBe(true)
    )

    const newClientQueryCache = makeQueryCache()

    rendered.rerender(
      <ReactQueryCacheProvider queryCache={newClientQueryCache}>
        <Hydrator initialQueries={dehydratedQueries}>
          <Page />
        </Hydrator>
      </ReactQueryCacheProvider>
    )

    rendered.getByText('string')
    expect(newClientQueryCache.getQuery('string')?.state.isStale).toBe(false)
    await waitFor(() =>
      expect(newClientQueryCache.getQuery('string')?.state.isStale).toBe(true)
    )

    clientQueryCache.clear({ notify: false })
    newClientQueryCache.clear({ notify: false })
  })
})
