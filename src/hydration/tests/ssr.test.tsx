import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import { waitFor } from '@testing-library/react'

import {
  useQuery,
  setConsole,
  QueryClient,
  QueryClientProvider,
  QueryCache,
} from '../..'
import { dehydrate, hydrate } from '../'
import * as utils from '../../core/utils'
import { sleep } from '../../react/tests/utils'

jest.useFakeTimers()

// This monkey-patches the isServer-value from utils,
// so that we can pretend to be in a server environment
function setIsServer(isServer: boolean) {
  // @ts-ignore
  utils.isServer = isServer
}

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 1)
  return value
}

function PrintStateComponent({
  componentName,
  isFetching,
  isError,
  data,
}: any): any {
  if (isFetching) {
    return `Loading ${componentName}`
  }

  if (isError) {
    return `Error ${componentName}`
  }

  return `Success ${componentName} - ${data}`
}

describe('Server side rendering with de/rehydration', () => {
  it('should not mismatch on success', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const fetchDataSuccess = jest.fn(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const { isFetching, isError, data } = useQuery('success', () =>
        fetchDataSuccess('success!')
      )
      return (
        <PrintStateComponent
          componentName="SuccessComponent"
          isFetching={isFetching}
          isError={isError}
          data={data}
        />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchCache = new QueryCache()
    const prefetchClient = new QueryClient({ cache: prefetchCache })
    const prefetchPromise = prefetchClient.prefetchQuery('success', () =>
      fetchDataSuccess('success')
    )
    jest.runOnlyPendingTimers()
    await prefetchPromise
    const dehydratedStateServer = dehydrate(prefetchCache)
    const renderCache = new QueryCache()
    hydrate(renderCache, dehydratedStateServer)
    const renderClient = new QueryClient({ cache: renderCache })
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    setIsServer(false)

    expect(markup).toBe('Success SuccessComponent - success')

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const cache = new QueryCache()
    hydrate(cache, JSON.parse(stringifiedState))
    const client = new QueryClient({ cache })

    ReactDOM.hydrate(
      <QueryClientProvider client={client}>
        <SuccessComponent />
      </QueryClientProvider>,
      el
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe('Success SuccessComponent - success')

    ReactDOM.unmountComponentAtNode(el)
    consoleMock.mockRestore()
  })

  it('should not mismatch on error', async () => {
    setConsole({
      log: console.log,
      warn: console.warn,
      error: () => undefined,
    })
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const fetchDataError = jest.fn(() => {
      throw new Error()
    })

    // -- Shared part --
    function ErrorComponent() {
      const { isFetching, isError, data } = useQuery('error', () =>
        fetchDataError()
      )
      return (
        <PrintStateComponent
          componentName="ErrorComponent"
          isFetching={isFetching}
          isError={isError}
          data={data}
        />
      )
    }

    // -- Server part --
    setIsServer(true)
    const prefetchCache = new QueryCache()
    const prefetchClient = new QueryClient({ cache: prefetchCache })
    const prefetchPromise = prefetchClient.prefetchQuery('error', () =>
      fetchDataError()
    )
    jest.runOnlyPendingTimers()
    await prefetchPromise
    const dehydratedStateServer = dehydrate(prefetchCache)
    const renderCache = new QueryCache()
    hydrate(renderCache, dehydratedStateServer)
    const renderClient = new QueryClient({ cache: renderCache })
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <ErrorComponent />
      </QueryClientProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    setIsServer(false)

    expect(markup).toBe('Loading ErrorComponent')

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const cache = new QueryCache()
    hydrate(cache, JSON.parse(stringifiedState))
    const client = new QueryClient({ cache })

    ReactDOM.hydrate(
      <QueryClientProvider client={client}>
        <ErrorComponent />
      </QueryClientProvider>,
      el
    )

    // We expect exactly one console.error here, which is from the
    expect(consoleMock).toHaveBeenCalledTimes(0)
    expect(fetchDataError).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe('Loading ErrorComponent')

    jest.runOnlyPendingTimers()

    expect(fetchDataError).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(el.innerHTML).toBe('Error ErrorComponent'))

    ReactDOM.unmountComponentAtNode(el)
    consoleMock.mockRestore()
    setConsole({
      log: console.log,
      warn: console.warn,
      error: console.error,
    })
  })

  it('should not mismatch on queries that were not prefetched', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const fetchDataSuccess = jest.fn(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const { isFetching, isError, data } = useQuery('success', () =>
        fetchDataSuccess('success!')
      )
      return (
        <PrintStateComponent
          componentName="SuccessComponent"
          isFetching={isFetching}
          isError={isError}
          data={data}
        />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchCache = new QueryCache()
    const dehydratedStateServer = dehydrate(prefetchCache)
    const renderCache = new QueryCache()
    hydrate(renderCache, dehydratedStateServer)
    const renderClient = new QueryClient({ cache: renderCache })
    const markup = ReactDOMServer.renderToString(
      <QueryClientProvider client={renderClient}>
        <SuccessComponent />
      </QueryClientProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    setIsServer(false)

    expect(markup).toBe('Loading SuccessComponent')

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const cache = new QueryCache()
    hydrate(cache, JSON.parse(stringifiedState))
    const client = new QueryClient({ cache })

    ReactDOM.hydrate(
      <QueryClientProvider client={client}>
        <SuccessComponent />
      </QueryClientProvider>,
      el
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(0)
    expect(el.innerHTML).toBe('Loading SuccessComponent')

    jest.runOnlyPendingTimers()

    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(el.innerHTML).toBe('Success SuccessComponent - success!')
    )

    ReactDOM.unmountComponentAtNode(el)
    consoleMock.mockRestore()
  })
})
