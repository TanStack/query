import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { hydrateRoot } from 'react-dom/client'
import { act } from 'react'
import * as ReactDOMServer from 'react-dom/server'
import {
  InfiniteQueryObserver,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  useQuery,
} from '..'
import { setIsServer } from './utils'

const ReactHydrate = (element: React.ReactElement, container: Element) => {
  let root: any
  act(() => {
    root = hydrateRoot(container, element)
  })
  return () => {
    root.unmount()
  }
}

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await vi.advanceTimersByTimeAsync(ms || 1)
  return value
}

function PrintStateComponent({ componentName, result }: any): any {
  return `${componentName} - status:${result.status} fetching:${result.isFetching} data:${result.data}`
}

describe('Server side rendering with de/rehydration', () => {
  let previousIsReactActEnvironment: unknown
  beforeAll(() => {
    // @ts-expect-error we expect IS_REACT_ACT_ENVIRONMENT to exist
    previousIsReactActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
  })

  afterAll(() => {
    // @ts-expect-error we expect IS_REACT_ACT_ENVIRONMENT to exist
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousIsReactActEnvironment
    vi.useRealTimers()
  })

  it('should not mismatch on success', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery({
        queryKey: ['success'],
        queryFn: () => fetchDataSuccess('success!'),
      })
      return (
        <PrintStateComponent componentName="SuccessComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchCache = new QueryCache()
    const prefetchClient = new QueryClient({
      queryCache: prefetchCache,
    })
    await prefetchClient.prefetchQuery({
      queryKey: ['success'],
      queryFn: () => fetchDataSuccess('success'),
    })
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({
      queryCache: renderCache,
    })
    hydrate(renderClient, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:success fetching:true data:success'

    expect(markup).toBe(expectedMarkup)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <SuccessComponent />
      </QueryClientProvider>,
      el,
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).toHaveBeenCalledTimes(0)

    expect(fetchDataSuccess).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)

    unmount()
    queryClient.clear()
    consoleMock.mockRestore()
  })

  it('should not mismatch on error', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const fetchDataError = vi.fn(() => {
      throw new Error('fetchDataError')
    })

    // -- Shared part --
    function ErrorComponent() {
      const result = useQuery({
        queryKey: ['error'],
        queryFn: () => fetchDataError(),
        retry: false,
      })
      return (
        <PrintStateComponent componentName="ErrorComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)
    const prefetchCache = new QueryCache()
    const prefetchClient = new QueryClient({
      queryCache: prefetchCache,
    })
    await prefetchClient.prefetchQuery({
      queryKey: ['error'],
      queryFn: () => fetchDataError(),
    })
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({
      queryCache: renderCache,
    })
    hydrate(renderClient, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <ErrorComponent />
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      'ErrorComponent - status:pending fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <ErrorComponent />
      </QueryClientProvider>,
      el,
    )

    expect(consoleMock).toHaveBeenCalledTimes(0)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)
    await vi.advanceTimersByTimeAsync(50)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(
      'ErrorComponent - status:error fetching:false data:undefined',
    )

    unmount()
    queryClient.clear()
    consoleMock.mockRestore()
  })

  it('should not mismatch on queries that were not prefetched', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery({
        queryKey: ['success'],
        queryFn: () => fetchDataSuccess('success!'),
      })
      return (
        <PrintStateComponent componentName="SuccessComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchClient = new QueryClient()
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderClient = new QueryClient()
    hydrate(renderClient, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:pending fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <SuccessComponent />
      </QueryClientProvider>,
      el,
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).toHaveBeenCalledTimes(0)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(expectedMarkup)
    await vi.advanceTimersByTimeAsync(50)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(
      'SuccessComponent - status:success fetching:false data:success!',
    )

    unmount()
    queryClient.clear()
    consoleMock.mockRestore()
  })

  it('should handle failed SSR infinite query without data corruption', async () => {
    const serverClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    await serverClient
      .prefetchInfiniteQuery({
        queryKey: ['posts'],
        queryFn: () => {
          throw new Error('Network error')
        },
        initialPageParam: 1,
        getNextPageParam: (_lastPage: any, allPages: any) =>
          allPages.length + 1,
        retry: false,
      })
      .catch(() => {})

    const dehydrated = dehydrate(serverClient)

    const clientQueryClient = new QueryClient()
    hydrate(clientQueryClient, dehydrated)

    const observer = new InfiniteQueryObserver(clientQueryClient, {
      queryKey: ['posts'],
      queryFn: ({ pageParam = 1 }) => {
        return Promise.resolve({
          posts: [`Post ${pageParam}-1`, `Post ${pageParam}-2`],
          nextCursor: pageParam + 1,
        })
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      retry: 1,
    })

    const initialResult = observer.getCurrentResult()

    expect(() => {
      const pageCount = initialResult.data?.pages?.length ?? 0
      console.log('Initial page count:', pageCount)
    }).not.toThrow()

    await observer.refetch()
    const afterRefetch = observer.getCurrentResult()

    expect(afterRefetch.data).toBeDefined()
    expect(afterRefetch.data?.pages).toBeDefined()
    expect(afterRefetch.data?.pages).toHaveLength(1)
    expect(afterRefetch.data?.pageParams).toHaveLength(1)

    await observer.fetchNextPage()
    const afterNextPage = observer.getCurrentResult()

    expect(afterNextPage.data?.pages).toHaveLength(2)
    expect(afterNextPage.data?.pages[1]).toEqual({
      posts: ['Post 2-1', 'Post 2-2'],
      nextCursor: 3,
    })
  })

  it('should handle race conditions between hydration and observer', async () => {
    const serverClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    await Promise.all([
      serverClient
        .prefetchInfiniteQuery({
          queryKey: ['posts', 'user1'],
          queryFn: () => Promise.reject(new Error('Failed')),
          initialPageParam: 0,
          getNextPageParam: () => 1,
          retry: false,
        })
        .catch(() => {}),
      serverClient
        .prefetchInfiniteQuery({
          queryKey: ['posts', 'user2'],
          queryFn: () => Promise.reject(new Error('Failed')),
          initialPageParam: 0,
          getNextPageParam: () => 1,
          retry: false,
        })
        .catch(() => {}),
    ])

    const dehydrated = dehydrate(serverClient)
    const clientQueryClient = new QueryClient()
    hydrate(clientQueryClient, dehydrated)

    const observer1 = new InfiniteQueryObserver(clientQueryClient, {
      queryKey: ['posts', 'user1'],
      queryFn: ({ pageParam = 0 }) =>
        Promise.resolve({ data: `user1-${pageParam}` }),
      initialPageParam: 0,
      getNextPageParam: () => 1,
    })

    const observer2 = new InfiniteQueryObserver(clientQueryClient, {
      queryKey: ['posts', 'user2'],
      queryFn: ({ pageParam = 0 }) =>
        Promise.resolve({ data: `user2-${pageParam}` }),
      initialPageParam: 0,
      getNextPageParam: () => 1,
    })

    const [result1, result2] = await Promise.all([
      observer1.refetch(),
      observer2.refetch(),
    ])

    expect(result1.data?.pages).toBeDefined()
    expect(result2.data?.pages).toBeDefined()
    expect(result1.data?.pages[0]).toEqual({ data: 'user1-0' })
    expect(result2.data?.pages[0]).toEqual({ data: 'user2-0' })
  })

  it('should handle regular query (non-infinite) after hydration', async () => {
    const serverClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    await serverClient
      .prefetchQuery({
        queryKey: ['regular'],
        queryFn: () => Promise.reject(new Error('Failed')),
        retry: false,
      })
      .catch(() => {})

    const dehydrated = dehydrate(serverClient)
    const clientQueryClient = new QueryClient()
    hydrate(clientQueryClient, dehydrated)

    const query = clientQueryClient
      .getQueryCache()
      .find({ queryKey: ['regular'] })
    expect((query as any)?.__isInfiniteQuery).toBeUndefined()
  })

  it('should handle mixed queries (infinite + regular) in same hydration', async () => {
    const serverClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    await Promise.all([
      serverClient
        .prefetchInfiniteQuery({
          queryKey: ['infinite'],
          queryFn: () => Promise.reject(new Error('Failed')),
          initialPageParam: 0,
          getNextPageParam: () => 1,
          retry: false,
        })
        .catch(() => {}),
      serverClient
        .prefetchQuery({
          queryKey: ['regular'],
          queryFn: () => Promise.reject(new Error('Failed')),
          retry: false,
        })
        .catch(() => {}),
    ])

    const dehydrated = dehydrate(serverClient)
    const clientQueryClient = new QueryClient()
    hydrate(clientQueryClient, dehydrated)

    const infiniteObserver = new InfiniteQueryObserver(clientQueryClient, {
      queryKey: ['infinite'],
      queryFn: () => Promise.resolve({ data: 'infinite' }),
      initialPageParam: 0,
      getNextPageParam: () => 1,
    })

    const regularPromise = clientQueryClient.fetchQuery({
      queryKey: ['regular'],
      queryFn: () => Promise.resolve('regular'),
    })

    const [infiniteResult, regularResult] = await Promise.all([
      infiniteObserver.refetch(),
      regularPromise,
    ])

    expect(infiniteResult.data?.pages).toBeDefined()
    expect(regularResult).toBe('regular')
  })

  it('should handle successful hydrated infinite query (no failure)', async () => {
    const serverClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    await serverClient.prefetchInfiniteQuery({
      queryKey: ['success'],
      queryFn: ({ pageParam = 0 }) =>
        Promise.resolve({
          data: `page-${pageParam}`,
          next: pageParam + 1,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage: any) => lastPage.next,
    })

    const dehydrated = dehydrate(serverClient)
    const clientQueryClient = new QueryClient()
    hydrate(clientQueryClient, dehydrated)

    const observer = new InfiniteQueryObserver(clientQueryClient, {
      queryKey: ['success'],
      queryFn: ({ pageParam = 0 }) =>
        Promise.resolve({
          data: `page-${pageParam}`,
          next: pageParam + 1,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.next,
    })

    const result = observer.getCurrentResult()

    expect(result.data?.pages).toHaveLength(1)
    expect(result.data?.pages[0]).toEqual({ data: 'page-0', next: 1 })
  })
})
