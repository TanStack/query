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
})
