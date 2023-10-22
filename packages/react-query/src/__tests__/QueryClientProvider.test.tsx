import { describe, expect, test } from 'vitest'
import * as React from 'react'
import { render, waitFor } from '@testing-library/react'

import { vi } from 'vitest'
import { QueryCache, QueryClientProvider, useQuery, useQueryClient } from '..'
import { createQueryClient, queryKey, sleep } from './utils'

describe('QueryClientProvider', () => {
  test('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

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
        <Page />
      </QueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('test'))

    expect(queryCache.find({ queryKey: key })).toBeDefined()
  })

  test('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryCache1 = new QueryCache()
    const queryCache2 = new QueryCache()

    const queryClient1 = createQueryClient({ queryCache: queryCache1 })
    const queryClient2 = createQueryClient({ queryCache: queryCache2 })

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
      <>
        <QueryClientProvider client={queryClient1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Page2 />
        </QueryClientProvider>
      </>,
    )

    await waitFor(() => rendered.getByText('test1'))
    await waitFor(() => rendered.getByText('test2'))

    expect(queryCache1.find({ queryKey: key1 })).toBeDefined()
    expect(queryCache1.find({ queryKey: key2 })).not.toBeDefined()
    expect(queryCache2.find({ queryKey: key1 })).not.toBeDefined()
    expect(queryCache2.find({ queryKey: key2 })).toBeDefined()
  })

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
        <Page />
      </QueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('test'))

    expect(queryCache.find({ queryKey: key })).toBeDefined()
    expect(queryCache.find({ queryKey: key })?.options.gcTime).toBe(Infinity)
  })

  describe('useQueryClient', () => {
    test('should throw an error if no query client has been set', () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      function Page() {
        useQueryClient()
        return null
      }

      expect(() => render(<Page />)).toThrow(
        'No QueryClient set, use QueryClientProvider to set one',
      )

      consoleMock.mockRestore()
    })
  })
})
