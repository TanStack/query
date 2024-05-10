import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/react'

import { QueryCache, QueryClientProvider, useQueries, useQuery } from '..'
import { QueryDefaultOptionsProvider } from '../QueryDefaultOptionsProvider'
import { createQueryClient, queryKey, sleep } from './utils'

describe('QueryDefaultOptionsProvider', () => {
  test("uses defaultOptions for queries when they don't provide their own config", async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          gcTime: Infinity,
        },
      },
    })

    function Page() {
      const { data } = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <QueryDefaultOptionsProvider options={{ queries: { gcTime: 1000 } }}>
          <Page />
        </QueryDefaultOptionsProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('test'))

    expect(queryCache.find({ queryKey: key })).toBeDefined()
    expect(queryCache.find({ queryKey: key })?.options.gcTime).toBe(1000)
  })

  test('works with useQueries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          gcTime: Infinity,
        },
      },
    })

    function Page() {
      const [query1, query2] = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(10)
              return 'test1'
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await sleep(10)
              return 'test2'
            },
          },
        ],
      })

      return (
        <div>
          <h1>{query1.data}</h1>
          <h1>{query2.data}</h1>
        </div>
      )
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <QueryDefaultOptionsProvider options={{ queries: { gcTime: 1000 } }}>
          <Page />
        </QueryDefaultOptionsProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('test1'))
    await waitFor(() => rendered.getByText('test2'))

    expect(queryCache.find({ queryKey: key1 })).toBeDefined()
    expect(queryCache.find({ queryKey: key1 })?.options.gcTime).toBe(1000)
    expect(queryCache.find({ queryKey: key2 })).toBeDefined()
    expect(queryCache.find({ queryKey: key2 })?.options.gcTime).toBe(1000)
  })

  test('allows different default options per React subtree', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryClient = createQueryClient()

    function Page1() {
      const { data } = useQuery({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 'test1'
        },
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    function Page2() {
      const { data } = useQuery({
        queryKey: key2,
        queryFn: async () => {
          await sleep(10)
          return 'test2'
        },
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <QueryDefaultOptionsProvider options={{ queries: { gcTime: 1000 } }}>
          <Page1 />
        </QueryDefaultOptionsProvider>
        <QueryDefaultOptionsProvider options={{ queries: { gcTime: 2000 } }}>
          <Page2 />
        </QueryDefaultOptionsProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('test1'))
    await waitFor(() => rendered.getByText('test2'))

    expect(queryClient.getQueryCache().find({ queryKey: key1 })).toBeDefined()
    expect(
      queryClient.getQueryCache().find({ queryKey: key1 })?.options.gcTime,
    ).toBe(1000)

    expect(queryClient.getQueryCache().find({ queryKey: key2 })).toBeDefined()
    expect(
      queryClient.getQueryCache().find({ queryKey: key2 })?.options.gcTime,
    ).toBe(2000)
  })
})
