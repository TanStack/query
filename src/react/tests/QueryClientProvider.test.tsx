import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { sleep, queryKey } from './utils'
import { QueryClient, QueryClientProvider, QueryCache, useQuery } from '../..'

describe('QueryClientProvider', () => {
  test('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const cache = new QueryCache()
    const client = new QueryClient({ cache })

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
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(client.getCache().find(key)).toBeDefined()
  })

  test('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const cache1 = new QueryCache()
    const cache2 = new QueryCache()

    const client1 = new QueryClient({ cache: cache1 })
    const client2 = new QueryClient({ cache: cache2 })

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
        <QueryClientProvider client={client1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={client2}>
          <Page2 />
        </QueryClientProvider>
      </>
    )

    await waitFor(() => rendered.getByText('test1'))
    await waitFor(() => rendered.getByText('test2'))

    expect(cache1.find(key1)).toBeDefined()
    expect(cache1.find(key2)).not.toBeDefined()
    expect(cache2.find(key1)).not.toBeDefined()
    expect(cache2.find(key2)).toBeDefined()
  })

  test("uses defaultOptions for queries when they don't provide their own config", async () => {
    const key = queryKey()

    const cache = new QueryCache()
    const client = new QueryClient({
      cache,
      defaultOptions: {
        queries: {
          cacheTime: Infinity,
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
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(cache.find(key)).toBeDefined()
    expect(cache.find(key)?.options.cacheTime).toBe(Infinity)
  })
})
