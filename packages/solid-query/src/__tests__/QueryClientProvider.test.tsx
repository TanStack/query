import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { QueryCache } from '@tanstack/query-core'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { Loading } from 'solid-js'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '..'

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
        <Loading>
          <Page />
        </Loading>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.state.data).toBe('test')
  })

  it('should allow multiple caches to be partitioned', async () => {
    const key1 = createKey()
    const key2 = createKey()

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
          <Loading>
            <Page1 />
          </Loading>
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Loading>
            <Page2 />
          </Loading>
        </QueryClientProvider>
      </>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test1')).toBeInTheDocument()
    expect(rendered.getByText('test2')).toBeInTheDocument()

    expect(queryCache1.find({ queryKey: key1 })?.state.data).toBe('test1')
    expect(queryCache1.find({ queryKey: key2 })).toBeUndefined()
    expect(queryCache2.find({ queryKey: key1 })).toBeUndefined()
    expect(queryCache2.find({ queryKey: key2 })?.state.data).toBe('test2')
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
        <Loading>
          <Page />
        </Loading>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.options.gcTime).toBe(Infinity)
  })

  describe('useQueryClient', () => {
    it('should throw an error if no query client has been set', () => {
      vi.spyOn(console, 'error').mockReturnValue(undefined)

      function Page() {
        useQueryClient()
        return null
      }

      expect(() => render(() => <Page />)).toThrow(
        'No QueryClient set, use QueryClientProvider to set one',
      )
    })
  })

  it('should not throw an error if user provides custom query client', () => {
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)

    function Page() {
      const client = new QueryClient()
      useQueryClient(client)
      return null
    }

    render(() => <Page />)

    expect(consoleErrorMock).not.toHaveBeenCalled()
  })
})
