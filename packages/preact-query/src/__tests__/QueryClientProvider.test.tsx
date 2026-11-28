import { findCachedQuery } from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { render } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useQuery,
  useQueryClient,
} from '..'

describe('QueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should set a specific cache for all queries to use', async () => {
    const key = createKey()

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    function Page() {
      const { data } = useQuery(
        queryOptions({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'test'),
        }),
      )

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

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(findCachedQuery(queryCache, { queryKey: key })?.state.data).toBe(
      'test',
    )
  })

  it('should allow multiple caches to be partitioned', async () => {
    const key1 = createKey()
    const key2 = createKey()

    const queryCache1 = new QueryCache()
    const queryCache2 = new QueryCache()

    const queryClient1 = new QueryClient({ queryCache: queryCache1 })
    const queryClient2 = new QueryClient({ queryCache: queryCache2 })

    function Page1() {
      const { data } = useQuery(
        queryOptions({
          queryKey: key1,
          queryFn: () => sleep(10).then(() => 'test1'),
        }),
      )

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    function Page2() {
      const { data } = useQuery(
        queryOptions({
          queryKey: key2,
          queryFn: () => sleep(10).then(() => 'test2'),
        }),
      )

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <>
        <QueryClientProvider client={queryClient1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Page2 />
        </QueryClientProvider>
      </>,
    )

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('test1')).toBeInTheDocument()
    expect(rendered.getByText('test2')).toBeInTheDocument()

    expect(findCachedQuery(queryCache1, { queryKey: key1 })?.state.data).toBe(
      'test1',
    )
    expect(findCachedQuery(queryCache1, { queryKey: key2 })).toBeUndefined()
    expect(findCachedQuery(queryCache2, { queryKey: key1 })).toBeUndefined()
    expect(findCachedQuery(queryCache2, { queryKey: key2 })?.state.data).toBe(
      'test2',
    )
  })

  it("should use defaultOptions for queries when they don't provide their own config", async () => {
    const key = createKey()

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          gcTime: Infinity,
        },
      },
    })

    function Page() {
      const { data } = useQuery(
        queryOptions({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'test'),
        }),
      )

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

    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(findCachedQuery(queryCache, { queryKey: key })?.options.gcTime).toBe(
      Infinity,
    )
  })

  describe('useQueryClient', () => {
    it('should throw an error if no query client has been set', () => {
      vi.spyOn(console, 'error').mockReturnValue(undefined)

      function Page() {
        useQueryClient()
        return null
      }

      expect(() => render(<Page />)).toThrow(
        'No QueryClient set, use QueryClientProvider to set one',
      )
    })
  })
})
