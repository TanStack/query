import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryCache } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { createMemo, createRoot } from 'solid-js'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '..'
import { useQueryClientResolver } from '../QueryClientProvider'

describe('QueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })).toBeDefined()
  })

  it('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryCache1 = new QueryCache()
    const queryCache2 = new QueryCache()

    const queryClient1 = new QueryClient({ queryCache: queryCache1 })
    const queryClient2 = new QueryClient({ queryCache: queryCache2 })

    function Page1() {
      const query = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'test1'),
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }
    function Page2() {
      const query = useQuery(() => ({
        queryKey: key2,
        queryFn: () => sleep(10).then(() => 'test2'),
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <>
        <QueryClientProvider client={queryClient1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Page2 />
        </QueryClientProvider>
      </>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test1')).toBeInTheDocument()
    expect(rendered.getByText('test2')).toBeInTheDocument()

    expect(queryCache1.find({ queryKey: key1 })).toBeDefined()
    expect(queryCache1.find({ queryKey: key2 })).not.toBeDefined()
    expect(queryCache2.find({ queryKey: key1 })).not.toBeDefined()
    expect(queryCache2.find({ queryKey: key2 })).toBeDefined()
  })

  it("uses defaultOptions for queries when they don't provide their own config", async () => {
    const key = queryKey()

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
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })).toBeDefined()
    expect(queryCache.find({ queryKey: key })?.options.gcTime).toBe(Infinity)
  })

  describe('useQueryClient', () => {
    it('should throw an error if no query client has been set', () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      function Page() {
        useQueryClient()
        return null
      }

      expect(() => render(() => <Page />)).toThrow(
        'No QueryClient set, use QueryClientProvider to set one',
      )

      consoleMock.mockRestore()
    })
  })

  it('should not throw an error if user provides custom query client', () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const client = new QueryClient()
      useQueryClient(client)
      return null
    }

    render(() => <Page />)
    expect(consoleMock).not.toHaveBeenCalled()

    consoleMock.mockRestore()
  })

  it('creates a query client resolver that is safe to call in reactive callbacks', () => {
    const queryClient = new QueryClient()
    let resolveClient!: () => QueryClient

    function Page() {
      resolveClient = useQueryClientResolver()
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    createRoot((dispose) => {
      const client = createMemo(() => resolveClient())

      expect(client()).toBe(queryClient)
      dispose()
    })
  })

  it('defers missing provider errors until a resolver is called', () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    let resolveClient!: () => QueryClient

    function Page() {
      resolveClient = useQueryClientResolver()
      return null
    }

    expect(() => render(() => <Page />)).not.toThrow()

    expect(() =>
      createRoot((dispose) => {
        const client = createMemo(() => resolveClient())
        client()
        dispose()
      }),
    ).toThrow('No QueryClient set, use QueryClientProvider to set one')

    consoleMock.mockRestore()
  })
})
