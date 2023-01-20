import { render, screen, waitFor } from 'solid-testing-library'
import { queryKey } from './utils'

import { QueryCache, QueryClient } from '@tanstack/query-core'
import { createContext } from 'solid-js'
import { createQuery, QueryClientProvider, useQueryClient } from '..'
import { createQueryClient, sleep } from './utils'

describe('QueryClientProvider', () => {
  it('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    function Page() {
      const query = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => {
      return screen.getByText('test')
    })

    expect(queryCache.find({ queryKey: key })).toBeDefined()
  })

  it('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryCache1 = new QueryCache()
    const queryCache2 = new QueryCache()

    const queryClient1 = createQueryClient({ queryCache: queryCache1 })
    const queryClient2 = createQueryClient({ queryCache: queryCache2 })

    function Page1() {
      const query = createQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 'test1'
        },
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }
    function Page2() {
      const query = createQuery(() => ({
        queryKey: key2,
        queryFn: async () => {
          await sleep(10)
          return 'test2'
        },
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }

    render(() => (
      <>
        <QueryClientProvider client={queryClient1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Page2 />
        </QueryClientProvider>
      </>
    ))

    await waitFor(() => screen.getByText('test1'))
    await waitFor(() => screen.getByText('test2'))

    expect(queryCache1.find({ queryKey: key1 })).toBeDefined()
    expect(queryCache1.find({ queryKey: key2 })).not.toBeDefined()
    expect(queryCache2.find({ queryKey: key1 })).not.toBeDefined()
    expect(queryCache2.find({ queryKey: key2 })).toBeDefined()
  })

  it("uses defaultOptions for queries when they don't provide their own config", async () => {
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
      const query = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))

      return (
        <div>
          <h1>{query.data}</h1>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('test'))

    expect(queryCache.find({ queryKey: key })).toBeDefined()
    expect(queryCache.find({ queryKey: key })?.options.gcTime).toBe(Infinity)
  })

  describe('with custom context', () => {
    it('uses the correct context', async () => {
      const key = queryKey()

      const contextOuter = createContext<QueryClient | undefined>(undefined)
      const contextInner = createContext<QueryClient | undefined>(undefined)

      const queryCacheOuter = new QueryCache()
      const queryClientOuter = new QueryClient({ queryCache: queryCacheOuter })

      const queryCacheInner = new QueryCache()
      const queryClientInner = new QueryClient({ queryCache: queryCacheInner })

      const queryCacheInnerInner = new QueryCache()
      const queryClientInnerInner = new QueryClient({
        queryCache: queryCacheInnerInner,
      })

      function Page() {
        const queryOuter = createQuery(() => ({
          queryKey: key,
          queryFn: async () => 'testOuter',
          context: contextOuter,
        }))
        const queryInner = createQuery(() => ({
          queryKey: key,
          queryFn: async () => 'testInner',
          context: contextInner,
        }))
        const queryInnerInner = createQuery(() => ({
          queryKey: key,
          queryFn: async () => 'testInnerInner',
        }))

        return (
          <div>
            <h1>
              {queryOuter.data} {queryInner.data} {queryInnerInner.data}
            </h1>
          </div>
        )
      }

      render(() => (
        <QueryClientProvider client={queryClientOuter} context={contextOuter}>
          <QueryClientProvider client={queryClientInner} context={contextInner}>
            <QueryClientProvider client={queryClientInnerInner}>
              <Page />
            </QueryClientProvider>
          </QueryClientProvider>
        </QueryClientProvider>
      ))

      await waitFor(() =>
        screen.getByText('testOuter testInner testInnerInner'),
      )
    })
  })

  describe('useQueryClient', () => {
    it('should throw an error if no query client has been set', () => {
      const consoleMock = jest
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
})
