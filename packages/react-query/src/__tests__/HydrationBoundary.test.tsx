import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import * as coreModule from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  useQuery,
} from '..'
import type { hydrate } from '@tanstack/query-core'

describe('React hydration', () => {
  let stringifiedState: string

  beforeEach(async () => {
    vi.useFakeTimers()
    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: ['string'],
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

  test('should hydrate queries to the cache on context', async () => {
    const dehydratedState = JSON.parse(stringifiedState)
    const queryClient = new QueryClient()

    function Page() {
      const { data } = useQuery({
        queryKey: ['string'],
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

  test('should hydrate queries to the cache on custom context', async () => {
    const queryClientInner = new QueryClient()
    const queryClientOuter = new QueryClient()

    const dehydratedState = JSON.parse(stringifiedState)

    function Page() {
      const { data } = useQuery({
        queryKey: ['string'],
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

  describe('ReactQueryCacheProvider with hydration support', () => {
    test('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryClient = new QueryClient()

      function Page({ queryKey }: { queryKey: [string] }) {
        const { data } = useQuery({
          queryKey,
          queryFn: () => sleep(20).then(() => queryKey),
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

      expect(rendered.getByText('stringCached')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(21)
      expect(rendered.getByText('string')).toBeInTheDocument()

      const intermediateClient = new QueryClient()

      intermediateClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(20).then(() => ['should change']),
      })
      intermediateClient.prefetchQuery({
        queryKey: ['added'],
        queryFn: () => sleep(20).then(() => ['added']),
      })
      await vi.advanceTimersByTimeAsync(20)
      const dehydrated = dehydrate(intermediateClient)
      intermediateClient.clear()

      rendered.rerender(
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydrated}>
            <Page queryKey={['string']} />
            <Page queryKey={['added']} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      // Existing observer should not have updated at this point,
      // as that would indicate a side effect in the render phase
      expect(rendered.getByText('string')).toBeInTheDocument()
      // New query data should be available immediately
      expect(rendered.getByText('added')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(0)
      // After effects phase has had time to run, the observer should have updated
      expect(rendered.queryByText('string')).not.toBeInTheDocument()
      expect(rendered.getByText('should change')).toBeInTheDocument()

      queryClient.clear()
    })

    // When we hydrate in transitions that are later aborted, it could be
    // confusing to both developers and users if we suddenly updated existing
    // state on the screen (why did this update when it was not stale, nothing
    // remounted, I didn't change tabs etc?).
    // Any queries that does not exist in the cache yet can still be hydrated
    // since they don't have any observers on the current page that would update.
    test('should hydrate new but not existing queries if transition is aborted', async () => {
      const initialDehydratedState = JSON.parse(stringifiedState)
      const queryClient = new QueryClient()

      function Page({ queryKey }: { queryKey: [string] }) {
        const { data } = useQuery({
          queryKey,
          queryFn: () => sleep(20).then(() => queryKey),
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
            <Page queryKey={['string']} />
          </HydrationBoundary>
        </QueryClientProvider>,
      )

      expect(rendered.getByText('stringCached')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(21)
      expect(rendered.getByText('string')).toBeInTheDocument()

      const intermediateClient = new QueryClient()
      intermediateClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(20).then(() => ['should not change']),
      })
      intermediateClient.prefetchQuery({
        queryKey: ['added'],
        queryFn: () => sleep(20).then(() => ['added']),
      })
      await vi.advanceTimersByTimeAsync(20)

      const newDehydratedState = dehydrate(intermediateClient)
      intermediateClient.clear()

      function Thrower(): never {
        throw new Promise(() => {
          // Never resolve
        })
      }

      React.startTransition(() => {
        rendered.rerender(
          <React.Suspense fallback="loading">
            <QueryClientProvider client={queryClient}>
              <HydrationBoundary state={newDehydratedState}>
                <Page queryKey={['string']} />
                <Page queryKey={['added']} />
                <Thrower />
              </HydrationBoundary>
            </QueryClientProvider>
          </React.Suspense>,
        )

        expect(rendered.getByText('loading')).toBeInTheDocument()
      })

      React.startTransition(() => {
        rendered.rerender(
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={initialDehydratedState}>
              <Page queryKey={['string']} />
              <Page queryKey={['added']} />
            </HydrationBoundary>
          </QueryClientProvider>,
        )

        // This query existed before the transition so it should stay the same
        expect(rendered.getByText('string')).toBeInTheDocument()
        expect(
          rendered.queryByText('should not change'),
        ).not.toBeInTheDocument()
        // New query data should be available immediately because it was
        // hydrated in the previous transition, even though the new dehydrated
        // state did not contain it
        expect(rendered.getByText('added')).toBeInTheDocument()
      })

      await vi.advanceTimersByTimeAsync(20)
      // It should stay the same even after effects have had a chance to run
      expect(rendered.getByText('string')).toBeInTheDocument()
      expect(rendered.queryByText('should not change')).not.toBeInTheDocument()

      queryClient.clear()
    })

    test('should hydrate queries to new cache if cache changes', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const queryClient = new QueryClient()

      function Page() {
        const { data } = useQuery({
          queryKey: ['string'],
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

  test('should not hydrate queries if state is null', async () => {
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

  test('should not hydrate queries if state is undefined', async () => {
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

  test('should not hydrate queries if state is not an object', async () => {
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

  test('should handle state without queries property gracefully', async () => {
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
  test('should not infinite loop when hydrating promises that resolve to errors', async () => {
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
      queryKey: ['promise'],
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
      queryKey: ['promise'],
      queryFn: () =>
        sleep(10).then(() => Promise.reject(new Error('Query failed'))),
    })

    const dehydratedState = dehydrate(prefetchQueryClient)

    // Mimic what React/our synchronous thenable does for already rejected promises
    // @ts-expect-error
    dehydratedState.queries[0].promise.status = 'failure'

    function Page() {
      const { data } = useQuery({
        queryKey: ['promise'],
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

  test('should not refetch when query has enabled set to false', async () => {
    const queryFn = vi.fn()
    const queryClient = new QueryClient()

    function Page() {
      const { data } = useQuery({
        queryKey: ['string'],
        queryFn,
        enabled: false,
      })
      return <div>{JSON.stringify(data)}</div>
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={JSON.parse(stringifiedState)}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    expect(rendered.getByText('["stringCached"]')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('["stringCached"]')).toBeInTheDocument()

    queryClient.clear()
  })

  test('should not refetch when query has staleTime set to Infinity', async () => {
    const queryFn = vi.fn()
    const queryClient = new QueryClient()

    function Page() {
      const { data } = useQuery({
        queryKey: ['string'],
        queryFn,
        staleTime: Infinity,
      })
      return <div>{JSON.stringify(data)}</div>
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={JSON.parse(stringifiedState)}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    expect(rendered.getByText('["stringCached"]')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(11)
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('["stringCached"]')).toBeInTheDocument()

    queryClient.clear()
  })

  test('should not double fetch when hydrating existing query with fresh data on subsequent visits', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'initial-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['revisit-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['revisit-test'],
        queryFn,
        // Use staleTime to prevent refetch during hydration
        // When data is not stale, hydration should skip refetch
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch (like React Router loader on subsequent visit)
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['revisit-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    // Render with HydrationBoundary containing fresh data
    // The existing query in cache should be marked as pending hydration
    // and should NOT refetch because data is not stale (staleTime: Infinity)
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should NOT refetch because data is not stale
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not refetch when refetchOnMount is true during hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['value-true-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['value-true-test'],
        queryFn,
        // Data is not stale, so hydration should skip refetch
        staleTime: Infinity,
        refetchOnMount: true,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['value-true-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should NOT refetch because refetchOnMount is true (not 'always')
    // and data is not stale
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not refetch when refetchOnMount function returns true during hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['function-true-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['function-true-test'],
        queryFn,
        // Data is not stale, so hydration should skip refetch
        staleTime: Infinity,
        refetchOnMount: () => true,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['function-true-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should NOT refetch because refetchOnMount returns true (not 'always')
    // and data is not stale
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not refetch when refetchOnMount is false during hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['value-false-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['value-false-test'],
        queryFn,
        staleTime: 0,
        refetchOnMount: false,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['value-false-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should NOT refetch because refetchOnMount is false
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not refetch when refetchOnMount function returns false during hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['function-false-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['function-false-test'],
        queryFn,
        staleTime: 0,
        refetchOnMount: () => false,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['function-false-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should NOT refetch because refetchOnMount function returns false
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should still refetch when refetchOnMount is explicitly set to "always" despite hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['always-refetch-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['always-refetch-test'],
        queryFn,
        staleTime: 0,
        refetchOnMount: 'always',
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch (like React Router loader on subsequent visit)
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['always-refetch-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    // Render with HydrationBoundary containing fresh data
    // refetchOnMount: 'always' should trigger refetch even during hydration
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    // Initially shows cached data (from first prefetch)
    expect(rendered.getByText('new-data')).toBeInTheDocument()

    // refetchOnMount: 'always' should trigger refetch even during hydration
    // Wait for the refetch to complete
    await vi.advanceTimersByTimeAsync(10)

    // Should refetch because refetchOnMount is 'always' bypasses hydration skip
    expect(queryFn).toHaveBeenCalledTimes(1)
    // Hydration data is shown because useEffect runs after refetch starts
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should still refetch when refetchOnMount function returns "always" despite hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache (simulating initial page visit)
    queryClient.prefetchQuery({
      queryKey: ['function-refetch-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['function-refetch-test'],
        queryFn,
        staleTime: 0,
        refetchOnMount: () => 'always',
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['function-refetch-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    expect(rendered.getByText('new-data')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)

    // Should refetch because refetchOnMount function returns 'always'
    expect(queryFn).toHaveBeenCalledTimes(1)
    // Hydration data is shown because useEffect runs after refetch starts
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should refetch when hydrated data is stale (cached markup scenario)', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache
    queryClient.prefetchQuery({
      queryKey: ['stale-hydration-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    function Page() {
      const { data } = useQuery({
        queryKey: ['stale-hydration-test'],
        queryFn,
        // staleTime: 0 means data is immediately stale
        // This simulates cached markup scenario where server fetch was long ago
        staleTime: 0,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['stale-hydration-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should refetch because data is stale (staleTime: 0)
    // This is the "cached markup scenario" - when hydrated data is old,
    // we should still refetch to get fresh data
    expect(queryFn).toHaveBeenCalledTimes(1)

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not double fetch for multiple queries when hydrating', async () => {
    const queryFn1 = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data-1'))
    const queryFn2 = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data-2'))

    const queryClient = new QueryClient()

    // First, prefetch multiple queries
    queryClient.prefetchQuery({ queryKey: ['multi-1'], queryFn: queryFn1 })
    queryClient.prefetchQuery({ queryKey: ['multi-2'], queryFn: queryFn2 })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)

    function Page() {
      const query1 = useQuery({
        queryKey: ['multi-1'],
        queryFn: queryFn1,
        // Data is not stale, so hydration should skip refetch
        staleTime: Infinity,
      })
      const query2 = useQuery({
        queryKey: ['multi-2'],
        queryFn: queryFn2,
        // Data is not stale, so hydration should skip refetch
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{query1.data}</h1>
          <h2>{query2.data}</h2>
        </div>
      )
    }

    // Simulate server prefetch for multiple queries
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['multi-1'],
      queryFn: () => sleep(10).then(() => 'server-1'),
    })
    serverQueryClient.prefetchQuery({
      queryKey: ['multi-2'],
      queryFn: () => sleep(10).then(() => 'server-2'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn1.mockClear()
    queryFn2.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Neither query should refetch
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('server-1')).toBeInTheDocument()
    expect(rendered.getByText('server-2')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should hydrate new queries immediately without pending flag', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'client-data'))

    // Client has no existing query (empty cache)
    const queryClient = new QueryClient()

    function Page() {
      const { data } = useQuery({
        queryKey: ['new-query-test'],
        queryFn,
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['new-query-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // New queries are hydrated immediately in useMemo (not queued for useEffect)
    // This verifies our pendingHydrationQueries logic doesn't break existing behavior
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not hydrate when server data is older than client data', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache with newer data
    queryClient.prefetchQuery({
      queryKey: ['older-data-test'],
      queryFn: () => sleep(10).then(() => 'newer-client-data'),
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const { data } = useQuery({
        queryKey: ['older-data-test'],
        queryFn,
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    // Simulate server with OLDER data (dataUpdatedAt is earlier)
    const serverQueryClient = new QueryClient()
    // Manually set older data by setting dataUpdatedAt to past
    serverQueryClient.setQueryData(['older-data-test'], 'older-server-data', {
      updatedAt: Date.now() - 10000, // 10 seconds ago
    })
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should NOT refetch and should keep client data (server data is older)
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('newer-client-data')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should handle gracefully when query is removed from cache during hydration in useMemo', async () => {
    const queryClient = new QueryClient()

    // First, prefetch to populate the cache
    queryClient.prefetchQuery({
      queryKey: ['removed-query-test-memo'],
      queryFn: () => sleep(10).then(() => 'initial-data'),
    })
    await vi.advanceTimersByTimeAsync(10)

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['removed-query-test-memo'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    // Mock queryCache.get to return undefined on second call within useMemo
    // First call: existingQuery check - returns query
    // Second call: adding to hydrating set - returns undefined
    const queryCache = queryClient.getQueryCache()
    const originalGet = queryCache.get.bind(queryCache)
    let callCount = 0
    vi.spyOn(queryCache, 'get').mockImplementation((queryHash) => {
      callCount++
      // First call returns the query (for existingQuery check)
      // Second call returns undefined (simulates removal before adding to hydrating set)
      if (callCount === 1) {
        return originalGet(queryHash)
      }
      return undefined
    })

    function Page() {
      const { data } = useQuery({
        queryKey: ['removed-query-test-memo'],
        queryFn: () => sleep(10).then(() => 'new-data'),
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{data ?? 'loading'}</h1>
        </div>
      )
    }

    // This should not throw even if query is removed during hydration
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // The component should render without crashing
    expect(rendered.container).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should handle gracefully when query is removed from cache during hydration in useEffect', async () => {
    const queryClient = new QueryClient()

    // First, prefetch to populate the cache
    queryClient.prefetchQuery({
      queryKey: ['removed-query-test-effect'],
      queryFn: () => sleep(10).then(() => 'initial-data'),
    })
    await vi.advanceTimersByTimeAsync(10)

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['removed-query-test-effect'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    // Mock queryCache.get to return undefined on third call (in useEffect)
    // First call: existingQuery check - returns query
    // Second call: adding to hydrating set - returns query
    // Third call: useEffect cleanup - returns undefined
    const queryCache = queryClient.getQueryCache()
    const originalGet = queryCache.get.bind(queryCache)
    let callCount = 0
    vi.spyOn(queryCache, 'get').mockImplementation((queryHash) => {
      callCount++
      // First two calls return the query
      // Third call returns undefined (simulates removal before useEffect cleanup)
      if (callCount <= 2) {
        return originalGet(queryHash)
      }
      return undefined
    })

    function Page() {
      const { data } = useQuery({
        queryKey: ['removed-query-test-effect'],
        queryFn: () => sleep(10).then(() => 'new-data'),
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{data ?? 'loading'}</h1>
        </div>
      )
    }

    // This should not throw even if query is removed during hydration
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // The component should render without crashing
    expect(rendered.container).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
  })

  test('should not refetch after unmount and remount during hydration', async () => {
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'new-data'))

    const queryClient = new QueryClient()

    // First, prefetch to populate the cache
    queryClient.prefetchQuery({
      queryKey: ['unmount-cleanup-test'],
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)

    // Simulate server prefetch
    const serverQueryClient = new QueryClient()
    serverQueryClient.prefetchQuery({
      queryKey: ['unmount-cleanup-test'],
      queryFn: () => sleep(10).then(() => 'fresh-from-server'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState = dehydrate(serverQueryClient)

    queryFn.mockClear()

    function Page() {
      const { data } = useQuery({
        queryKey: ['unmount-cleanup-test'],
        queryFn,
        // Data is not stale, so hydration should skip refetch
        staleTime: Infinity,
      })
      return (
        <div>
          <h1>{data ?? 'loading'}</h1>
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

    await vi.advanceTimersByTimeAsync(0)

    // Should not refetch during hydration because data is not stale
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('fresh-from-server')).toBeInTheDocument()

    // Unmount
    rendered.unmount()

    // Create a new dehydrated state with newer data for second mount
    const serverQueryClient2 = new QueryClient()
    serverQueryClient2.prefetchQuery({
      queryKey: ['unmount-cleanup-test'],
      queryFn: () => sleep(10).then(() => 'second-server-data'),
    })
    await vi.advanceTimersByTimeAsync(10)
    const dehydratedState2 = dehydrate(serverQueryClient2)

    // Remounting with new hydration state
    const rendered2 = render(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState2}>
          <Page />
        </HydrationBoundary>
      </QueryClientProvider>,
    )

    await vi.advanceTimersByTimeAsync(0)

    // Should show new hydrated data and not refetch
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered2.getByText('second-server-data')).toBeInTheDocument()

    queryClient.clear()
    serverQueryClient.clear()
    serverQueryClient2.clear()
  })
})
