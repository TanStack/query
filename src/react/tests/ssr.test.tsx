/**
 * @jest-environment node
 */

import React from 'react'
// @ts-ignore
import { renderToString } from 'react-dom/server'

import { sleep, queryKey } from './utils'
import { useQuery, QueryClient, QueryClientProvider, QueryCache } from '../..'

describe('Server Side Rendering', () => {
  const cache = new QueryCache()
  const client = new QueryClient({ cache })

  it('should not trigger fetch', () => {
    const key = queryKey()
    const queryFn = jest.fn()

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
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    )

    expect(markup).toContain('status loading')
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  it('should add prefetched data to cache', async () => {
    const key = queryKey()
    const fetchFn = () => Promise.resolve('data')
    const data = await client.fetchQueryData(key, fetchFn)
    expect(data).toBe('data')
    expect(client.getCache().find(key)?.state.data).toBe('data')
  })

  it('should return existing data from the cache', async () => {
    const key = queryKey()
    const queryFn = jest.fn(() => sleep(10))

    function Page() {
      const query = useQuery(key, queryFn)

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    await client.prefetchQuery(key, queryFn)

    const markup = renderToString(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    )

    expect(markup).toContain('status success')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should add initialData to the cache', () => {
    const key = queryKey()

    const customCache = new QueryCache()
    const customClient = new QueryClient({ cache: customCache })

    function Page() {
      const [page, setPage] = React.useState(1)
      const { data } = useQuery(
        [key, page],
        async (_: string, pageArg: number) => {
          return pageArg
        },
        { initialData: 1 }
      )

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    renderToString(
      <QueryClientProvider client={customClient}>
        <Page />
      </QueryClientProvider>
    )

    const keys = customCache.getAll().map(query => query.queryKey)

    expect(keys).toEqual([[key, 1]])
  })

  it('should not call setTimeout', async () => {
    const key = queryKey()

    // @ts-ignore
    const setTimeoutMock = jest.spyOn(global, 'setTimeout')

    const queryFn = jest.fn(() => Promise.resolve())

    function Page() {
      const query = useQuery(key, queryFn)

      const content = `status ${query.status}`

      return (
        <div>
          <div>{content}</div>
        </div>
      )
    }

    await client.prefetchQuery(key, queryFn)

    const markup = renderToString(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    )

    expect(markup).toContain('status success')
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(setTimeoutMock).toHaveBeenCalledTimes(0)

    setTimeoutMock.mockRestore()
  })
})
