/**
 * @jest-environment node
 */

import * as React from 'react'
// @ts-ignore
import { renderToString } from 'react-dom/server'

import { sleep, queryKey, createQueryClient } from '../../../../tests/utils'
import { useQuery, QueryClientProvider, QueryCache, useInfiniteQuery } from '..'

describe('Server Side Rendering', () => {
  it('should not trigger fetch', () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')

    function Page() {
      const query = useQuery(key, queryFn)

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

    expect(markup).toContain('status loading')
    expect(queryFn).toHaveBeenCalledTimes(0)
    queryCache.clear()
  })

  it('should add prefetched data to cache', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()
    const fetchFn = () => Promise.resolve('data')
    const data = await queryClient.fetchQuery(key, fetchFn)
    expect(data).toBe('data')
    expect(queryCache.find(key)?.state.data).toBe('data')
    queryCache.clear()
  })

  it('should return existing data from the cache', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()
    const queryFn = jest.fn(() => {
      sleep(10)
      return 'data'
    })

    function Page() {
      const query = useQuery(key, queryFn)

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    await queryClient.prefetchQuery(key, queryFn)

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
      const { data } = useQuery([key, page], async () => page, {
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
    const queryFn = jest.fn(async () => {
      await sleep(5)
      return 'page 1'
    })

    function Page() {
      const query = useInfiniteQuery(key, queryFn)
      return (
        <ul>
          {query.data?.pages.map((page) => (
            <li key={page}>{page}</li>
          ))}
        </ul>
      )
    }

    await queryClient.prefetchInfiniteQuery(key, queryFn)

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
