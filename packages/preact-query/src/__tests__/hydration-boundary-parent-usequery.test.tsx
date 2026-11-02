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
  useSuspenseQuery,
  HydrationBoundary,
} from '..'
import { setIsServer } from './utils'
import type { VNode } from 'preact'

const PreactHydrate = (element: VNode, container: Element) => {
  act(() => {
    preactHydrate(element, container)
  })
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

describe('HydrationBoundary with parent useQuery (fixes #10145) - Preact', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should hydrate prefetched query even when parent useQuery with same key exists', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error')
    consoleErrorMock.mockReturnValue(undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(fetchData)
    const key = createKey()

    // -- Shared part --
    function ParentComponent() {
      // Parent useQuery - creates query on server but doesn't fetch
      const result = useQuery({
        queryKey: key,
        queryFn: () => fetchDataSuccess('parent'),
        enabled: true,
      })
      return (
        <div>
          <PrintStateComponent componentName="ParentComponent" result={result} />
        </div>
      )
    }

    function ChildComponent() {
      // Child useSuspenseQuery - should get hydrated data
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: () => fetchDataSuccess('child'),
      })
      return (
        <PrintStateComponent componentName="ChildComponent" result={result} />
      )
    }

    function Page() {
      return (
        <>
          <ParentComponent />
          <HydrationBoundary state={dehydratedStateServer}>
            <ChildComponent />
          </HydrationBoundary>
        </>
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
        queryFn: () => fetchDataSuccess('prefetched'),
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
        <Page />
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    // Server should show parent as pending (no data) and child as success (hydrated)
    expect(markup).toContain('ParentComponent - status:pending fetching:true data:undefined')
    expect(markup).toContain('ChildComponent - status:success fetching:false data:prefetched')

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = PreactHydrate(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
      el,
    )

    // Check that we have no hydration mismatches
    expect(consoleErrorMock).toHaveBeenCalledTimes(0)

    // Parent should eventually fetch, child should keep hydrated data
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)

    unmount()
    queryClient.clear()
  })

  it('should NOT skip hydration when parent useQuery is not enabled', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error')
    consoleErrorMock.mockReturnValue(undefined)

    const fetchDataSuccess = vi.fn<typeof fetchData>(fetchData)
    const key = createKey()

    function ParentComponent() {
      const result = useQuery({
        queryKey: key,
        queryFn: () => fetchDataSuccess('parent'),
        enabled: false, // Not enabled - shouldn't create query
      })
      return (
        <PrintStateComponent componentName="ParentComponent" result={result} />
      )
    }

    function ChildComponent() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: () => fetchDataSuccess('child'),
      })
      return (
        <PrintStateComponent componentName="ChildComponent" result={result} />
      )
    }

    function Page() {
      return (
        <>
          <ParentComponent />
          <HydrationBoundary state={dehydratedStateServer}>
            <ChildComponent />
          </HydrationBoundary>
        </>
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
        queryFn: () => fetchDataSuccess('prefetched'),
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
        <Page />
      </QueryClientProvider>,
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    // Server should show child as success (hydrated) since parent is disabled
    expect(markup).toContain('ChildComponent - status:success fetching:false data:prefetched')

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = PreactHydrate(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
      el,
    )

    // Check that we have no hydration mismatches
    expect(consoleErrorMock).toHaveBeenCalledTimes(0)

    unmount()
    queryClient.clear()
  })
})