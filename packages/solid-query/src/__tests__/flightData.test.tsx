import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { getFlightDataConsumer } from '@solidjs/web/server-functions'
import { dehydrate } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import {
  FLIGHT_DATA_SOURCE,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '..'
import type { DehydratedState } from '@tanstack/query-core'

// The provider's single-flight consumer: mutation responses carrying a
// FLIGHT_DATA_SOURCE slice hydrate the provider's client. These tests
// drive the registered consumer directly — the wire protocol (request-leg
// header, keyed envelope, slice routing) is @solidjs/web's, tested there.
describe('single-flight data source', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  function flightSlice(
    key: ReadonlyArray<unknown>,
    data: unknown,
  ): DehydratedState {
    const producer = new QueryClient()
    producer.setQueryData(key, data)
    const state = dehydrate(producer)
    producer.clear()
    return state
  }

  it('registers the consumer for the lifetime of the provider', () => {
    expect(getFlightDataConsumer(FLIGHT_DATA_SOURCE)).toBeUndefined()
    const result = render(() => (
      <QueryClientProvider client={queryClient}>
        <div />
      </QueryClientProvider>
    ))
    expect(getFlightDataConsumer(FLIGHT_DATA_SOURCE)).toBeTypeOf('function')
    result.unmount()
    expect(getFlightDataConsumer(FLIGHT_DATA_SOURCE)).toBeUndefined()
  })

  it('hydrates the slice into the cache and mounted queries update', async () => {
    const key = queryKey()
    let fetches = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => {
          fetches++
          return Promise.resolve('stale')
        },
        staleTime: Infinity,
      }))
      return <span>{state.data}</span>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('stale')).toBeInTheDocument()
    expect(fetches).toBe(1)

    // The mutation's data is newer than the mounted query's — hydrate()
    // only adopts fresher timestamps, and fake timers freeze Date.now().
    await vi.advanceTimersByTimeAsync(10)

    // What the transport does when a mutation response carries the slice.
    const consumer = getFlightDataConsumer(FLIGHT_DATA_SOURCE)!
    await consumer(flightSlice(key, 'fresh'), {
      response: new Response(null),
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByText('fresh')).toBeInTheDocument()
    // Seeding, not invalidating: no refetch was triggered.
    expect(fetches).toBe(1)
  })

  it('seeds entries no component has mounted', async () => {
    const key = queryKey()
    render(() => (
      <QueryClientProvider client={queryClient}>
        <div />
      </QueryClientProvider>
    ))

    const consumer = getFlightDataConsumer(FLIGHT_DATA_SOURCE)!
    await consumer(flightSlice(key, 'prefetched'), {
      response: new Response(null),
    })

    expect(queryClient.getQueryData(key)).toBe('prefetched')
  })

  // The declared-scope sweep: a mutation names its invalidation scope with
  // `X-Revalidate` keys (Solid's reload/redirect `revalidate` option); the
  // payload covers what the server recomputed, and whatever a declared key
  // matches beyond it is invalidated client-side — active queries refetch,
  // inactive ones are marked stale. Keys match by queryKey prefix.
  describe('X-Revalidate sweep', () => {
    function revalidateResponse(keys: string) {
      return new Response(null, { headers: { 'X-Revalidate': keys } })
    }

    it('refetches active queries a declared key matches beyond the payload', async () => {
      let fetches = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: ['users', 1],
          queryFn: () => {
            fetches++
            return Promise.resolve(`user-${fetches}`)
          },
          staleTime: Infinity,
        }))
        return <span>{state.data}</span>
      }

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))
      await vi.advanceTimersByTimeAsync(0)
      expect(rendered.getByText('user-1')).toBeInTheDocument()

      // The payload covers ['users'] (the list); the mounted instance
      // ['users', 1] is only this client's — the sweep picks it up.
      const consumer = getFlightDataConsumer(FLIGHT_DATA_SOURCE)!
      await consumer(flightSlice(['users'], 'fresh-list'), {
        response: revalidateResponse('users'),
      })
      await vi.advanceTimersByTimeAsync(0)

      expect(fetches).toBe(2)
      expect(rendered.getByText('user-2')).toBeInTheDocument()
    })

    it('exempts payload-covered queries from the sweep', async () => {
      const key = ['users', 1]
      let fetches = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: () => {
            fetches++
            return Promise.resolve('stale')
          },
          staleTime: Infinity,
        }))
        return <span>{state.data}</span>
      }

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))
      await vi.advanceTimersByTimeAsync(0)
      expect(rendered.getByText('stale')).toBeInTheDocument()
      // hydrate() only adopts fresher timestamps.
      await vi.advanceTimersByTimeAsync(10)

      // The payload itself covers the declared key's only match: the fresh
      // data seeds it, and the sweep must not spend a refetch on top.
      const consumer = getFlightDataConsumer(FLIGHT_DATA_SOURCE)!
      await consumer(flightSlice(key, 'fresh'), {
        response: revalidateResponse('users'),
      })
      await vi.advanceTimersByTimeAsync(0)

      expect(rendered.getByText('fresh')).toBeInTheDocument()
      expect(fetches).toBe(1)
      expect(queryClient.getQueryState(key)!.isInvalidated).toBe(false)
    })

    it('stale-marks inactive matches instead of refetching', async () => {
      render(() => (
        <QueryClientProvider client={queryClient}>
          <div />
        </QueryClientProvider>
      ))
      queryClient.setQueryData(['users', 2], 'cached')
      queryClient.setQueryData(['posts', 1], 'unrelated')

      const consumer = getFlightDataConsumer(FLIGHT_DATA_SOURCE)!
      await consumer(flightSlice(['users'], 'fresh-list'), {
        response: revalidateResponse('users'),
      })

      expect(queryClient.getQueryState(['users', 2])!.isInvalidated).toBe(true)
      // Covered by the payload: hydrated fresh, not invalidated.
      expect(queryClient.getQueryState(['users'])!.isInvalidated).toBe(false)
      // Outside every declared key: untouched.
      expect(queryClient.getQueryState(['posts', 1])!.isInvalidated).toBe(false)
    })

    it('sweeps each declared key of a comma-separated list', async () => {
      render(() => (
        <QueryClientProvider client={queryClient}>
          <div />
        </QueryClientProvider>
      ))
      queryClient.setQueryData(['users', 2], 'cached')
      queryClient.setQueryData(['posts', 1], 'cached')
      queryClient.setQueryData(['tags'], 'cached')

      const consumer = getFlightDataConsumer(FLIGHT_DATA_SOURCE)!
      await consumer(flightSlice(['other'], 'x'), {
        response: revalidateResponse('users,posts'),
      })

      expect(queryClient.getQueryState(['users', 2])!.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(['posts', 1])!.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(['tags'])!.isInvalidated).toBe(false)
    })
  })
})
