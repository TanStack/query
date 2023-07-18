import * as React from 'react'
import { render } from '@testing-library/react'

import * as coreModule from '@tanstack/query-core'
import { vi } from 'vitest'
import {
  HydrationBoundary,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  useQuery,
} from '..'
import { createQueryClient, sleep } from './utils'

describe('React hydration', () => {
  const fetchData: (value: string) => Promise<string> = (value) =>
    new Promise((res) => setTimeout(() => res(value), 10))
  const dataQuery: (key: [string]) => Promise<string> = (key) =>
    fetchData(key[0])
  let stringifiedState: string

  beforeAll(async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => dataQuery(['stringCached']),
    })
    const dehydrated = dehydrate(queryClient)
    stringifiedState = JSON.stringify(dehydrated)
    queryClient.clear()
  })

  test('should hydrate queries to the cache on context', async () => {
    const dehydratedState = JSON.parse(stringifiedState)
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    function Page() {
      const { data } = useQuery({
        queryKey: ['string'],
        queryFn: () => dataQuery(['string']),
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await rendered.findByText('stringCached')
    await rendered.findByText('string')
    queryClient.clear()
  })

  test('should hydrate queries to the cache on custom context', async () => {
    const queryCacheOuter = new QueryCache()
    const queryCacheInner = new QueryCache()

    const queryClientInner = new QueryClient({ queryCache: queryCacheInner })
    const queryClientOuter = new QueryClient({ queryCache: queryCacheOuter })

    const dehydratedState = JSON.parse(stringifiedState)

    function Page() {
      const { data } = useQuery({
        queryKey: ['string'],
        queryFn: () => dataQuery(['string']),
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <QueryClientProvider client={queryClientOuter}>
        <QueryClientProvider client={queryClientInner}>
          <HydrationBoundary state={dehydratedState}>
            <Page />
          </HydrationBoundary>
        </QueryClientProvider>
      </QueryClientProvider>,
    )

    await rendered.findByText('stringCached')
    await rendered.findByText('string')

    queryClientInner.clear()
    queryClientOuter.clear()
  })

  describe('ReactQueryCacheProvider with hydration support', () => {
    test('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })

      function Page({ queryKey }: { queryKey: [string] }) {
        const { data } = useQuery({
          queryKey,
          queryFn: () => dataQuery(queryKey),
        })
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydratedState}>
            <Page queryKey={['string']} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      await rendered.findByText('string')

      const intermediateCache = new QueryCache()
      const intermediateClient = createQueryClient({
        queryCache: intermediateCache,
      })
      await intermediateClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => dataQuery(['should change']),
      })
      await intermediateClient.prefetchQuery({
        queryKey: ['added string'],
        queryFn: () => dataQuery(['added string']),
      })
      const dehydrated = dehydrate(intermediateClient)
      intermediateClient.clear()

      rendered.rerender(
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydrated}>
            <Page queryKey={['string']} />
            <Page queryKey={['added string']} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      // Existing query data should be overwritten if older,
      // so this should have changed
      await sleep(10)
      rendered.getByText('should change')
      // New query data should be available immediately
      rendered.getByText('added string')

      queryClient.clear()
    })

    test('should hydrate queries to new cache if cache changes', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })

      function Page() {
        const { data } = useQuery({
          queryKey: ['string'],
          queryFn: () => dataQuery(['string']),
        })
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydratedState}>
            <Page />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      await rendered.findByText('string')

      const newClientQueryCache = new QueryCache()
      const newClientQueryClient = createQueryClient({
        queryCache: newClientQueryCache,
      })

      rendered.rerender(
        <QueryClientProvider client={newClientQueryClient}>
          <HydrationBoundary state={dehydratedState}>
            <Page />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      await sleep(10)
      rendered.getByText('string')

      queryClient.clear()
      newClientQueryClient.clear()
    })
  })

  test('should not hydrate queries if state is null', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    const hydrateSpy = vi.spyOn(coreModule, 'hydrate')

    function Page() {
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={null}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })

  test('should not hydrate queries if state is undefined', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    const hydrateSpy = vi.spyOn(coreModule, 'hydrate')

    function Page() {
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={undefined}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })
})
