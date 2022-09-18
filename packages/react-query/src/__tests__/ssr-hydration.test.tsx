import * as React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMTestUtils from 'react-dom/test-utils'
import ReactDOMServer from 'react-dom/server'
// eslint-disable-next-line import/no-unresolved -- types only for module augmentation
import type {} from 'react-dom/next'

import {
  useQuery,
  QueryClientProvider,
  QueryCache,
  dehydrate,
  hydrate,
} from '..'
import { createQueryClient, mockLogger, setIsServer, sleep } from './utils'

const isReact18 = () => (process.env.REACTJS_VERSION || '18') === '18'

const ReactHydrate = (element: React.ReactElement, container: Element) => {
  if (isReact18()) {
    let root: any
    ReactDOMTestUtils.act(() => {
      // @ts-expect-error
      root = ReactDOM.hydrateRoot(container, element)
    })
    return () => {
      root.unmount()
    }
  }

  ReactDOM.hydrate(element, container)
  return () => {
    ReactDOM.unmountComponentAtNode(container)
  }
}

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 1)
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
  })

  afterAll(() => {
    // @ts-expect-error we expect IS_REACT_ACT_ENVIRONMENT to exist
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousIsReactActEnvironment
  })
  it('should not mismatch on success', async () => {
    if (!isReact18()) {
      return
    }
    const fetchDataSuccess = jest.fn<
      ReturnType<typeof fetchData>,
      Parameters<typeof fetchData>
    >(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery(['success'], () => fetchDataSuccess('success!'))
      return (
        <PrintStateComponent componentName="SuccessComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchCache = new QueryCache()
    const prefetchClient = createQueryClient({
      queryCache: prefetchCache,
    })
    await prefetchClient.prefetchQuery(['success'], () =>
      fetchDataSuccess('success'),
    )
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = createQueryClient({
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
    const queryClient = createQueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <SuccessComponent />
      </QueryClientProvider>,
      el,
    )

    // Check that we have no React hydration mismatches
    expect(mockLogger.error).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)

    unmount()
    queryClient.clear()
  })

  it('should not mismatch on error', async () => {
    if (!isReact18()) {
      return
    }
    const fetchDataError = jest.fn(() => {
      throw new Error('fetchDataError')
    })

    // -- Shared part --
    function ErrorComponent() {
      const result = useQuery(['error'], () => fetchDataError(), {
        retry: false,
      })
      return (
        <PrintStateComponent componentName="ErrorComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)
    const prefetchCache = new QueryCache()
    const prefetchClient = createQueryClient({
      queryCache: prefetchCache,
    })
    await prefetchClient.prefetchQuery(['error'], () => fetchDataError())
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = createQueryClient({
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
      'ErrorComponent - status:loading fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <ErrorComponent />
      </QueryClientProvider>,
      el,
    )

    // We expect exactly one console.error here, which is from the
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)
    await sleep(50)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(
      'ErrorComponent - status:error fetching:false data:undefined',
    )

    unmount()
    queryClient.clear()
  })

  it('should not mismatch on queries that were not prefetched', async () => {
    if (!isReact18()) {
      return
    }
    const fetchDataSuccess = jest.fn<
      ReturnType<typeof fetchData>,
      Parameters<typeof fetchData>
    >(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery(['success'], () => fetchDataSuccess('success!'))
      return (
        <PrintStateComponent componentName="SuccessComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchClient = createQueryClient()
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderClient = createQueryClient()
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
      'SuccessComponent - status:loading fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <SuccessComponent />
      </QueryClientProvider>,
      el,
    )

    // Check that we have no React hydration mismatches
    expect(mockLogger.error).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(expectedMarkup)
    await sleep(50)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(
      'SuccessComponent - status:success fetching:false data:success!',
    )

    unmount()
    queryClient.clear()
  })
})
