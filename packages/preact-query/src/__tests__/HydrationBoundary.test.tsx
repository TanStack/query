import * as coreModule from '@tanstack/query-core'
import type { hydrate } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import { render } from '@testing-library/preact'
import { Suspense, startTransition } from 'preact/compat'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  useQuery,
} from '..'

describe('Preact hydration', () => {
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

  describe('PreactQueryCacheProvider with hydration support', () => {
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

      startTransition(() => {
        rendered.rerender(
          <Suspense fallback="loading">
            <QueryClientProvider client={queryClient}>
              <HydrationBoundary state={newDehydratedState}>
                <Page queryKey={['string']} />
                <Page queryKey={['added']} />
                <Thrower />
              </HydrationBoundary>
            </QueryClientProvider>
          </Suspense>,
        )

        expect(rendered.getByText('loading')).toBeInTheDocument()
      })

      startTransition(() => {
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
})
