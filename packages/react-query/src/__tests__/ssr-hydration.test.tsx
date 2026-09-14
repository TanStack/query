import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { hydrateRoot } from 'react-dom/client'
import { act } from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { queryKey } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  noop,
  useQuery,
} from '..'
import { setIsServer } from './utils'

const ReactHydrate = (
  element: React.ReactElement,
  container: Element,
  options?: { onRecoverableError?: (error: unknown) => void },
) => {
  let root: any
  act(() => {
    root = hydrateRoot(container, element, options)
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
    const key = queryKey()

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
    const key = queryKey()

    // -- Shared part --
    function ErrorComponent() {
      const result = useQuery({
        queryKey: key,
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
    await prefetchClient
      .query({
        queryKey: key,
        queryFn: () => fetchDataError(),
      })
      .catch(noop)
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
    const key = queryKey()

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

  it('should not mismatch when a pending prefetched query resolves before client hydration', async () => {
    const key = queryKey()

    let resolveQuery!: (value: string) => void
    const pendingQuery = new Promise<string>((resolve) => {
      resolveQuery = resolve
    })
    const queryFn = vi.fn(() => pendingQuery)
    const renderedStates: Array<string> = []

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery({
        queryKey: key,
        queryFn,
      })
      const rendered = `SuccessComponent - status:${result.status} fetching:${result.isFetching} data:${result.data}`
      renderedStates.push(rendered)
      return rendered
    }

    // -- Server part --
    setIsServer(true)

    const prefetchClient = new QueryClient()
    // Prefetch without awaiting: the query is dehydrated while still pending.
    prefetchClient.prefetchQuery({ queryKey: key, queryFn }).catch(noop)
    // Let the retryer start so the pending promise is part of the dehydrated state.
    await vi.advanceTimersByTimeAsync(1)
    const dehydratedStateServer = dehydrate(prefetchClient, {
      shouldDehydrateQuery: () => true,
    })
    expect(dehydratedStateServer.queries[0]?.promise).toBeDefined()

    const renderCache = new QueryCache()
    const renderClient = new QueryClient({ queryCache: renderCache })
    hydrate(renderClient, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>,
    )
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:pending fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    renderedStates.length = 0
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    // Pass the dehydrated promise through (not JSON-serializable) to mimic a
    // framework streaming the pending query's promise to the browser.
    hydrate(queryClient, dehydratedStateServer)

    // The streamed promise resolves before React hydrates, so the live cache is
    // already successful while the server markup shows the pending state.
    resolveQuery('success!')
    await vi.advanceTimersByTimeAsync(1)

    expect(queryClient.getQueryData(key)).toBe('success!')

    const onRecoverableError = vi.fn()
    const unmount = ReactHydrate(
      <QueryClientProvider
        client={queryClient}
        serverSnapshot={dehydratedStateServer}
      >
        <SuccessComponent />
      </QueryClientProvider>,
      el,
      { onRecoverableError },
    )

    // Hydration must not report a mismatch, and the first client render must
    // replay the frozen server snapshot (pending) even though the live cache is
    // already successful.
    expect(onRecoverableError).toHaveBeenCalledTimes(0)
    expect(renderedStates[0]).toBe(expectedMarkup)

    await vi.advanceTimersByTimeAsync(50)
    expect(renderedStates.at(-1)).toBe(
      'SuccessComponent - status:success fetching:false data:success!',
    )
    expect(el.innerHTML).toBe(
      'SuccessComponent - status:success fetching:false data:success!',
    )

    unmount()
    queryClient.clear()
  })

  // Adapted from the reproduction in
  // https://github.com/TanStack/query/issues/9399#issuecomment-4323008704 — the streamed promise
  // is simulated with a synchronously-resolvable thenable, so the client's `hydrate` resolves it
  // via `tryResolveSync` during the first render.
  it('should not mismatch on a query whose streamed promise is synchronously resolved by hydrate', async () => {
    const key = queryKey()
    const renderedStates: Array<string> = []

    function SuccessComponent() {
      const result = useQuery({
        queryKey: key,
        queryFn: () => Promise.resolve('success!'),
      })
      const rendered = `SuccessComponent - status:${result.status} fetching:${result.isFetching} data:${result.data}`
      renderedStates.push(rendered)
      return rendered
    }

    // -- Server --
    setIsServer(true)
    const prefetchClient = new QueryClient({
      defaultOptions: { dehydrate: { shouldDehydrateQuery: () => true } },
    })
    let resolvePrefetch: ((value: string) => void) | undefined
    const prefetchPromise = new Promise<string>((resolve) => {
      resolvePrefetch = resolve
    })
    void prefetchClient.prefetchQuery({
      queryKey: key,
      queryFn: () => prefetchPromise,
    })

    const dehydrated = dehydrate(prefetchClient)
    expect(dehydrated.queries[0]?.state.status).toBe('pending')

    const renderClient = new QueryClient()
    hydrate(renderClient, dehydrated)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>,
    )
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:pending fetching:true data:undefined'
    expect(markup).toBe(expectedMarkup)

    // The promise resolves *between* SSR and client hydration (streamed value arrives).
    resolvePrefetch?.('success!')
    const promiseRef = dehydrated.queries[0]?.promise
    if (promiseRef) {
      // Synchronously-resolvable thenable, mirroring a streamed React promise.
      // @ts-expect-error deliberately replacing the native `then` so it resolves synchronously
      promiseRef.then = (cb?: (value: unknown) => unknown) => {
        cb?.('success!')
        return promiseRef
      }
    }

    // -- Client --
    renderedStates.length = 0
    const el = document.createElement('div')
    el.innerHTML = markup
    const queryClient = new QueryClient()
    hydrate(queryClient, dehydrated)

    expect(queryClient.getQueryData(key)).toBe('success!')

    const onRecoverableError = vi.fn()
    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient} serverSnapshot={dehydrated}>
        <SuccessComponent />
      </QueryClientProvider>,
      el,
      { onRecoverableError },
    )

    // No mismatch, and the first client render replays the pending server snapshot even though
    // `hydrate` resolved the streamed promise synchronously.
    expect(onRecoverableError).toHaveBeenCalledTimes(0)
    expect(renderedStates[0]).toBe(expectedMarkup)

    await vi.advanceTimersByTimeAsync(50)
    expect(renderedStates.at(-1)).toBe(
      'SuccessComponent - status:success fetching:false data:success!',
    )
    expect(el.innerHTML).toBe(
      'SuccessComponent - status:success fetching:false data:success!',
    )

    unmount()
    queryClient.clear()
  })
})
