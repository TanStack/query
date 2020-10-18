import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'

import {
  Environment,
  EnvironmentProvider,
  QueryCache,
  prefetchQuery,
  useQuery,
} from '../..'
import { dehydrate, hydrate } from '../'
import * as utils from '../../core/utils'
import { mockConsoleError, sleep } from '../../react/tests/utils'

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

function PrintStateComponent({ componentName, result }: any): any {
  return `${componentName} - status:${result.status} fetching:${result.isFetching} data:${result.data}`
}

describe('Server side rendering with de/rehydration', () => {
  it('should not mismatch on success', async () => {
    const consoleMock = mockConsoleError()
    const fetchDataSuccess = jest.fn(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery('success', () => fetchDataSuccess('success!'))
      return (
        <PrintStateComponent componentName="SuccessComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    await prefetchQuery(prefetchEnvironment, {
      queryKey: 'success',
      queryFn: () => fetchDataSuccess('success'),
    })
    const dehydratedStateServer = dehydrate(prefetchEnvironment)
    const renderEnvironment = new Environment({ queryCache: new QueryCache() })
    hydrate(renderEnvironment, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <EnvironmentProvider environment={renderEnvironment}>
        <SuccessComponent />
      </EnvironmentProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderEnvironment.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:success fetching:true data:success'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const environment = new Environment({ queryCache: new QueryCache() })
    hydrate(environment, JSON.parse(stringifiedState))

    ReactDOM.hydrate(
      <EnvironmentProvider environment={environment}>
        <SuccessComponent />
      </EnvironmentProvider>,
      el
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(expectedMarkup)

    ReactDOM.unmountComponentAtNode(el)
    consoleMock.mockRestore()
    environment.clear()
  })

  it('should not mismatch on error', async () => {
    const consoleMock = mockConsoleError()
    const fetchDataError = jest.fn(() => {
      throw new Error('fetchDataError')
    })

    // -- Shared part --
    function ErrorComponent() {
      const result = useQuery('error', () => fetchDataError(), { retry: false })
      return (
        <PrintStateComponent componentName="ErrorComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)
    const prefetchEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    await prefetchQuery(prefetchEnvironment, {
      queryKey: 'error',
      queryFn: () => fetchDataError(),
    })
    const dehydratedStateServer = dehydrate(prefetchEnvironment)
    const renderEnvironment = new Environment({ queryCache: new QueryCache() })
    hydrate(renderEnvironment, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <EnvironmentProvider environment={renderEnvironment}>
        <ErrorComponent />
      </EnvironmentProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderEnvironment.clear()
    setIsServer(false)

    const expectedMarkup =
      'ErrorComponent - status:loading fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const environment = new Environment({ queryCache: new QueryCache() })
    hydrate(environment, JSON.parse(stringifiedState))

    ReactDOM.hydrate(
      <EnvironmentProvider environment={environment}>
        <ErrorComponent />
      </EnvironmentProvider>,
      el
    )

    // We expect exactly one console.error here, which is from the
    expect(consoleMock).toHaveBeenCalledTimes(1)
    expect(fetchDataError).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(expectedMarkup)
    await sleep(10)
    expect(fetchDataError).toHaveBeenCalledTimes(2)
    expect(el.innerHTML).toBe(
      'ErrorComponent - status:error fetching:false data:undefined'
    )

    ReactDOM.unmountComponentAtNode(el)
    consoleMock.mockRestore()
    environment.clear()
  })

  it('should not mismatch on queries that were not prefetched', async () => {
    const consoleMock = mockConsoleError()
    const fetchDataSuccess = jest.fn(fetchData)

    // -- Shared part --
    function SuccessComponent() {
      const result = useQuery('success', () => fetchDataSuccess('success!'))
      return (
        <PrintStateComponent componentName="SuccessComponent" result={result} />
      )
    }

    // -- Server part --
    setIsServer(true)

    const prefetchEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    const dehydratedStateServer = dehydrate(prefetchEnvironment)
    const renderEnvironment = new Environment({ queryCache: new QueryCache() })
    hydrate(renderEnvironment, dehydratedStateServer)
    const markup = ReactDOMServer.renderToString(
      <EnvironmentProvider environment={renderEnvironment}>
        <SuccessComponent />
      </EnvironmentProvider>
    )
    const stringifiedState = JSON.stringify(dehydratedStateServer)
    renderEnvironment.clear()
    setIsServer(false)

    const expectedMarkup =
      'SuccessComponent - status:loading fetching:true data:undefined'

    expect(markup).toBe(expectedMarkup)

    // -- Client part --
    const el = document.createElement('div')
    el.innerHTML = markup

    const environment = new Environment({ queryCache: new QueryCache() })
    hydrate(environment, JSON.parse(stringifiedState))

    ReactDOM.hydrate(
      <EnvironmentProvider environment={environment}>
        <SuccessComponent />
      </EnvironmentProvider>,
      el
    )

    // Check that we have no React hydration mismatches
    expect(consoleMock).not.toHaveBeenCalled()
    expect(fetchDataSuccess).toHaveBeenCalledTimes(0)
    expect(el.innerHTML).toBe(expectedMarkup)
    await sleep(10)
    expect(fetchDataSuccess).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe(
      'SuccessComponent - status:success fetching:false data:success!'
    )

    ReactDOM.unmountComponentAtNode(el)
    consoleMock.mockRestore()
    environment.clear()
  })
})
