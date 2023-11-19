import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
// @ts-ignore
import { renderToString } from 'react-dom/server'
import { QueryCache, QueryClientProvider, useInfiniteQuery, useQuery } from '..'
import { createQueryClient, queryKey, sleep } from './utils'

describe('Server Side Rendering', () => {
  it('should not trigger fetch', () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
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
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()
    const fetchFn = () => Promise.resolve('data')
    const data = await queryClient.fetchQuery({
      queryKey: key,
      queryFn: fetchFn,
    })
    expect(data).toBe('data')
    expect(queryCache.find({ queryKey: key })?.state.data).toBe('data')
    queryCache.clear()
  })

  it('should return existing data from the cache', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()
    const queryFn = vi.fn(() => {
      sleep(10)
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

    await queryClient.prefetchQuery({ queryKey: key, queryFn })

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

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    function Page() {
      const [page, setPage] = React.useState(1)
      const { data } = useQuery({
        queryKey: [key, page],
        queryFn: async () => page,
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
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
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
        <ul>{query.data?.pages.map((page) => <li key={page}>{page}</li>)}</ul>
      )
    }

    await queryClient.prefetchInfiniteQuery({
      queryKey: key,
      queryFn,
      initialPageParam: 0,
    })

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
