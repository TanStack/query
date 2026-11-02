import { createKey } from '@tanstack/query-test-utils'
import { act } from '@testing-library/preact'
import { hydrate as preactHydrate, render } from 'preact'
import { renderToString } from 'preact-render-to-string'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  noop,
  useQuery,
  HydrationBoundary,
} from '..'
import { setIsServer } from './utils'
import type { VNode } from 'preact'

const PreactHydrate = (element: VNode, container: Element) => {
  act(() => {
    preactHydrate(element, container)
  })
  // To unmount in Preact, you render null into the same container
  return () => {
    act(() => {
      render(null, container)
    })
  }
}

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await vi.advanceTimersByTimeAsync(ms || 1)
  return value
}

function PrintStateComponent({ componentName, result }: any): any {
  return `${componentName} - status:${result.status} fetching:${result.isFetching} data:${result.data}`
}

describe('Server side rendering with getServerSnapshot fix (Preact)', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should not mismatch on prefetched query with isLoading check', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error')
    consoleErrorMock.mockReturnValue(undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(fetchData)
    const key = createKey()

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery({
        queryKey: key,
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
    await prefetchClient
      .query({
        queryKey: key,
        queryFn: () => fetchDataSuccess('success'),
      })
      .catch(noop)
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({
      queryCache: renderCache,
    })
    hydrate(renderClient, dehydratedStateServer)
    
    // Render with HydrationBoundary (which provides getServerSnapshot)
    const markup = renderToString(
      <QueryClientProvider client={renderClient}>
        <HydrationBoundary state={dehydratedStateServer}>
          <SuccessComponent />
        </HydrationBoundary>
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup = 'SuccessComponent - status:success fetching:false data:success!'

    expect(markup).toBe(expectedMarkup)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = PreactHydrate(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={JSON.parse(stringifiedState)}>
          <SuccessComponent />
        </HydrationBoundary>
      </QueryClientProvider>,
      el,
    )

    // Check that we have no hydration mismatches
    expect(consoleErrorMock).toHaveBeenCalledTimes(0)

    expect(fetchDataSuccess).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)

    unmount()
    queryClient.clear()
  })

  it('should not mismatch when prefetched data resolves before client render', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error')
    consoleErrorMock.mockReturnValue(undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(async (value) => {
      await vi.advanceTimersByTimeAsync(50)
      return value
    })
    const key = createKey()

    // -- Shared part --
    function LoadingComponent() {
      const result = useQuery({
        queryKey: key,
        queryFn: () => fetchDataSuccess('success!'),
      })
      return (
        <PrintStateComponent componentName="LoadingComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchCache = new QueryCache()
    const prefetchClient = new QueryClient({
      queryCache: prefetchCache,
    })
    // Prefetch takes time but resolves before server render completes
    const prefetchPromise = prefetchClient
      .query({
        queryKey: key,
        queryFn: () => fetchDataSuccess('success'),
      })
      .catch(noop)
    
    await vi.advanceTimersByTimeAsync(100)
    await prefetchPromise

    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({
      queryCache: renderCache,
    })
    hydrate(renderClient, dehydratedStateServer)
    
    const markup = renderToString(
      <QueryClientProvider client={renderClient}>
        <HydrationBoundary state={dehydratedStateServer}>
          <LoadingComponent />
        </HydrationBoundary>
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    // Server should render success (not pending) because prefetch resolved
    const expectedServerMarkup = 'LoadingComponent - status:success fetching:false data:success'

    expect(markup).toBe(expectedServerMarkup)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = PreactHydrate(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={JSON.parse(stringifiedState)}>
          <LoadingComponent />
        </HydrationBoundary>
      </QueryClientProvider>,
      el,
    )

    // Check that we have no hydration mismatches
    expect(consoleErrorMock).toHaveBeenCalledTimes(0)

    // Client should NOT refetch since data is already hydrated
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(expectedServerMarkup)

    unmount()
    queryClient.clear()
  })

  it('should handle nested HydrationBoundary correctly', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error')
    consoleErrorMock.mockReturnValue(undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(fetchData)
    const key1 = createKey()
    const key2 = createKey()

    function NestedComponent() {
      const result1 = useQuery({
        queryKey: key1,
        queryFn: () => fetchDataSuccess('data1'),
      })
      const result2 = useQuery({
        queryKey: key2,
        queryFn: () => fetchDataSuccess('data2'),
      })
      return (
        <div>
          <PrintStateComponent componentName="Query1" result={result1} />
          <PrintStateComponent componentName="Query2" result={result2} />
        </div>
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchCache = new QueryCache()
    const prefetchClient = new QueryClient({
      queryCache: prefetchCache,
    })
    await prefetchClient
      .query({
        queryKey: key1,
        queryFn: () => fetchDataSuccess('data1'),
      })
      .catch(noop)
    await prefetchClient
      .query({
        queryKey: key2,
        queryFn: () => fetchDataSuccess('data2'),
      })
      .catch(noop)
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({
      queryCache: renderCache,
    })
    hydrate(renderClient, dehydratedStateServer)
    
    const markup = renderToString(
      <QueryClientProvider client={renderClient}>
        <HydrationBoundary state={dehydratedStateServer}>
          <HydrationBoundary state={dehydratedStateServer}>
            <NestedComponent />
          </HydrationBoundary>
        </HydrationBoundary>
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = PreactHydrate(
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={JSON.parse(stringifiedState)}>
          <HydrationBoundary state={JSON.parse(stringifiedState)}>
            <NestedComponent />
          </HydrationBoundary>
        </HydrationBoundary>
      </QueryClientProvider>,
      el,
    )

    // Check that we have no hydration mismatches
    expect(consoleErrorMock).toHaveBeenCalledTimes(0)

    unmount()
    queryClient.clear()
  })
})