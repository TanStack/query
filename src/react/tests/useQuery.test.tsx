import { render, act, waitFor, fireEvent } from '@testing-library/react'
import * as React from 'react'

import { useQuery, queryCache, queryCaches } from '../index'
import { sleep, expectType } from './utils'
import { QueryResult } from '../../core/types'

describe('useQuery', () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  it('should return the correct types', () => {
    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      // unspecified query function should default to unknown
      const noQueryFn = useQuery('test')
      expectType<unknown>(noQueryFn.data)
      expectType<unknown>(noQueryFn.error)

      // it should infer the result type from the query function
      const fromQueryFn = useQuery('test', () => 'test')
      expectType<string | undefined>(fromQueryFn.data)
      expectType<unknown>(fromQueryFn.error)

      // it should be possible to specify the error type
      const withError = useQuery<string, Error, string>('test', () => 'test')
      expectType<string | undefined>(withError.data)
      expectType<Error | null>(withError.error)

      // unspecified error type should default to unknown
      const withoutError = useQuery<number, unknown, string>('test', () => 1)
      expectType<number | undefined>(withoutError.data)
      expectType<unknown>(withoutError.error)

      // it should provide the result type in the configuration
      useQuery(['key'], async () => true, {
        onSuccess: data => expectType<boolean>(data),
        onSettled: data => expectType<boolean | undefined>(data),
      })

      // should error when the query function result does not match with the specified type
      // @ts-expect-error
      useQuery<number>('test', () => 'test')

      // should error when a non configuration object is given as first argument
      // @ts-expect-error
      useQuery({ a: 'a' }, () => 'test')
    }
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    const queryKey = Math.random()

    function Page() {
      const { data = 'default' } = useQuery(queryKey, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('default')

    await waitFor(() => rendered.getByText('test'))
  })

  it('should return the correct states for a successful query', async () => {
    const queryKey = Math.random()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(queryKey, () => 'test')

      states.push(state)

      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('Status: success'))

    expect(states[0]).toEqual({
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 0,
      isError: false,
      isFetching: true,
      isIdle: false,
      isLoading: true,
      isStale: true,
      isSuccess: false,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[1]).toEqual({
      clear: expect.any(Function),
      data: 'test',
      error: null,
      failureCount: 0,
      isError: false,
      isFetching: false,
      isIdle: false,
      isLoading: false,
      isStale: true,
      isSuccess: true,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'success',
      updatedAt: expect.any(Number),
    })
  })

  it('should return the correct states for an unsuccessful query', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryKey = Math.random()
    const states: QueryResult<undefined, string>[] = []

    function Page() {
      const state = useQuery<undefined, string, number>(
        queryKey,
        () => Promise.reject('rejected'),
        {
          retry: 1,
          retryDelay: 1,
        }
      )

      states.push(state)

      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('Status: error'))

    expect(states[0]).toEqual({
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 0,
      isError: false,
      isFetching: true,
      isIdle: false,
      isLoading: true,
      isStale: true,
      isSuccess: false,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[1]).toEqual({
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 1,
      isError: false,
      isFetching: true,
      isIdle: false,
      isLoading: true,
      isStale: true,
      isSuccess: false,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[2]).toEqual({
      clear: expect.any(Function),
      data: undefined,
      error: 'rejected',
      failureCount: 2,
      isError: true,
      isFetching: false,
      isIdle: false,
      isLoading: false,
      isStale: true,
      isSuccess: false,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'error',
      updatedAt: expect.any(Number),
    })
  })

  // See https://github.com/tannerlinsley/react-query/issues/137
  it('should not override initial data in dependent queries', async () => {
    const queryKey1 = Math.random()
    const queryKey2 = Math.random()

    function Page() {
      const first = useQuery(queryKey1, () => 'data', {
        enabled: false,
        initialData: 'init',
      })

      const second = useQuery(queryKey2, () => 'data', {
        enabled: false,
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

    const rendered = render(<Page />)

    rendered.getByText('First Data: init')
    rendered.getByText('Second Data: init')
    rendered.getByText('First Status: success')
    rendered.getByText('Second Status: success')
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status idle if enabled is false', async () => {
    function Page() {
      const first = useQuery('first', () => 'data', {
        enabled: false,
      })
      const second = useQuery('second', () => 'data')

      return (
        <div>
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    // use "act" to wait for state update and prevent console warning

    rendered.getByText('First Status: idle')
    await waitFor(() => rendered.getByText('Second Status: loading'))
    await waitFor(() => rendered.getByText('Second Status: success'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "loading" state by default', async () => {
    function Page() {
      const { status } = useQuery('test', async () => {
        await sleep(10)
        return 'test'
      })

      return <div>status: {status}</div>
    }

    const rendered = render(<Page />)

    rendered.getByText('status: loading')
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

    render(<Page />)

    expect(queryFn).toHaveBeenCalledWith('test', variables)
  })

  it('should not refetch query on focus when `enabled` is set to `false`', async () => {
    const queryFn = jest.fn()

    function Page() {
      const { data = 'default' } = useQuery('test', queryFn, { enabled: false })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('default'))

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should set status to error if queryFn throws', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    function Page() {
      const { status, error } = useQuery<undefined, string, string>(
        'test',
        () => {
          return Promise.reject('Error test jaylen')
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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('error'))
    await waitFor(() => rendered.getByText('Error test jaylen'))

    consoleMock.mockRestore()
  })

  it('should retry specified number of times', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => {
      return Promise.reject('Error test Barrett')
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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('error'))

    // query should fail `retry + 1` times, since first time isn't a "retry"
    await waitFor(() => rendered.getByText('Failed 2 times'))

    expect(queryFn).toHaveBeenCalledTimes(2)
    consoleMock.mockRestore()
  })

  it('should not retry if retry function `false`', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryFn = jest.fn()

    queryFn.mockImplementationOnce(() => {
      return Promise.reject('Error test Tanner')
    })

    queryFn.mockImplementation(() => {
      return Promise.reject('NoRetry')
    })

    function Page() {
      const { status, failureCount, error } = useQuery<
        undefined,
        string,
        string
      >('test', queryFn, {
        retryDelay: 1,
        retry: (_failureCount, error) => error !== 'NoRetry',
      })

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('error'))

    await waitFor(() => rendered.getByText('Failed 2 times'))
    await waitFor(() => rendered.getByText('NoRetry'))

    expect(queryFn).toHaveBeenCalledTimes(2)
    consoleMock.mockRestore()
  })

  it('should garbage collect queries without data immediately', async () => {
    function Page() {
      const [filter, setFilter] = React.useState('')
      const { data } = useQuery(
        ['todos', { filter }],
        async (_key, { filter }) => {
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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('update'))

    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))

    expect(Object.keys(queryCache.queries).length).toEqual(5)

    await waitFor(() => rendered.getByText('todo aaaa'))

    expect(Object.keys(queryCache.queries).length).toEqual(1)
  })

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const originalVisibilityState = document.visibilityState

    function mockVisibilityState(value: string) {
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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('failureCount 1'))
    await waitFor(() => rendered.getByText('status loading'))

    act(() => {
      // reset visibilityState to original value
      mockVisibilityState(originalVisibilityState)
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitFor(() => rendered.getByText('failureCount 4'))
    await waitFor(() => rendered.getByText('status error'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/195
  it('should refetch if stale after a prefetch', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10).then(() => 'data'))

    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(() => sleep(16).then(() => 'not yet...'))

    await act(() =>
      queryCache.prefetchQuery('test', prefetchQueryFn, {
        staleTime: 10,
      })
    )

    await act(() => sleep(20))

    function Page() {
      const query = useQuery('test', queryFn)

      return (
        <div>
          <div>{query.data}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('data'))

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not refetch if not stale after a prefetch', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10).then(() => 'data'))

    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(() => sleep(16).then(() => 'not yet...'))

    await act(() =>
      queryCache.prefetchQuery('test', prefetchQueryFn, {
        staleTime: 10,
      })
    )

    function Page() {
      const query = useQuery('test', queryFn)

      return (
        <div>
          <div>{query.data}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('data'))

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  // See https://github.com/tannerlinsley/react-query/issues/190
  it('should reset failureCount on successful fetch', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    function Page() {
      let counter = 0

      const query = useQuery(
        'test',
        async () => {
          if (counter < 2) {
            counter++
            throw new Error('error')
          } else {
            return 'data'
          }
        },
        { retryDelay: 10 }
      )

      return (
        <div>
          <div>failureCount {query.failureCount}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('failureCount 2'))
    await waitFor(() => rendered.getByText('failureCount 0'))

    consoleMock.mockRestore()
  })

  // See https://github.com/tannerlinsley/react-query/issues/199
  it('should use prefetched data for dependent query', async () => {
    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const [isPrefetched, setPrefetched] = React.useState(false)

      const query = useQuery('key', () => undefined, {
        enabled,
      })

      React.useEffect(() => {
        async function prefetch() {
          await queryCache.prefetchQuery('key', () =>
            Promise.resolve('prefetched data')
          )
          setPrefetched(true)
        }
        prefetch()
      }, [])

      return (
        <div>
          {isPrefetched && <div>isPrefetched</div>}
          <button onClick={() => setEnabled(true)}>setKey</button>
          <div>{query.data}</div>
        </div>
      )
    }

    const rendered = render(<Page />)
    await waitFor(() => rendered.getByText('isPrefetched'))

    fireEvent.click(rendered.getByText('setKey'))
    await waitFor(() => rendered.getByText('prefetched data'))
  })

  it('should support dependent queries via the enable config option', async () => {
    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(false)

      const query = useQuery('key', () => 'data', {
        enabled: shouldFetch,
      })

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

    const rendered = render(<Page />)

    rendered.getByText('Status: idle')
    rendered.getByText('Data: no data')

    fireEvent.click(rendered.getByText('fetch'))

    await waitFor(() => rendered.getByText('Status: loading'))
    await waitFor(() => [
      rendered.getByText('Status: success'),
      rendered.getByText('Data: data'),
    ])
  })

  it('should not mark query as fetching, when using initialData', async () => {
    function Page() {
      const query = useQuery('key', () => 'serverData', { initialData: 'data' })

      return (
        <div>
          <div>{query.data}</div>
          <div data-testid="isFetching">{`${query.isFetching}`}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('data')
    expect(rendered.getByTestId('isFetching').textContent).toBe('false')
  })

  it('should initialize state properly, when initialData is falsy', async () => {
    function Page() {
      const query = useQuery('key', () => 1, { initialData: 0 })

      return (
        <div>
          <div>{query.data}</div>
          <div data-testid="isFetching">{`${query.isFetching}`}</div>
          <div data-testid="status">{query.status}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('0')
    expect(rendered.getByTestId('isFetching').textContent).toBe('false')
    expect(rendered.getByTestId('status').textContent).toBe('success')
  })

  // // See https://github.com/tannerlinsley/react-query/issues/214
  it('data should persist when enabled is changed to false', async () => {
    const callback = jest.fn()

    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(true)
      const query = useQuery('key', () => 'fetched data', {
        enabled: shouldFetch,
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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('initial'))
    fireEvent.click(rendered.getByText('setShouldFetch(false)'))
    rendered.getByText('initial')
    expect(callback.mock.calls.length).toBeLessThan(5)
  })

  it('it should support enabled:false in query object syntax', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')

    function Page() {
      const { status } = useQuery({
        queryKey: 'key',
        queryFn,
        config: {
          enabled: false,
        },
      })
      return <div>status: {status}</div>
    }

    const rendered = render(<Page />)

    const cachedQueries = Object.keys(queryCache.queries).length
    expect(queryFn).not.toHaveBeenCalled()
    expect(cachedQueries).toEqual(1)
    rendered.getByText('status: idle')
  })

  // See https://github.com/tannerlinsley/react-query/issues/360
  test('should init to status:idle when enabled is falsey', async () => {
    function Page() {
      const query = useQuery('key', () => undefined, {
        enabled: false,
      })

      return (
        <div>
          <div>status: {query.status}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('status: idle'))
  })

  test('should not schedule garbage collection, if cacheTimeout is set to `Infinity`', async () => {
    function Page() {
      const query = useQuery('test', () => 'fetched data', {
        cacheTime: Infinity,
      })
      return <div>{query.data}</div>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('fetched data'))

    rendered.unmount()

    const query = queryCache.getQuery('test')
    // @ts-expect-error
    expect(query!.cacheTimeout).toBe(undefined)
  })

  it('should not cause memo churn when data does not change', async () => {
    const queryFn = jest.fn()
    const memoFn = jest.fn()

    function Page() {
      const result = useQuery('test', async () => {
        await sleep(10)
        return (
          queryFn() || {
            data: {
              nested: true,
            },
          }
        )
      })

      React.useMemo(() => {
        memoFn()
        return result.data
      }, [result.data])

      return (
        <div>
          <div>status {result.status}</div>
          <div>isFetching {result.isFetching ? 'true' : 'false'}</div>
          <button onClick={() => result.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('status loading'))
    await waitFor(() => rendered.getByText('status success'))
    fireEvent.click(rendered.getByText('refetch'))
    await waitFor(() => rendered.getByText('isFetching true'))
    await waitFor(() => rendered.getByText('isFetching false'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(memoFn).toHaveBeenCalledTimes(2)
  })

  it('should update data upon interval changes', async () => {
    let count = 0

    function Page() {
      const [int, setInt] = React.useState(200)
      const { data } = useQuery('/api', () => count++, {
        refetchInterval: int,
      })

      React.useEffect(() => {
        if (data === 2) {
          setInt(0)
        }
      }, [data])

      return <div>count: {data}</div>
    }

    const rendered = render(<Page />)

    // mount
    await waitFor(() => rendered.getByText('count: 0'))
    await waitFor(() => rendered.getByText('count: 1'))
    await waitFor(() => rendered.getByText('count: 2'))
  })

  it('should error when using functions as query keys', () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    function Page() {
      useQuery(
        // @ts-expect-error
        () => undefined,
        () => 'data'
      )
      return null
    }

    expect(() => render(<Page />)).toThrowError(/query key/)

    consoleMock.mockRestore()
  })

  it('should accept undefined as query key', async () => {
    function Page() {
      const result = useQuery(undefined, (key: undefined) => key)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('null'))
  })

  it('should accept a boolean as query key', async () => {
    function Page() {
      const result = useQuery(false, (key: boolean) => key)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('false'))
  })

  it('should accept null as query key', async () => {
    function Page() {
      const result = useQuery(null, key => key)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('null'))
  })

  it('should accept a number as query key', async () => {
    function Page() {
      const result = useQuery(1, (key: number) => key)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('1'))
  })

  it('should accept an empty string as query key', async () => {
    function Page() {
      const result = useQuery('', (key: string) => key)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText(''))
  })

  it('should accept an object as query key', async () => {
    function Page() {
      const result = useQuery([{ a: 'a' }], (key: { a: string }) => key)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('{"a":"a"}'))
  })
})
