import {
  render,
  act,
  waitForElement,
  fireEvent,
  cleanup,
  waitForDomChange,
} from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import * as React from 'react'

import {
  useQuery,
  useQueryCache,
  makeQueryCache,
  ReactQueryCacheProvider,
} from '../index'
import { sleep } from './utils'

describe('useQuery', () => {
  afterEach(() => {
    cleanup()
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    function Page() {
      const { data = 'default' } = useQuery('test', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('default')
    await waitForElement(() => rendered.getByText('test'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/137
  it('should not override initial data in dependent queries', async () => {
    function Page() {
      const first = useQuery(false && 'first', () => 'data', {
        initialData: 'init',
      })

      const second = useQuery(false && 'second', () => 'data', {
        initialData: 'init',
      })

      return (
        <div>
          <h2>First Data: {first.data}</h2>
          <h2>Second Data: {second.data}</h2>
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('First Data: init')
    rendered.getByText('Second Data: init')
    rendered.getByText('First Status: success')
    rendered.getByText('Second Status: success')
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status success if falsey query key is supplied', async () => {
    function Page() {
      const first = useQuery(false && 'first', () => 'data')
      const second = useQuery('second', () => 'data')

      return (
        <div>
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    // use "act" to wait for state update and prevent console warning

    rendered.getByText('First Status: success')
    await waitForElement(() => rendered.getByText('Second Status: loading'))
    await waitForElement(() => rendered.getByText('Second Status: success'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/217
  it('should start with status success if a null query key is supplied', async () => {
    function Page() {
      const first = useQuery(null && 'first', () => 'data')
      const second = useQuery('second', () => 'data')

      return (
        <div>
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('First Status: success')
    await waitForElement(() => rendered.getByText('Second Status: loading'))
    await waitForElement(() => rendered.getByText('Second Status: success'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "loading" state by default', async () => {
    function Page() {
      const { status } = useQuery('test', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1 data-testid="status">{status}</h1>
        </div>
      )
    }

    const { getByTestId } = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => getByTestId('status'))
    act(() => {
      expect(getByTestId('status').textContent).toBe('loading')
    })
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "success" state by default in manual mode', async () => {
    function Page() {
      const { status } = useQuery(
        'test',
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          manual: true,
        }
      )

      return (
        <div>
          <h1>{status}</h1>
        </div>
      )
    }

    const { findByText } = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await findByText('success')
  })

  // See https://github.com/tannerlinsley/react-query/issues/147
  it('should not pass stringified variables to query function', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    const variables = { number: 5, boolean: false, object: {}, array: [] }

    function Page() {
      useQuery(['test', variables], queryFn)

      return null
    }

    render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    expect(queryFn).toHaveBeenCalledWith('test', variables)
  })

  // See https://github.com/tannerlinsley/react-query/issues/161
  it('should not fetch query when `manual` is set to `true`', async () => {
    const queryFn = jest.fn()

    function Page() {
      const { data = 'default' } = useQuery('test', queryFn, { manual: true })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )
    await waitForElement(() => rendered.getByText('default'))
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should not refetch query on focus when `manual` is set to `true`', async () => {
    const queryFn = jest.fn()

    function Page() {
      const { data = 'default' } = useQuery('test', queryFn, { manual: true })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )
    await waitForElement(() => rendered.getByText('default'))

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should set status to error if queryFn throws', async () => {
    function Page() {
      const { status, error } = useQuery(
        'test',
        () => {
          return Promise.reject('Error test')
        },
        { retry: false }
      )

      return (
        <div>
          <h1>{status}</h1>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('error'))
    await waitForElement(() => rendered.getByText('Error test'))
  })

  it('should retry specified number of times', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => {
      return Promise.reject('Error test')
    })

    function Page() {
      const { status, failureCount } = useQuery('test', queryFn, {
        retry: 1,
        retryDelay: 1,
      })

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('loading'))
    await waitForElement(() => rendered.getByText('error'))

    // query should fail `retry + 1` times, since first time isn't a "retry"
    await waitForElement(() => rendered.getByText('Failed 2 times'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should not retry if retry function `false`', async () => {
    const queryFn = jest.fn()

    queryFn.mockImplementationOnce(() => {
      return Promise.reject('Error test')
    })

    queryFn.mockImplementation(() => {
      return Promise.reject('NoRetry')
    })

    function Page() {
      const { status, failureCount, error } = useQuery('test', queryFn, {
        retryDelay: 1,
        retry: (failureCount, error) => error !== 'NoRetry',
      })

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('loading'))
    await waitForElement(() => rendered.getByText('error'))

    await waitForElement(() => rendered.getByText('Failed 2 times'))
    await waitForElement(() => rendered.getByText('NoRetry'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should garbage collect queries without data immediately', async () => {
    const queryCache = makeQueryCache()
    function Page() {
      const [filter, setFilter] = React.useState('')
      const { data } = useQuery(
        ['todos', { filter }],
        async (key, { filter } = {}) => {
          await sleep(10)
          return `todo ${filter}`
        }
      )

      return (
        <div>
          <div>{data}</div>
          <button onClick={() => setFilter(filter + 'a')}>update</button>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider queryCache={queryCache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('update'))

    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))

    expect(Object.keys(queryCache.queries).length).toEqual(5)

    await waitForElement(() => rendered.getByText('todo aaaa'))

    expect(Object.keys(queryCache.queries).length).toEqual(1)
  })

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const originalVisibilityState = document.visibilityState

    function mockVisibilityState(value) {
      Object.defineProperty(document, 'visibilityState', {
        value,
        configurable: true,
      })
    }

    // make page unfocused
    mockVisibilityState('hidden')

    function Page() {
      const query = useQuery('test', () => Promise.reject('fetching error'), {
        retry: 3,
        retryDelay: 1,
      })

      return (
        <div>
          <div>status {query.status}</div>
          <div>failureCount {query.failureCount}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('failureCount 1'))
    await waitForElement(() => rendered.getByText('status loading'))

    act(() => {
      // reset visibilityState to original value
      mockVisibilityState(originalVisibilityState)
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitForElement(() => rendered.getByText('failureCount 4'))
    await waitForElement(() => rendered.getByText('status error'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/195
  it('should not refetch immediately after a prefetch', async () => {
    const queryCache = makeQueryCache()
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(() => sleep(10))

    function Page() {
      const query = useQuery('test', queryFn)

      return (
        <div>
          <div>status {query.status}</div>
        </div>
      )
    }

    await queryCache.prefetchQuery('test', prefetchQueryFn)
    await queryCache.prefetchQuery('test', prefetchQueryFn)

    const rendered = render(
      <ReactQueryCacheProvider queryCache={queryCache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('status success'))

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  // See https://github.com/tannerlinsley/react-query/issues/190
  it('should reset failreCount on successful fetch', async () => {
    function Page() {
      let counter = 0
      const query = useQuery(
        'test',
        async () => {
          if (counter === 0) {
            counter++
            throw new Error('error')
          } else {
            return 'data'
          }
        },
        { retryDelay: 50 }
      )

      return (
        <div>
          <div>failureCount {query.failureCount}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('failureCount 1'))
    await waitForElement(() => rendered.getByText('failureCount 0'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/199
  it('should use prefetched data for dependent query', async () => {
    function Page() {
      const queryCache = useQueryCache()
      const [key, setKey] = React.useState(false)
      const [isPrefetched, setPrefetched] = React.useState(false)

      const query = useQuery(key, () => {})

      React.useEffect(() => {
        async function prefetch() {
          await queryCache.prefetchQuery('key', () =>
            Promise.resolve('prefetched data')
          )
          setPrefetched(true)
        }
        prefetch()
      }, [queryCache])

      return (
        <div>
          {isPrefetched && <div>isPrefetched</div>}
          <button onClick={() => setKey('key')}>setKey</button>
          <div>{query.data}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )
    await waitForElement(() => rendered.getByText('isPrefetched'))

    fireEvent.click(rendered.getByText('setKey'))
    await waitForElement(() => rendered.getByText('prefetched data'))
  })

  it('should support a function that resolves a query key', async () => {
    function Page() {
      const { status, data, query } = useQuery(
        () => 'key',
        () => 'data'
      )

      return (
        <div>
          <div>Status: {status}</div>
          <div>Data: {data}</div>
          <div>Key: {query.queryKey}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('Status: loading')
    await waitForElement(() => rendered.getByText('Status: success'))
    rendered.getByText('Data: data')
    rendered.getByText('Key: key')
  })

  it('should support dependent query keys via returng falsy in a query key function', async () => {
    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(false)

      const query = useQuery(
        () => shouldFetch && 'key',
        () => 'data'
      )

      return (
        <div>
          <div>Status: {query.status}</div>
          <h2>Data: {query.data || 'no data'}</h2>
          {query.isStale ? (
            <button onClick={() => setShouldFetch(true)}>fetch</button>
          ) : null}
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('Status: success')
    rendered.getByText('Data: no data')

    fireEvent.click(rendered.getByText('fetch'))

    await waitForElement(() => rendered.getByText('Status: loading'))
    await waitForElement(() => [
      rendered.getByText('Status: success'),
      rendered.getByText('Data: data'),
    ])
  })

  it('should support dependent query keys via throwing in a query key function', async () => {
    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState()

      const query = useQuery(
        () => shouldFetch.on && 'key',
        () => 'data'
      )

      return (
        <div>
          <div>Status: {query.status}</div>
          <h2>Data: {query.data || 'no data'}</h2>
          {query.isStale ? (
            <button onClick={() => setShouldFetch({ on: true })}>fetch</button>
          ) : null}
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('Status: success')
    rendered.getByText('Data: no data')

    fireEvent.click(rendered.getByText('fetch'))

    await waitForElement(() => rendered.getByText('Status: loading'))
    await waitForElement(() => [
      rendered.getByText('Status: success'),
      rendered.getByText('Data: data'),
    ])
  })

  it('should not mark query as fetching, when using initialData', async () => {
    function Page() {
      const query = useQuery('key', () => {}, { initialData: 'data' })

      return (
        <div>
          <div>{query.data}</div>
          <div data-testid="isFetching">{`${query.isFetching}`}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('data')
    expect(rendered.getByTestId('isFetching').textContent).toBe('false')
  })

  it('should initialize state properly, when initialData is falsy', async () => {
    function Page() {
      const query = useQuery('key', () => {}, { initialData: 0 })

      return (
        <div>
          <div>{query.data}</div>
          <div data-testid="isFetching">{`${query.isFetching}`}</div>
          <div data-testid="status">{query.status}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('0')
    expect(rendered.getByTestId('isFetching').textContent).toBe('false')
    expect(rendered.getByTestId('status').textContent).toBe('success')
  })

  // See https://github.com/tannerlinsley/react-query/issues/214
  it('should not cause infinite loop after query key is changed to falsy', async () => {
    const callback = jest.fn()

    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(true)
      const query = useQuery(shouldFetch && 'key', () => 'fetched data', {
        initialData: shouldFetch ? 'initial' : 'initial falsy',
      })

      const { data } = query

      React.useEffect(() => {
        callback()
      }, [query])

      return (
        <div>
          <div>{data}</div>
          <button onClick={() => setShouldFetch(false)}>
            setShouldFetch(false)
          </button>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('initial'))
    fireEvent.click(rendered.getByText('setShouldFetch(false)'))
    rendered.getByText('initial falsy')
    // wait for infinite loop to call mock function a bit
    await act(() => sleep(200))
    expect(callback.mock.calls.length).toBeLessThan(5)
  })
  it('it should support falsy queryKey in query object syntax', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')
    const queryCache = makeQueryCache()

    function Page() {
      useQuery({
        queryKey: false && 'key',
        queryFn,
      })
      return null
    }
    render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    const cachedQueries = Object.keys(queryCache.queries).length
    expect(queryFn).not.toHaveBeenCalled()
    expect(cachedQueries).toEqual(0)
  })
  it('it should throw when using query syntax and missing required keys', async () => {
    // mock console.error to avoid the wall of red text,
    // you could also do this on beforeEach/afterEach
    jest.spyOn(console, 'error')
    console.error.mockImplementation(() => {})

    function Page() {
      useQuery({})
      return null
    }
    expect(() =>
      render(
        <ReactQueryCacheProvider>
          <Page />
        </ReactQueryCacheProvider>
      )
    ).toThrowError(/queryKey|queryFn/)

    console.error.mockRestore()
  })

  test('should schedule stale timeout by default', async () => {
    function Page() {
      const query = useQuery('test', () => 'fetched data')

      return (
        <div>
          <div>{query.data}</div>
          <div data-testid="isStale">{`${query.isStale}`}</div>
          <div data-testid="staleTimeout">{`${query.query.staleTimeout}`}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('fetched data'))
    expect(rendered.getByTestId('isStale').textContent).toBe('true')
    expect(rendered.getByTestId('staleTimeout').textContent).not.toBe(
      'undefined'
    )
  })

  test('should not schedule stale timeout, if staleTime is set to `Infinity`', async () => {
    function Page() {
      const query = useQuery('test', () => 'fetched data', {
        staleTime: Infinity,
      })

      return (
        <div>
          <div>{query.data}</div>
          <div data-testid="isStale">{`${query.isStale}`}</div>
          <div data-testid="staleTimeout">{`${query.query.staleTimeout}`}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('fetched data'))
    expect(rendered.getByTestId('isStale').textContent).toBe('false')
    expect(rendered.getByTestId('staleTimeout').textContent).toBe('undefined')
  })

  // See https://github.com/tannerlinsley/react-query/issues/360
  test('should not init to `isFetching === true` when falsey query key is supplied', async () => {
    function Page() {
      const query = useQuery(false, () => {})

      return (
        <div>
          <div>isFetching === {query.isFetching.toString()}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('isFetching === false'))
  })

  test('should not schedule garbage collection, if cacheTimeout is set to `Infinity`', async () => {
    function Page() {
      const query = useQuery('test', () => 'fetched data', {
        cacheTime: Infinity,
      })
      return <div>{query.data}</div>
    }

    const queryCache = makeQueryCache()

    const rendered = render(
      <ReactQueryCacheProvider queryCache={queryCache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('fetched data'))

    rendered.unmount()

    const query = queryCache.getQuery('test')
    expect(query.cacheTimeout).toBe(undefined)
  })

  it('should not cause memo churn when data does not change', async () => {
    const queryFn = jest.fn()
    const memoFn = jest.fn()
    const originalVisibilityState = document.visibilityState

    function mockVisibilityState(value) {
      Object.defineProperty(document, 'visibilityState', {
        value,
        configurable: true,
      })
    }

    // make page unfocused
    mockVisibilityState('hidden')

    function Page() {
      const query = useQuery(
        'test',
        () =>
          queryFn() || {
            data: {
              nested: true,
            },
          }
      )

      React.useMemo(() => {
        memoFn()
        return query.data
      }, [query.data])

      return (
        <div>
          <div>status {query.status}</div>
          <div>isFetching {query.isFetching ? 'true' : 'false'}</div>
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    await waitForElement(() => rendered.getByText('status loading'))
    await waitForElement(() => rendered.getByText('status success'))

    act(() => {
      // reset visibilityState to original value
      mockVisibilityState(originalVisibilityState)
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitForElement(() => rendered.getByText('isFetching true'))
    await waitForElement(() => rendered.getByText('isFetching false'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(memoFn).toHaveBeenCalledTimes(2)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    let succeed = false
    jest.spyOn(console, 'error')
    console.error.mockImplementation(() => {})

    function Page() {
      useQuery(
        'test',
        async () => {
          await sleep(10)

          if (!succeed) {
            throw new Error()
          } else {
            return 'data'
          }
        },
        {
          retryDelay: 10,
          suspense: true,
        }
      )

      return <div>rendered</div>
    }

    const rendered = render(
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <div>
            <div>error boundary</div>
            <button
              onClick={() => {
                succeed = true
                resetErrorBoundary()
              }}
            >
              retry
            </button>
          </div>
        )}
      >
        <React.Suspense fallback={'Loading...'}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>
    )

    await waitForElement(() => rendered.getByText('error boundary'))

    console.error.mockRestore()

    fireEvent.click(rendered.getByText('retry'))

    await waitForElement(() => rendered.getByText('rendered'))
  })

  it('should update data upon interval changes', async () => {
    let count = 0
    function Page() {
      const [int, setInt] = React.useState(200)
      const { data } = useQuery('/api', () => count++, {
        refetchInterval: int,
      })
      return (
        <div onClick={() => setInt(num => (num < 400 ? num + 100 : 0))}>
          count: {data}
        </div>
      )
    }
    const { container } = render(<Page />)
    expect(container.firstChild.textContent).toEqual('count: ')
    await waitForDomChange({ container }) // mount
    expect(container.firstChild.textContent).toEqual('count: 0')
    await act(() => {
      return new Promise(res => setTimeout(res, 210))
    })
    expect(container.firstChild.textContent).toEqual('count: 1')
    await act(() => {
      return new Promise(res => setTimeout(res, 50))
    })
    expect(container.firstChild.textContent).toEqual('count: 1')
    await act(() => {
      return new Promise(res => setTimeout(res, 150))
    })
    expect(container.firstChild.textContent).toEqual('count: 2')
    await act(() => {
      fireEvent.click(container.firstElementChild)
      // it will clear 200ms timer and setup a new 300ms timer
      return new Promise(res => setTimeout(res, 200))
    })
    expect(container.firstChild.textContent).toEqual('count: 2')
    await act(() => {
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toEqual('count: 3')
    await act(() => {
      // wait for new 300ms timer
      return new Promise(res => setTimeout(res, 310))
    })
    expect(container.firstChild.textContent).toEqual('count: 4')
    await act(() => {
      fireEvent.click(container.firstElementChild)
      // it will clear 300ms timer and setup a new 400ms timer
      return new Promise(res => setTimeout(res, 300))
    })
    expect(container.firstChild.textContent).toEqual('count: 4')
    await act(() => {
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toEqual('count: 5')
    await act(() => {
      fireEvent.click(container.firstElementChild)
      // it will clear 400ms timer and stop
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toEqual('count: 5')
    await act(() => {
      return new Promise(res => setTimeout(res, 110))
    })
    expect(container.firstChild.textContent).toEqual('count: 5')
  })
})
