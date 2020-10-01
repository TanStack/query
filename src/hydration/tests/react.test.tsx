import React from 'react'
import { render } from '@testing-library/react'

import { QueryClient, QueryClientProvider, QueryCache, useQuery } from '../..'
import { dehydrate, useHydrate, Hydrate } from '../'
import { sleep } from '../../react/tests/utils'

describe('React hydration', () => {
  const fetchData: (value: string) => Promise<string> = value =>
    new Promise(res => setTimeout(() => res(value), 10))
  const dataQuery: (key: string) => Promise<string> = key => fetchData(key)
  let stringifiedState: string

  beforeAll(async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', dataQuery)
    const dehydrated = dehydrate(cache)
    stringifiedState = JSON.stringify(dehydrated)
    cache.clear()
  })

  describe('useHydrate', () => {
    test('should hydrate queries to the cache on context', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const cache = new QueryCache()
      const client = new QueryClient({ cache })

      function Page() {
        useHydrate(dehydratedState)
        const { data } = useQuery('string', dataQuery)
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

      await sleep(10)
      rendered.getByText('string')
      cache.clear()
    })
  })

  describe('ReactQueryCacheProvider with hydration support', () => {
    test('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const cache = new QueryCache()
      const client = new QueryClient({ cache })

      function Page({ queryKey }: { queryKey: string }) {
        const { data } = useQuery(queryKey, dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={client}>
          <Hydrate state={dehydratedState}>
            <Page queryKey={'string'} />
          </Hydrate>
        </QueryClientProvider>
      )

      await sleep(10)
      rendered.getByText('string')

      const intermediateCache = new QueryCache()
      const intermediateClient = new QueryClient({ cache: intermediateCache })
      await intermediateClient.prefetchQuery('string', () =>
        dataQuery('should change')
      )
      await intermediateClient.prefetchQuery('added string', dataQuery)
      const dehydrated = dehydrate(intermediateCache)
      intermediateCache.clear()

      rendered.rerender(
        <QueryClientProvider client={client}>
          <Hydrate state={dehydrated}>
            <Page queryKey={'string'} />
            <Page queryKey={'added string'} />
          </Hydrate>
        </QueryClientProvider>
      )

      // Existing query data should be overwritten if older,
      // so this should have changed
      await sleep(10)
      rendered.getByText('should change')
      // New query data should be available immediately
      rendered.getByText('added string')

      cache.clear()
    })

    test('should hydrate queries to new cache if cache changes', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const cache = new QueryCache()
      const client = new QueryClient({ cache })

      function Page() {
        const { data } = useQuery('string', dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={client}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </QueryClientProvider>
      )

      await sleep(10)
      rendered.getByText('string')

      const newClientQueryCache = new QueryCache()
      const newClientQueryClient = new QueryClient({
        cache: newClientQueryCache,
      })

      rendered.rerender(
        <QueryClientProvider client={newClientQueryClient}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </QueryClientProvider>
      )

      await sleep(10)
      rendered.getByText('string')

      cache.clear()
      newClientQueryCache.clear()
    })
  })
})
