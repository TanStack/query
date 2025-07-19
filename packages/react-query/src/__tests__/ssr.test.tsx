import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '..'
import { setIsServer } from './utils'

describe('Server Side Rendering', () => {
  setIsServer(true)

  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not trigger fetch', () => {
    const key = queryKey()
    const queryFn = vi.fn().mockReturnValue('data')

    function Page() {
      const query = useQuery({ queryKey: key, queryFn })

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('status pending')
    expect(queryFn).toHaveBeenCalledTimes(0)
    queryCache.clear()
  })

  it('should add prefetched data to cache', async () => {
    const key = queryKey()

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'data'
      },
    })
    await vi.advanceTimersByTimeAsync(10)

    const data = await promise

    expect(data).toBe('data')
    expect(queryCache.find({ queryKey: key })?.state.data).toBe('data')
    queryCache.clear()
  })

  it('should return existing data from the cache', async () => {
    const key = queryKey()
    const queryFn = vi.fn(async () => {
      await sleep(10)
      return 'data'
    })

    function Page() {
      const query = useQuery({ queryKey: key, queryFn })

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    queryClient.prefetchQuery({ queryKey: key, queryFn })
    await vi.advanceTimersByTimeAsync(10)

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('status success')
    expect(queryFn).toHaveBeenCalledTimes(1)
    queryCache.clear()
  })

  it('should add initialData to the cache', () => {
    const key = queryKey()

    function Page() {
      const [page, setPage] = React.useState(1)
      const { data } = useQuery({
        queryKey: [key, page],
        queryFn: () => Promise.resolve(page),
        initialData: 1,
      })

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    const keys = queryCache.getAll().map((query) => query.queryKey)

    expect(keys).toEqual([[key, 1]])
    queryCache.clear()
  })

  it('useInfiniteQuery should return the correct state', async () => {
    const key = queryKey()
    const queryFn = vi.fn(async () => {
      await sleep(5)
      return 'page 1'
    })

    function Page() {
      const query = useInfiniteQuery({
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      })
      return (
        <ul>
          {query.data?.pages.map((page) => (
            <li key={page}>{page}</li>
          ))}
        </ul>
      )
    }

    queryClient.prefetchInfiniteQuery({
      queryKey: key,
      queryFn,
      initialPageParam: 0,
    })
    await vi.advanceTimersByTimeAsync(5)

    const markup = renderToString(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    expect(markup).toContain('page 1')
    expect(queryFn).toHaveBeenCalledTimes(1)
    queryCache.clear()
  })
})
