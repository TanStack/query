import React from 'react'
import ReactDOM, { Root } from 'react-dom'
import ReactDOMTestUtils from 'react-dom/test-utils'
import ReactDOMServer from 'react-dom/server'
// eslint-disable-next-line import/no-unresolved -- types only for module augmentation
import type {} from 'react-dom/next'

import {
  useQuery,
  QueryClient,
  QueryClientProvider,
  QueryCache,
  dehydrate,
  hydrate,
} from '../..'
import * as utils from '../../core/utils'
import { mockConsoleError, sleep } from './utils'

// This monkey-patches the isServer-value from utils,
// so that we can pretend to be in a server environment
function setIsServer(isServer: boolean) {
  // @ts-ignore
  utils.isServer = isServer
}

const ReactHydrate = (element: React.ReactElement, container: Element) => {
  // @ts-expect-error
  if (String(process.env.REACTJS_VERSION || '18') === '18') {
    let root: Root
    ReactDOMTestUtils.act(() => {
      root = ReactDOM.hydrateRoot(container, element)
    })
    return () => {
      root?.unmount()
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
    const fetchDataSuccess = jest.fn(fetchData)

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
    const prefetchClient = new QueryClient({ queryCache: prefetchCache })
    await prefetchClient.prefetchQuery(['success'], () =>
      fetchDataSuccess('success')
    )
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({ queryCache: renderCache })
    hydrate(renderClient, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:success fetching:true data:success'

    expect(markup).toBe(expectedMarkup)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)

    // -- Client part --
    const consoleMock = mockConsoleError()
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <SuccessComponent />
      </QueryClientProvider>,
      el
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)

    unmount()
    consoleMock.mockRestore()
    queryClient.clear()
  })

  it('should not mismatch on error', async () => {
    const consoleMock = mockConsoleError()
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
    const prefetchClient = new QueryClient({ queryCache: prefetchCache })
    await prefetchClient.prefetchQuery(['error'], () => fetchDataError())
    const dehydratedStateServer = dehydrate(prefetchClient)
    const renderCache = new QueryCache()
    const renderClient = new QueryClient({ queryCache: renderCache })
    hydrate(renderClient, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <ErrorComponent />
      </QueryClientProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      '<!-- -->ErrorComponent - status:loading fetching:true data:undefined'

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
      el
    )

    // We expect exactly one console.error here, which is from the
    expect(consoleMock).toHaveBeenCalledTimes(1)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(expectedMarkup)
    await sleep(50)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(
      '<!-- -->ErrorComponent - status:error fetching:false data:undefined'
    )

    unmount()
    consoleMock.mockRestore()
    queryClient.clear()
  })

  it('should not mismatch on queries that were not prefetched', async () => {
    const fetchDataSuccess = jest.fn(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery(['success'], () => fetchDataSuccess('success!'))
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
      </QueryClientProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderClient.clear()
    setIsServer(false)

    const expectedMarkup =
      '<!-- -->SuccessComponent - status:loading fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const consoleMock = mockConsoleError()
    const el = document.createElement('div')
    el.innerHTML = markup

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    hydrate(queryClient, JSON.parse(stringifiedState))

    const unmount = ReactHydrate(
      <QueryClientProvider client={queryClient}>
        <SuccessComponent />
      </QueryClientProvider>,
      el
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(expectedMarkup)
    await sleep(50)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(
      '<!-- -->SuccessComponent - status:success fetching:false data:success!'
    )

    unmount()
    consoleMock.mockRestore()
    queryClient.clear()
  })
})
