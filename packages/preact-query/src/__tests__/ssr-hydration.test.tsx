import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'preact-render-to-string'
import { hydrate as preactHydrate, VNode } from 'preact'
import { act } from 'react'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  useQuery,
} from '..'
import { setIsServer } from './utils'

const ReactHydrate = (element: VNode, container: Element) => {
  let root: any
  act(() => {
    root = preactHydrate(element, container)
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
    const markup = renderToString(
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
    const markup = renderToString(
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
    const markup = renderToString(
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
})
