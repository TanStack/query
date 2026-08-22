import * as coreModule from '@tanstack/query-core'
import type { hydrate } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { render } from '@testing-library/preact'
import { Suspense, startTransition } from 'preact/compat'
import { afterEach, beforeEach, describe, expect, vi, it } from 'vitest'

import {
  HydrationBoundary,
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  useQuery,
} from '..'

describe('Preact hydration', () => {
  const stringKey = queryKey()
  const addedKey = queryKey()
  const promiseKey = queryKey()
  let stringifiedState: string

  beforeEach(async () => {
    vi.useFakeTimers()
    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: stringKey,
      queryFn: () => sleep(10).then(() => ['stringCached']),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydrated = dehydrate(queryClient)
    stringifiedState = JSON.stringify(dehydrated)
    queryClient.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should hydrate queries to the cache on context', async () => {
    const dehydratedState = JSON.parse(stringifiedState)
    const queryClient = new QueryClient()

    function Page() {
      const { data } = useQuery({
        queryKey: stringKey,
        queryFn: () => sleep(20).then(() => ['string']),
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

    expect(rendered.getByText('stringCached')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('string')).toBeInTheDocument()
    queryClient.clear()
  })

  it('should hydrate queries to the cache on custom context', async () => {
    const queryClientInner = new QueryClient()
    const queryClientOuter = new QueryClient()

    const dehydratedState = JSON.parse(stringifiedState)

    function Page() {
      const { data } = useQuery({
        queryKey: stringKey,
        queryFn: () => sleep(20).then(() => ['string']),
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

    expect(rendered.getByText('stringCached')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('string')).toBeInTheDocument()

    queryClientInner.clear()
    queryClientOuter.clear()
  })

  describe('PreactQueryCacheProvider with hydration support', () => {
    it('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryClient = new QueryClient()

      function Page({ queryKey: pageKey }: { queryKey: Array<string> }) {
        const { data } = useQuery({
          queryKey: pageKey,
          queryFn: () => sleep(20).then(() => pageKey),
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
            <Page queryKey={stringKey} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      expect(rendered.getByText('stringCached')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(21)
      expect(rendered.getByText(stringKey[0]!)).toBeInTheDocument()

      const intermediateClient = new QueryClient()

      intermediateClient.prefetchQuery({
        queryKey: stringKey,
        queryFn: () => sleep(20).then(() => ['should change']),
      })
      intermediateClient.prefetchQuery({
        queryKey: addedKey,
        queryFn: () => sleep(20).then(() => [addedKey[0]]),
      })
      await vi.advanceTimersByTimeAsync(20)
      const dehydrated = dehydrate(intermediateClient)
      intermediateClient.clear()

      rendered.rerender(
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydrated}>
            <Page queryKey={stringKey} />
            <Page queryKey={addedKey} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      // Existing observer should not have updated at this point,
      // as that would indicate a side effect in the render phase
      expect(rendered.getByText(stringKey[0]!)).toBeInTheDocument()
      // New query data should be available immediately
      expect(rendered.getByText(addedKey[0]!)).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(0)
      // After effects phase has had time to run, the observer should have updated
      expect(rendered.queryByText(stringKey[0]!)).not.toBeInTheDocument()
      expect(rendered.getByText('should change')).toBeInTheDocument()

      queryClient.clear()
    })

    // Preact has no equivalent of a render that never happened. A tree that
    // suspends is diffed and committed, layout effects and all, and only then
    // gets swapped out for the fallback. What keeps the current page intact is
    // that queries with observers wait for a passive effect, and those never
    // run for a tree that suspended, see the test further down with a sidebar
    // that survives the transition. Here the rerender introduces a new root,
    // which remounts everything and unsubscribes the observer before the
    // boundary even renders, so by then this is a query nobody is watching.
    it('should hydrate an unobserved query even if the render that carried it suspends', async () => {
      const initialDehydratedState = JSON.parse(stringifiedState)
      const queryClient = new QueryClient()

      function Page({ queryKey: pageKey }: { queryKey: Array<string> }) {
        const { data } = useQuery({
          queryKey: pageKey,
          queryFn: () => sleep(20).then(() => pageKey),
        })
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={initialDehydratedState}>
            <Page queryKey={stringKey} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      expect(rendered.getByText('stringCached')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(21)
      expect(rendered.getByText(stringKey[0]!)).toBeInTheDocument()

      const intermediateClient = new QueryClient()
      intermediateClient.prefetchQuery({
        queryKey: stringKey,
        queryFn: () => sleep(20).then(() => ['should not change']),
      })
      intermediateClient.prefetchQuery({
        queryKey: addedKey,
        queryFn: () => sleep(20).then(() => [addedKey[0]]),
      })
      await vi.advanceTimersByTimeAsync(20)

      const newDehydratedState = dehydrate(intermediateClient)
      intermediateClient.clear()

      function Thrower(): never {
        throw new Promise(() => {
          // Never resolve
        })
      }

      startTransition(() => {
        rendered.rerender(
          <Suspense fallback="loading">
            <QueryClientProvider client={queryClient}>
              <HydrationBoundary state={newDehydratedState}>
                <Page queryKey={stringKey} />
                <Page queryKey={addedKey} />
                <Thrower />
              </HydrationBoundary>
            </QueryClientProvider>
          </Suspense>,
        )

        expect(rendered.getByText('loading')).toBeInTheDocument()
        // The tree committed before the fallback took over, so its data is in
        // the cache even though none of it made it to the screen
        expect(queryClient.getQueryData(stringKey)).toEqual([
          'should not change',
        ])
      })

      startTransition(() => {
        rendered.rerender(
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={initialDehydratedState}>
              <Page queryKey={stringKey} />
              <Page queryKey={addedKey} />
            </HydrationBoundary>
          </QueryClientProvider>,
        )

        // Both pages render what the cache holds, the query that already
        // existed included
        expect(rendered.getByText('should not change')).toBeInTheDocument()
        expect(rendered.queryByText(stringKey[0]!)).not.toBeInTheDocument()
        // New query data should be available immediately because it was
        // hydrated in the previous transition, even though the new dehydrated
        // state did not contain it
        expect(rendered.getByText(addedKey[0]!)).toBeInTheDocument()
      })

      queryClient.clear()
    })

    it('should hydrate queries to new cache if cache changes', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryClient = new QueryClient()

      function Page() {
        const { data } = useQuery({
          queryKey: stringKey,
          queryFn: () => sleep(20).then(() => ['string']),
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

      expect(rendered.getByText('stringCached')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(21)
      expect(rendered.getByText('string')).toBeInTheDocument()
      const newClientQueryClient = new QueryClient()

      rendered.rerender(
        <QueryClientProvider client={newClientQueryClient}>
          <HydrationBoundary state={dehydratedState}>
            <Page />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      await vi.advanceTimersByTimeAsync(20)
      expect(rendered.getByText('string')).toBeInTheDocument()

      queryClient.clear()
      newClientQueryClient.clear()
    })
  })

  it('should not refetch an inactive query when hydrated data is fresh', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const queryFn = vi.fn(() => sleep(10).then(() => 'client'))

    function Page() {
      const { data } = useQuery({
        queryKey: key,
        queryFn,
        staleTime: 1000,
      })
      return <div>{data}</div>
    }

    // First visit fetches and caches the data
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('client')).toBeInTheDocument()

    // Navigate away, the cached data goes stale while the page is unmounted
    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <div />
      </QueryClientProvider>,
    )
    await vi.advanceTimersByTimeAsync(2000)

    // A loader fetches fresh data for the revisit and dehydrates it
    const loaderClient = new QueryClient()
    loaderClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'loader'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(loaderClient)
    loaderClient.clear()

    queryFn.mockClear()
    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    // Hydration lands before the remounted useQuery subscribes, so it uses the
    // fresh data instead of fetching it all over again
    await vi.advanceTimersByTimeAsync(11)
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('loader')).toBeInTheDocument()

    queryClient.clear()
  })

  it('should not refetch a query that remounts in the same commit as the boundary', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const queryFn = vi.fn(() => sleep(10).then(() => 'client'))

    function Page() {
      const { data } = useQuery({
        queryKey: key,
        queryFn,
        staleTime: 1000,
      })
      return <div>{data}</div>
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('client')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(2000)

    const loaderClient = new QueryClient()
    loaderClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'loader'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(loaderClient)
    loaderClient.clear()

    queryFn.mockClear()
    // Wrapping the page in the boundary remounts it, so the old observer goes
    // away and a new one subscribes in one go. Preact tears the old tree down
    // while it diffs, so by the time the boundary commits the query has no
    // subscribers left
    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(11)
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('loader')).toBeInTheDocument()

    queryClient.clear()
  })

  it('should not hydrate a query that is on screen while a sibling suspends', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()

    function Sidebar() {
      const { data } = useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'sidebar'),
        staleTime: Infinity,
      })
      return <div>{data}</div>
    }

    function Thrower(): never {
      throw new Promise(() => {
        // Never resolve
      })
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <Sidebar />
      </QueryClientProvider>,
    )
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('sidebar')).toBeInTheDocument()

    const loaderClient = new QueryClient()
    loaderClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'loader'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(loaderClient)
    loaderClient.clear()

    // The route the app is navigating to suspends and never gets there, while
    // the sidebar stays mounted and keeps rendering the query
    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <Sidebar />
        <Suspense fallback="loading">
          <HydrationBoundary state={dehydratedState}>
            <Thrower />
          </HydrationBoundary>
        </Suspense>
      </QueryClientProvider>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('sidebar')).toBeInTheDocument()
    expect(queryClient.getQueryData(key)).toBe('sidebar')

    queryClient.clear()
  })

  it('should not hydrate an unsubscribed query while restoring', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'cached'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const loaderClient = new QueryClient()
    loaderClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'loader'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(loaderClient)
    loaderClient.clear()

    function Page() {
      const { data } = useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'client'),
      })
      return <div>{data}</div>
    }

    function Thrower(): never {
      throw new Promise(() => {
        // Never resolve
      })
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <IsRestoringProvider value={true}>
          <Page />
        </IsRestoringProvider>
      </QueryClientProvider>,
    )
    expect(rendered.getByText('cached')).toBeInTheDocument()

    // Nothing subscribes while restoring, so a cache entry that is on screen
    // looks exactly like one nobody is using
    rendered.rerender(
      <QueryClientProvider client={queryClient}>
        <IsRestoringProvider value={true}>
          <Page />
          <Suspense fallback="loading">
            <HydrationBoundary state={dehydratedState}>
              <Thrower />
            </HydrationBoundary>
          </Suspense>
        </IsRestoringProvider>
      </QueryClientProvider>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('cached')).toBeInTheDocument()
    expect(queryClient.getQueryData(key)).toBe('cached')

    queryClient.clear()
  })

  it('should not deserialize the same query twice', async () => {
    const key = queryKey()
    const deserializeData = vi.fn((data: any) => data)
    const queryClient = new QueryClient({
      defaultOptions: { hydrate: { deserializeData } },
    })

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'cached'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const loaderClient = new QueryClient()
    loaderClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'loader'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(loaderClient)
    loaderClient.clear()

    function Page() {
      const { data } = useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'client'),
        staleTime: 1000,
      })
      return <div>{data}</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )
    await vi.advanceTimersByTimeAsync(11)

    // The layout effect took care of this one, the passive effect has nothing
    // left to do with it
    expect(deserializeData).toHaveBeenCalledTimes(1)

    queryClient.clear()
  })

  it('should not hydrate queries if state is null', async () => {
    const queryClient = new QueryClient()

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

    await Promise.all(
      Array.from({ length: 1000 }).map(async (_, index) => {
        await vi.advanceTimersByTimeAsync(index)
        expect(hydrateSpy).toHaveBeenCalledTimes(0)
      }),
    )

    hydrateSpy.mockRestore()
    queryClient.clear()
  })

  it('should not hydrate queries if state is undefined', async () => {
    const queryClient = new QueryClient()

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

    await vi.advanceTimersByTimeAsync(0)
    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })

  it('should not hydrate queries if state is not an object', async () => {
    const queryClient = new QueryClient()

    const hydrateSpy = vi.spyOn(coreModule, 'hydrate')

    function Page() {
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={'invalid-state' as any}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)
    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })

  it('should handle state without queries property gracefully', async () => {
    const queryClient = new QueryClient()

    const hydrateSpy = vi.spyOn(coreModule, 'hydrate')

    function Page() {
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={{} as any}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)
    expect(hydrateSpy).toHaveBeenCalledTimes(0)

    hydrateSpy.mockRestore()
    queryClient.clear()
  })

  // https://github.com/TanStack/query/issues/8677
  it('should not infinite loop when hydrating promises that resolve to errors', async () => {
    const originalHydrate = coreModule.hydrate
    const hydrateSpy = vi.spyOn(coreModule, 'hydrate')
    let hydrationCount = 0
    hydrateSpy.mockImplementation((...args: Parameters<typeof hydrate>) => {
      hydrationCount++
      // Arbitrary number
      if (hydrationCount > 10) {
        // This is a rough way to detect it. Calling hydrate multiple times with
        // the same data is usually fine, but in this case it indicates the
        // logic in HydrationBoundary is not working as expected.
        throw new Error('Too many hydrations detected')
      }
      return originalHydrate(...args)
    })

    // For the bug to trigger, there needs to already be a query in the cache,
    // with a dataUpdatedAt earlier than the dehydratedAt of the next query
    const clientQueryClient = new QueryClient()
    clientQueryClient.prefetchQuery({
      queryKey: promiseKey,
      queryFn: () => sleep(20).then(() => 'existing'),
    })
    await vi.advanceTimersByTimeAsync(20)

    const prefetchQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })
    prefetchQueryClient.prefetchQuery({
      queryKey: promiseKey,
      queryFn: () =>
        sleep(10).then(() => Promise.reject(new Error('Query failed'))),
    })

    const dehydratedState = dehydrate(prefetchQueryClient)

    // Mimic what React/our synchronous thenable does for already rejected promises
    // @ts-expect-error
    dehydratedState.queries[0].promise.status = 'failure'

    function Page() {
      const { data } = useQuery({
        queryKey: promiseKey,
        queryFn: () => sleep(20).then(() => ['new']),
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <QueryClientProvider client={clientQueryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    expect(rendered.getByText('existing')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('new')).toBeInTheDocument()

    hydrateSpy.mockRestore()
    prefetchQueryClient.clear()
    clientQueryClient.clear()
  })
})
