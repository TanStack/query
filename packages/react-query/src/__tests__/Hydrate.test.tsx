import * as React from 'react'
import { render } from '@testing-library/react'

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  useQuery,
  dehydrate,
  useHydrate,
  Hydrate,
} from '@tanstack/react-query'
import { createQueryClient, sleep } from '../../../../tests/utils'
import * as coreModule from '@tanstack/query-core'

describe('React hydration', () => {
  const fetchData: (value: string) => Promise<string> = (value) =>
    new Promise((res) => setTimeout(() => res(value), 10))
  const dataQuery: (key: [string]) => Promise<string> = (key) =>
    fetchData(key[0])
  let stringifiedState: string

  beforeAll(async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () =>
      dataQuery(['stringCached']),
    )
    const dehydrated = dehydrate(queryClient)
    stringifiedState = JSON.stringify(dehydrated)
    queryClient.clear()
  })

  describe('useHydrate', () => {
    test('should hydrate queries to the cache on context', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })

      function Page() {
        useHydrate(dehydratedState)
        const { data } = useQuery(['string'], () => dataQuery(['string']))
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>,
      )

      await rendered.findByText('stringCached')
      await rendered.findByText('string')
      queryClient.clear()
    })

    test('should hydrate queries to the cache on custom context', async () => {
      const context = React.createContext<QueryClient | undefined>(undefined)

      const queryCacheOuter = new QueryCache()
      const queryCacheInner = new QueryCache()

      const queryClientInner = new QueryClient({ queryCache: queryCacheInner })
      const queryClientOuter = new QueryClient({ queryCache: queryCacheOuter })

      const dehydratedState = JSON.parse(stringifiedState)

      function Page() {
        useHydrate(dehydratedState, { context })
        const { data } = useQuery(['string'], () => dataQuery(['string']), {
          context,
        })
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClientOuter} context={context}>
          <QueryClientProvider client={queryClientInner}>
            <Page />
          </QueryClientProvider>
        </QueryClientProvider>,
      )

      await rendered.findByText('stringCached')
      await rendered.findByText('string')

      queryClientInner.clear()
      queryClientOuter.clear()
    })
  })

  describe('ReactQueryCacheProvider with hydration support', () => {
    test('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })

      function Page({ queryKey }: { queryKey: [string] }) {
        const { data } = useQuery(queryKey, () => dataQuery(queryKey))
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <Hydrate state={dehydratedState}>
            <Page queryKey={['string']} />
          </Hydrate>
        </QueryClientProvider>,
      )

      await rendered.findByText('string')

      const intermediateCache = new QueryCache()
      const intermediateClient = createQueryClient({
        queryCache: intermediateCache,
      })
      await intermediateClient.prefetchQuery(['string'], () =>
        dataQuery(['should change']),
      )
      await intermediateClient.prefetchQuery(['added string'], () =>
        dataQuery(['added string']),
      )
      const dehydrated = dehydrate(intermediateClient)
      intermediateClient.clear()

      rendered.rerender(
        <QueryClientProvider client={queryClient}>
          <Hydrate state={dehydrated}>
            <Page queryKey={['string']} />
            <Page queryKey={['added string']} />
          </Hydrate>
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
        const { data } = useQuery(['string'], () => dataQuery(['string']))
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </QueryClientProvider>,
      )

      await rendered.findByText('string')

      const newClientQueryCache = new QueryCache()
      const newClientQueryClient = createQueryClient({
        queryCache: newClientQueryCache,
      })

      rendered.rerender(
        <QueryClientProvider client={newClientQueryClient}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
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

    const hydrateSpy = jest.spyOn(coreModule, 'hydrate')

    function Page() {
      useHydrate(null)
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })

  test('should not hydrate queries if state is undefined', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    const hydrateSpy = jest.spyOn(coreModule, 'hydrate')

    function Page() {
      useHydrate(undefined)
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })
})
