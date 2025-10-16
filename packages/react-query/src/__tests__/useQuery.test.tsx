import { act, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryCache, useQuery } from '..'
import {
  Blink,
  createQueryClient,
  expectType,
  mockLogger,
  mockNavigatorOnLine,
  mockVisibilityState,
  queryKey,
  reactVersion,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import type {
  DefinedUseQueryResult,
  QueryFunction,
  QueryFunctionContext,
  UseQueryOptions,
  UseQueryResult,
} from '..'

describe('useQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct types', () => {
    const key = queryKey()

    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      // unspecified query function should default to unknown
      const noQueryFn = useQuery(key)
      expectType<unknown>(noQueryFn.data)
      expectType<unknown>(noQueryFn.error)

      // it should infer the result type from the query function
      const fromQueryFn = useQuery(key, () => 'test')
      expectType<string | undefined>(fromQueryFn.data)
      expectType<unknown>(fromQueryFn.error)

      // it should be possible to specify the result type
      const withResult = useQuery<string>(key, () => 'test')
      expectType<string | undefined>(withResult.data)
      expectType<unknown | null>(withResult.error)

      // it should be possible to specify the error type
      const withError = useQuery<string, Error>(key, () => 'test')
      expectType<string | undefined>(withError.data)
      expectType<Error | null>(withError.error)

      // it should provide the result type in the configuration
      useQuery([key], async () => true, {
        onSuccess: (data) => expectType<boolean>(data),
        onSettled: (data) => expectType<boolean | undefined>(data),
      })

      // it should be possible to specify a union type as result type
      const unionTypeSync = useQuery(
        key,
        () => (Math.random() > 0.5 ? 'a' : 'b'),
        {
          onSuccess: (data) => expectType<'a' | 'b'>(data),
        },
      )
      expectType<'a' | 'b' | undefined>(unionTypeSync.data)
      const unionTypeAsync = useQuery<'a' | 'b'>(
        key,
        () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
        {
          onSuccess: (data) => expectType<'a' | 'b'>(data),
        },
      )
      expectType<'a' | 'b' | undefined>(unionTypeAsync.data)

      // should error when the query function result does not match with the specified type
      // @ts-expect-error
      useQuery<number>(key, () => 'test')

      // it should infer the result type from a generic query function
      function queryFn<T = string>(): Promise<T> {
        return Promise.resolve({} as T)
      }

      const fromGenericQueryFn = useQuery(key, () => queryFn())
      expectType<string | undefined>(fromGenericQueryFn.data)
      expectType<unknown>(fromGenericQueryFn.error)

      const fromGenericOptionsQueryFn = useQuery({
        queryKey: key,
        queryFn: () => queryFn(),
      })
      expectType<string | undefined>(fromGenericOptionsQueryFn.data)
      expectType<unknown>(fromGenericOptionsQueryFn.error)

      type MyData = number
      type MyQueryKey = readonly ['my-data', number]

      const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = async ({
        queryKey: [, n],
      }) => {
        return n + 42
      }

      useQuery({
        queryKey: ['my-data', 100],
        queryFn: getMyDataArrayKey,
      })

      const getMyDataStringKey: QueryFunction<MyData, ['1']> = async (
        context,
      ) => {
        expectType<['1']>(context.queryKey)
        return Number(context.queryKey[0]) + 42
      }

      useQuery({
        queryKey: ['1'],
        queryFn: getMyDataStringKey,
      })

      // it should handle query-functions that return Promise<any>
      useQuery(key, () =>
        fetch('return Promise<any>').then((resp) => resp.json()),
      )

      // handles wrapped queries with custom fetcher passed as inline queryFn
      const useWrappedQuery = <
        TQueryKey extends [string, Record<string, unknown>?],
        TQueryFnData,
        TError,
        TData = TQueryFnData,
      >(
        qk: TQueryKey,
        fetcher: (
          obj: TQueryKey[1],
          token: string,
          // return type must be wrapped with TQueryFnReturn
        ) => Promise<TQueryFnData>,
        options?: Omit<
          UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey' | 'queryFn' | 'initialData'
        >,
      ) => useQuery(qk, () => fetcher(qk[1], 'token'), options)
      const test = useWrappedQuery([''], async () => '1')
      expectType<string | undefined>(test.data)

      // handles wrapped queries with custom fetcher passed directly to useQuery
      const useWrappedFuncStyleQuery = <
        TQueryKey extends [string, Record<string, unknown>?],
        TQueryFnData,
        TError,
        TData = TQueryFnData,
      >(
        qk: TQueryKey,
        fetcher: () => Promise<TQueryFnData>,
        options?: Omit<
          UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey' | 'queryFn' | 'initialData'
        >,
      ) => useQuery(qk, fetcher, options)
      const testFuncStyle = useWrappedFuncStyleQuery([''], async () => true)
      expectType<boolean | undefined>(testFuncStyle.data)
    }
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    const key = queryKey()

    function Page() {
      const { data = 'default' } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('default')

    await waitFor(() => rendered.getByText('test'))
  })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery<string, Error>(key, async () => {
        await sleep(10)
        return 'test'
      })

      states.push(state)

      if (state.isLoading) {
        expectType<undefined>(state.data)
        expectType<null>(state.error)
        return <span>loading</span>
      }

      if (state.isLoadingError) {
        expectType<undefined>(state.data)
        expectType<Error>(state.error)
        return <span>{state.error.message}</span>
      }

      expectType<string>(state.data)
      expectType<Error | null>(state.error)
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('test'))

    expect(states.length).toEqual(2)

    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toEqual({
      data: 'test',
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isLoading: false,
      isInitialLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
    })
  })

  it('should return the correct states for an unsuccessful query', async () => {
    const key = queryKey()

    const states: UseQueryResult<undefined, string>[] = []

    function Page() {
      const state = useQuery<string[], string, undefined>(
        key,
        () => Promise.reject('rejected'),
        {
          retry: 1,
          retryDelay: 1,
        },
      )

      states.push(state)

      return (
        <div>
          <h1>Status: {state.status}</h1>
          <div>Failure Count: {state.failureCount}</div>
          <div>Failure Reason: {state.failureReason}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Status: error'))

    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: 'rejected',
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[2]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: 'rejected',
      errorUpdatedAt: expect.any(Number),
      failureCount: 2,
      failureReason: 'rejected',
      errorUpdateCount: 1,
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isLoading: false,
      isInitialLoading: false,
      isLoadingError: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'error',
      fetchStatus: 'idle',
    })
  })

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'prefetched')

    function Page() {
      const result = useQuery(key, () => 'new data')

      return (
        <>
          <div>data: {result.data}</div>
          <div>isFetched: {result.isFetched ? 'true' : 'false'}</div>
          <div>
            isFetchedAfterMount: {result.isFetchedAfterMount ? 'true' : 'false'}
          </div>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('data: prefetched')
    rendered.getByText('isFetched: true')
    rendered.getByText('isFetchedAfterMount: false')

    await waitFor(() => {
      rendered.getByText('data: new data')
      rendered.getByText('isFetched: true')
      rendered.getByText('isFetchedAfterMount: true')
    })
  })

  it('should call onSuccess after a query has been fetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'data'
        },
        { onSuccess },
      )
      states.push(state)
      return <div>data: {state.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: data')
    expect(states.length).toBe(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  })

  it('should call onSuccess after a query has been refetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          count++
          await sleep(10)
          return 'data' + count
        },
        { onSuccess },
      )

      states.push(state)

      return (
        <div>
          <div>data: {state.data}</div>
          <button onClick={() => state.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: data1')
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await rendered.findByText('data: data2')

    expect(states.length).toBe(3) //loading, success, success after refetch
    expect(count).toBe(2)
    expect(onSuccess).toHaveBeenCalledTimes(2)
  })

  it('should call onSuccess after a disabled query has been fetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()

    function Page() {
      const state = useQuery(key, () => 'data', { enabled: false, onSuccess })

      states.push(state)

      return (
        <div>
          <div>isSuccess: {state.isSuccess ? 'true' : 'false'}</div>
          <button onClick={() => state.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('isSuccess: false')
    })

    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

    await waitFor(() => {
      rendered.getByText('isSuccess: true')
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  })

  it('should not call onSuccess if a component has unmounted', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSuccess = jest.fn()

    function Page() {
      const [show, setShow] = React.useState(true)

      React.useEffect(() => {
        setShow(false)
      }, [setShow])

      return show ? <Component /> : null
    }

    function Component() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'data'
        },
        { onSuccess },
      )
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(50)
    expect(states.length).toBe(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)
  })

  it('should call onError after a query has been fetched with an error', async () => {
    const key = queryKey()
    const states: UseQueryResult<unknown>[] = []
    const onError = jest.fn()

    function Page() {
      const state = useQuery<unknown>(key, () => Promise.reject('error'), {
        retry: false,
        onError,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)
    expect(states.length).toBe(2)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('error')
  })

  it('should not call onError when receiving a CancelledError', async () => {
    const key = queryKey()
    const onError = jest.fn()

    function Page() {
      const { status, fetchStatus } = useQuery(
        key,
        async () => {
          await sleep(10)
          return 23
        },
        {
          onError,
        },
      )
      return (
        <span>
          status: {status}, fetchStatus: {fetchStatus}
        </span>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('status: loading, fetchStatus: fetching')

    await queryClient.cancelQueries(key)
    // query cancellation will reset the query to it's initial state
    await waitFor(() =>
      rendered.getByText('status: loading, fetchStatus: idle'),
    )
    expect(onError).not.toHaveBeenCalled()
  })

  it('should call onSettled after a query has been fetched', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSettled = jest.fn()

    function Page() {
      const state = useQuery(key, () => 'data', { onSettled })
      states.push(state)

      return <div>data: {state.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('data: data')
    })

    expect(states.length).toBe(2)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith('data', null)
  })

  it('should call onSettled after a query has been fetched with an error', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const onSettled = jest.fn()

    function Page() {
      const state = useQuery(key, () => Promise.reject<unknown>('error'), {
        retry: false,
        onSettled,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)
    expect(states.length).toBe(2)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(undefined, 'error')
  })

  it('should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const { refetch } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          return 'data'
        },
        { enabled: false, initialData: 'initialData' },
      )

      React.useEffect(() => {
        setActTimeout(() => {
          refetch()
        }, 5)
        setActTimeout(() => {
          refetch({ cancelRefetch: false })
        }, 5)
      }, [refetch])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(20)
    // first refetch only, second refetch is ignored
    expect(fetchCount).toBe(1)
  })

  it('should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const { refetch } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          return 'data'
        },
        { enabled: false, initialData: 'initialData' },
      )

      React.useEffect(() => {
        setActTimeout(() => {
          refetch()
        }, 5)
        setActTimeout(() => {
          refetch()
        }, 5)
      }, [refetch])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(20)
    // first refetch (gets cancelled) and second refetch
    expect(fetchCount).toBe(2)
  })

  it('should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const { refetch } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          return 'data'
        },
        { enabled: false },
      )

      React.useEffect(() => {
        setActTimeout(() => {
          refetch()
        }, 5)
        setActTimeout(() => {
          refetch()
        }, 5)
      }, [refetch])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(20)
    // first refetch will not get cancelled, second one gets skipped
    expect(fetchCount).toBe(1)
  })

  it('should be able to watch a query without providing a query function', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    queryClient.setQueryDefaults(key, { queryFn: () => 'data' })

    function Page() {
      const state = useQuery<string>(key)
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'data' })
  })

  it('should pick up a query when re-mounting with cacheTime 0', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const [toggle, setToggle] = React.useState(false)

      return (
        <div>
          <button onClick={() => setToggle(true)}>toggle</button>
          {toggle ? (
            <Component key="2" value="2" />
          ) : (
            <Component key="1" value="1" />
          )}
        </div>
      )
    }

    function Component({ value }: { value: string }) {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'data: ' + value
        },
        {
          cacheTime: 0,
          notifyOnChangeProps: 'all',
        },
      )
      states.push(state)
      return (
        <div>
          <div>{state.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: 1')

    fireEvent.click(rendered.getByRole('button', { name: /toggle/i }))

    await rendered.findByText('data: 2')

    expect(states.length).toBe(4)
    // First load
    expect(states[0]).toMatchObject({
      isLoading: true,
      isSuccess: false,
      isFetching: true,
    })
    // First success
    expect(states[1]).toMatchObject({
      isLoading: false,
      isSuccess: true,
      isFetching: false,
    })
    // Switch, goes to fetching
    expect(states[2]).toMatchObject({
      isLoading: false,
      isSuccess: true,
      isFetching: true,
    })
    // Second success
    expect(states[3]).toMatchObject({
      isLoading: false,
      isSuccess: true,
      isFetching: false,
    })
  })

  it('should not get into an infinite loop when removing a query with cacheTime 0 and rerendering', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const [, rerender] = React.useState({})

      const state = useQuery(
        key,
        async () => {
          await sleep(5)
          return 'data'
        },
        {
          cacheTime: 0,
          notifyOnChangeProps: 'all',
        },
      )

      states.push(state)

      return (
        <>
          <div>{state.data}</div>

          <button
            onClick={() => {
              state.remove()
              rerender({})
            }}
          >
            remove
          </button>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('data')
    })

    fireEvent.click(rendered.getByRole('button', { name: 'remove' }))

    await waitFor(() => {
      rendered.getByText('data')
    })

    // required to make sure no additional renders are happening after data is successfully fetched for the second time
    await sleep(100)

    expect(states.length).toBe(4)
    // First load
    expect(states[0]).toMatchObject({ isLoading: true, isSuccess: false })
    // First success
    expect(states[1]).toMatchObject({ isLoading: false, isSuccess: true })
    // Remove
    expect(states[2]).toMatchObject({ isLoading: true, isSuccess: false })
    // Second success
    expect(states[3]).toMatchObject({ isLoading: false, isSuccess: true })
  })

  it('should fetch when refetchOnMount is false and nothing has been fetched yet', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'test', {
        refetchOnMount: false,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should not fetch when refetchOnMount is false and data has been fetched already', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'test', {
        refetchOnMount: false,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({ data: 'prefetched' })
  })

  it('should be able to select a part of the data with select', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => ({ name: 'test' }), {
        select: (data) => data.name,
      })
      states.push(state)

      return <div>{state.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('test')
    })

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should be able to select a part of the data with select in object syntax', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery({
        queryKey: key,
        queryFn: () => ({ name: 'test' }),
        select: (data) => data.name,
      })
      states.push(state)

      return <div>{state.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('test')
    })

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should throw an error when a selector throws', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []
    const error = new Error('Select Error')

    function Page() {
      const state = useQuery(key, () => ({ name: 'test' }), {
        select: () => {
          throw error
        },
      })
      states.push(state)

      return <div>{state.status}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('error')
    })

    expect(mockLogger.error).toHaveBeenCalledWith(error)
    expect(states.length).toBe(2)

    expect(states[0]).toMatchObject({ status: 'loading', data: undefined })
    expect(states[1]).toMatchObject({ status: 'error', error })
  })

  it('should not re-run a stable select when it re-renders if selector throws an error', async () => {
    const key = queryKey()
    const error = new Error('Select Error')
    let runs = 0

    function Page() {
      const [, rerender] = React.useReducer(() => ({}), {})
      const state = useQuery<string, Error>(
        key,
        () => (runs === 0 ? 'test' : 'test2'),
        {
          select: React.useCallback(() => {
            runs++
            throw error
          }, []),
        },
      )
      return (
        <div>
          <div>error: {state.error?.message}</div>
          <button onClick={rerender}>rerender</button>
          <button onClick={() => state.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('error: Select Error'))
    expect(runs).toEqual(1)
    fireEvent.click(rendered.getByRole('button', { name: 'rerender' }))
    await sleep(10)
    expect(runs).toEqual(1)
    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))
    await sleep(10)
    expect(runs).toEqual(2)
  })

  it('should track properties and only re-render when a tracked property changes', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      states.push(state)

      const { refetch, data } = state

      React.useEffect(() => {
        setActTimeout(() => {
          if (data) {
            refetch()
          }
        }, 20)
      }, [refetch, data])

      return (
        <div>
          <h1>{data ?? null}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('test'))

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should always re-render if we are tracking props but not using any', async () => {
    const key = queryKey()
    let renderCount = 0
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'test')

      states.push(state)

      React.useEffect(() => {
        renderCount++
      }, [state])

      return (
        <div>
          <h1>hello</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      expect(renderCount).toBe(2)
    })

    // give it a bit more time to make sure no additional renders are triggered
    await sleep(20)

    expect(renderCount).toBe(2)
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should be able to remove a query', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const [, rerender] = React.useState({})
      const state = useQuery(key, () => ++count, { notifyOnChangeProps: 'all' })

      states.push(state)

      const { remove } = state

      return (
        <div>
          <button onClick={() => remove()}>remove</button>
          <button onClick={() => rerender({})}>rerender</button>
          data: {state.data ?? 'null'}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /remove/i }))

    await sleep(20)
    fireEvent.click(rendered.getByRole('button', { name: /rerender/i }))
    await waitFor(() => rendered.getByText('data: 2'))

    expect(states.length).toBe(4)
    // Initial
    expect(states[0]).toMatchObject({ status: 'loading', data: undefined })
    // Fetched
    expect(states[1]).toMatchObject({ status: 'success', data: 1 })
    // Remove + Hook state update, batched
    expect(states[2]).toMatchObject({ status: 'loading', data: undefined })
    // Fetched
    expect(states[3]).toMatchObject({ status: 'success', data: 2 })
  })

  it('should create a new query when refetching a removed query', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return ++count
        },
        { notifyOnChangeProps: 'all' },
      )

      states.push(state)

      const { remove, refetch } = state

      return (
        <div>
          <button onClick={() => remove()}>remove</button>
          <button onClick={() => refetch()}>refetch</button>
          data: {state.data ?? 'null'}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /remove/i }))

    await sleep(50)
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await waitFor(() => rendered.getByText('data: 2'))

    expect(states.length).toBe(4)
    // Initial
    expect(states[0]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
    // Fetched
    expect(states[1]).toMatchObject({ data: 1 })
    // Switch
    expect(states[2]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
    // Fetched
    expect(states[3]).toMatchObject({ data: 2 })
  })

  it('should share equal data structures between query results', async () => {
    const key = queryKey()

    const result1 = [
      { id: '1', done: false },
      { id: '2', done: false },
    ]

    const result2 = [
      { id: '1', done: false },
      { id: '2', done: true },
    ]

    const states: UseQueryResult<typeof result1>[] = []

    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count === 1 ? result1 : result2
        },
        { notifyOnChangeProps: 'all' },
      )

      states.push(state)

      const { refetch } = state

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          data: {String(state.data?.[1]?.done)}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: false'))
    await sleep(20)
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await waitFor(() => rendered.getByText('data: true'))

    await waitFor(() => expect(states.length).toBe(4))

    const todos = states[2]?.data
    const todo1 = todos?.[0]
    const todo2 = todos?.[1]

    const newTodos = states[3]?.data
    const newTodo1 = newTodos?.[0]
    const newTodo2 = newTodos?.[1]

    expect(todos).toEqual(result1)
    expect(newTodos).toEqual(result2)
    expect(newTodos).not.toBe(todos)
    expect(newTodo1).toBe(todo1)
    expect(newTodo2).not.toBe(todo2)

    return null
  })

  it('should use query function from hook when the existing query does not have a query function', async () => {
    const key = queryKey()
    const results: DefinedUseQueryResult<string>[] = []

    queryClient.setQueryData(key, 'set')

    function Page() {
      const result = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'fetched'
        },
        {
          initialData: 'initial',
          staleTime: Infinity,
        },
      )

      results.push(result)

      return (
        <div>
          <div>isFetching: {result.isFetching}</div>
          <button onClick={() => queryClient.refetchQueries(key)}>
            refetch
          </button>
          data: {result.data}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: set'))
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await waitFor(() => rendered.getByText('data: fetched'))

    await waitFor(() => expect(results.length).toBe(3))

    expect(results[0]).toMatchObject({ data: 'set', isFetching: false })
    expect(results[1]).toMatchObject({ data: 'set', isFetching: true })
    expect(results[2]).toMatchObject({ data: 'fetched', isFetching: false })
  })

  it('should update query stale state and refetch when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { staleTime: Infinity, notifyOnChangeProps: 'all' },
      )

      states.push(state)

      return (
        <div>
          <button onClick={() => queryClient.invalidateQueries(key)}>
            invalidate
          </button>
          data: {state.data}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
    await waitFor(() => rendered.getByText('data: 2'))

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isRefetching: false,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      data: 1,
      isFetching: false,
      isRefetching: false,
      isSuccess: true,
      isStale: false,
    })
    expect(states[2]).toMatchObject({
      data: 1,
      isFetching: true,
      isRefetching: true,
      isSuccess: true,
      isStale: true,
    })
    expect(states[3]).toMatchObject({
      data: 2,
      isFetching: false,
      isRefetching: false,
      isSuccess: true,
      isStale: false,
    })
  })

  it('should not update disabled query when refetched with refetchQueries', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { enabled: false },
      )

      states.push(state)

      React.useEffect(() => {
        setActTimeout(() => {
          queryClient.refetchQueries({ queryKey: key })
        }, 20)
      }, [])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(50)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
  })

  it('should not refetch disabled query when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { enabled: false },
      )

      states.push(state)

      React.useEffect(() => {
        setActTimeout(() => {
          queryClient.invalidateQueries(key)
        }, 20)
      }, [])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
  })

  it('should not fetch when switching to a disabled query', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(5)
          return count
        },
        { enabled: count === 0 },
      )

      states.push(state)

      return (
        <div>
          <button onClick={() => setCount(1)}>increment</button>
          <div>data: {state.data ?? 'undefined'}</div>
          <div>count: {count}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))

    await waitFor(() => {
      rendered.getByText('count: 1')
      rendered.getByText('data: undefined')
    })

    // making sure no additional fetches are triggered
    await sleep(50)

    expect(states.length).toBe(3)

    // Fetch query
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
    })
    // Fetched query
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
    })
    // Switch to disabled query
    expect(states[2]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
    })
  })

  it('should keep the previous data when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { keepPreviousData: true },
      )

      states.push(state)

      return (
        <div>
          <div>data: {state.data}</div>
          <button onClick={() => setCount(1)}>setCount</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 0'))

    fireEvent.click(rendered.getByRole('button', { name: 'setCount' }))

    await waitFor(() => rendered.getByText('data: 1'))

    // Initial
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isPreviousData: false,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
    // Set state
    expect(states[2]).toMatchObject({
      data: 0,
      isFetching: true,
      isSuccess: true,
      isPreviousData: true,
    })
    // New data
    expect(states[3]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should transition to error state when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    function Page({ count }: { count: number }) {
      const state = useQuery<number, Error>(
        [key, count],
        async () => {
          await sleep(10)
          if (count === 2) {
            throw new Error('Error test')
          }
          return Promise.resolve(count)
        },
        {
          retry: false,
          keepPreviousData: true,
        },
      )

      states.push(state)

      return (
        <div>
          <h1>data: {state.data}</h1>
          <h2>error: {state.error?.message}</h2>
          <p>previous data: {state.isPreviousData}</p>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page count={0} />)
    await waitFor(() => rendered.getByText('data: 0'))
    act(() => rendered.rerender(<Page count={1} />))
    await waitFor(() => rendered.getByText('data: 1'))
    act(() => rendered.rerender(<Page count={2} />))
    await waitFor(() => rendered.getByText('error: Error test'))

    await waitFor(() => expect(states.length).toBe(8))
    // Initial
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      status: 'loading',
      error: null,
      isPreviousData: false,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      status: 'success',
      error: null,
      isPreviousData: false,
    })
    // rerender Page 1
    expect(states[2]).toMatchObject({
      data: 0,
      isFetching: true,
      status: 'success',
      error: null,
      isPreviousData: true,
    })
    // Hook state update
    expect(states[3]).toMatchObject({
      data: 0,
      isFetching: true,
      status: 'success',
      error: null,
      isPreviousData: true,
    })
    // New data
    expect(states[4]).toMatchObject({
      data: 1,
      isFetching: false,
      status: 'success',
      error: null,
      isPreviousData: false,
    })
    // rerender Page 2
    expect(states[5]).toMatchObject({
      data: 1,
      isFetching: true,
      status: 'success',
      error: null,
      isPreviousData: true,
    })
    // Hook state update again
    expect(states[6]).toMatchObject({
      data: 1,
      isFetching: true,
      status: 'success',
      error: null,
      isPreviousData: true,
    })
    // Error
    expect(states[7]).toMatchObject({
      data: undefined,
      isFetching: false,
      status: 'error',
      isPreviousData: false,
    })
    expect(states[7]?.error).toHaveProperty('message', 'Error test')
  })

  it('should not show initial data from next query if keepPreviousData is set', async () => {
    const key = queryKey()
    const states: DefinedUseQueryResult<number>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { initialData: 99, keepPreviousData: true },
      )

      states.push(state)

      return (
        <div>
          <h1>
            data: {state.data}, count: {count}, isFetching:{' '}
            {String(state.isFetching)}
          </h1>
          <button onClick={() => setCount(1)}>inc</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() =>
      rendered.getByText('data: 0, count: 0, isFetching: false'),
    )

    fireEvent.click(rendered.getByRole('button', { name: 'inc' }))

    await waitFor(() =>
      rendered.getByText('data: 1, count: 1, isFetching: false'),
    )

    expect(states.length).toBe(5)

    // Initial
    expect(states[0]).toMatchObject({
      data: 99,
      isFetching: true,
      isSuccess: true,
      isPreviousData: false,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
    // Set state
    expect(states[2]).toMatchObject({
      data: 99,
      isFetching: true,
      isSuccess: true,
      isPreviousData: false,
    })
    // Hook state update
    expect(states[3]).toMatchObject({
      data: 99,
      isFetching: true,
      isSuccess: true,
      isPreviousData: false,
    })
    // New data
    expect(states[4]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should keep the previous data on disabled query when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { enabled: false, keepPreviousData: true, notifyOnChangeProps: 'all' },
      )

      states.push(state)

      return (
        <div>
          <button onClick={() => state.refetch()}>refetch</button>
          <button onClick={() => setCount(1)}>setCount</button>
          <div>data: {state.data ?? 'undefined'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('data: undefined')
    })

    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

    await waitFor(() => {
      rendered.getByText('data: 0')
    })

    fireEvent.click(rendered.getByRole('button', { name: 'setCount' }))

    await waitFor(() => {
      rendered.getByText('data: 0')
    })

    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

    await waitFor(() => {
      rendered.getByText('data: 1')
    })

    // making sure no additional renders are triggered
    await sleep(20)

    expect(states.length).toBe(6)

    // Disabled query
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isPreviousData: false,
    })
    // Fetching query
    expect(states[1]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isPreviousData: false,
    })
    // Fetched query
    expect(states[2]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
    // Set state
    expect(states[3]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPreviousData: true,
    })
    // Fetching new query
    expect(states[4]).toMatchObject({
      data: 0,
      isFetching: true,
      isSuccess: true,
      isPreviousData: true,
    })
    // Fetched new query
    expect(states[5]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should keep the previous data on disabled query when keepPreviousData is set and switching query key multiple times', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    queryClient.setQueryData([key, 10], 10)

    await sleep(10)

    function Page() {
      const [count, setCount] = React.useState(10)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { enabled: false, keepPreviousData: true, notifyOnChangeProps: 'all' },
      )

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        setActTimeout(() => {
          setCount(11)
        }, 20)
        setActTimeout(() => {
          setCount(12)
        }, 30)
        setActTimeout(() => {
          refetch()
        }, 40)
      }, [refetch])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(5)

    // Disabled query
    expect(states[0]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
    // Set state
    expect(states[1]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPreviousData: true,
    })
    // State update
    expect(states[2]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPreviousData: true,
    })
    // Refetch
    expect(states[3]).toMatchObject({
      data: 10,
      isFetching: true,
      isSuccess: true,
      isPreviousData: true,
    })
    // Refetch done
    expect(states[4]).toMatchObject({
      data: 12,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should use the correct query function when components use different configurations', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    function FirstComponent() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 1
        },
        { notifyOnChangeProps: 'all' },
      )
      const refetch = state.refetch

      states.push(state)

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          data: {state.data}
        </div>
      )
    }

    function SecondComponent() {
      useQuery(key, () => 2, { notifyOnChangeProps: 'all' })
      return null
    }

    function Page() {
      return (
        <>
          <FirstComponent />
          <SecondComponent />
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      data: undefined,
    })
    expect(states[1]).toMatchObject({
      data: 1,
    })
    expect(states[2]).toMatchObject({
      data: 1,
    })
    // This state should be 1 instead of 2
    expect(states[3]).toMatchObject({
      data: 1,
    })
  })

  it('should be able to set different stale times for a query', async () => {
    const key = queryKey()
    const states1: UseQueryResult<string>[] = []
    const states2: UseQueryResult<string>[] = []

    await queryClient.prefetchQuery(key, async () => {
      await sleep(10)
      return 'prefetch'
    })

    await sleep(20)

    function FirstComponent() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'one'
        },
        {
          staleTime: 100,
        },
      )
      states1.push(state)
      return null
    }

    function SecondComponent() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'two'
        },
        {
          staleTime: 10,
        },
      )
      states2.push(state)
      return null
    }

    function Page() {
      return (
        <>
          <FirstComponent />
          <SecondComponent />
        </>
      )
    }

    renderWithClient(queryClient, <Page />)

    await sleep(200)

    expect(states1.length).toBe(4)
    expect(states2.length).toBe(3)

    expect(states1).toMatchObject([
      // First render
      {
        data: 'prefetch',
        isStale: false,
      },
      // Second useQuery started fetching
      {
        data: 'prefetch',
        isStale: false,
      },
      // Second useQuery data came in
      {
        data: 'two',
        isStale: false,
      },
      // Data became stale after 100ms
      {
        data: 'two',
        isStale: true,
      },
    ])

    expect(states2).toMatchObject([
      // First render, data is stale and starts fetching
      {
        data: 'prefetch',
        isStale: true,
      },
      // Second useQuery data came in
      {
        data: 'two',
        isStale: false,
      },
      // Data became stale after 5ms
      {
        data: 'two',
        isStale: true,
      },
    ])
  })

  it('should re-render when a query becomes stale', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'test', {
        staleTime: 50,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({ isStale: true })
    expect(states[1]).toMatchObject({ isStale: false })
    expect(states[2]).toMatchObject({ isStale: true })
  })

  describe('notifyOnChangeProps', () => {
    it('should not re-render when it should only re-render on data changes and the data did not change', async () => {
      const key = queryKey()
      const states: UseQueryResult<string>[] = []

      function Page() {
        const state = useQuery(
          key,
          async () => {
            await sleep(5)
            return 'test'
          },
          {
            notifyOnChangeProps: ['data'],
          },
        )

        states.push(state)

        return (
          <>
            <button
              onClick={async () => {
                await state.refetch()
              }}
            >
              refetch
            </button>

            <div>{state.data}</div>
          </>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() => {
        rendered.getByText('test')
      })

      fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

      // sleep is required to make sure no additional renders happen after click
      await sleep(20)

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({
        data: undefined,
        status: 'loading',
        isFetching: true,
      })
      expect(states[1]).toMatchObject({
        data: 'test',
        status: 'success',
        isFetching: false,
      })
    })

    it('should not re-render when it should only re-render only data change and the selected data did not change', async () => {
      const key = queryKey()
      const states: UseQueryResult<string>[] = []

      function Page() {
        const state = useQuery(key, () => ({ name: 'test' }), {
          select: (data) => data.name,
          notifyOnChangeProps: ['data'],
        })

        states.push(state)

        return (
          <div>
            <div>{state.data}</div>
            <button onClick={() => state.refetch()}>refetch</button>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() => {
        rendered.getByText('test')
      })

      fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

      await waitFor(() => {
        rendered.getByText('test')
      })

      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })

      // make sure no additional renders happen
      await sleep(50)
      expect(states.length).toBe(2)
    })

    // See https://github.com/TanStack/query/discussions/5588
    describe('function', () => {
      it('should not re-render when it should only re-render on data changes and the data did not change', async () => {
        const key = queryKey()
        const states: UseQueryResult<string>[] = []

        function Page() {
          const state = useQuery(
            key,
            async () => {
              await sleep(5)
              return 'test'
            },
            {
              notifyOnChangeProps: () => ['data'],
            },
          )

          states.push(state)

          return (
            <>
              <button
                onClick={async () => {
                  await state.refetch()
                }}
              >
                refetch
              </button>

              <div>{state.data}</div>
            </>
          )
        }

        const rendered = renderWithClient(queryClient, <Page />)

        await waitFor(() => {
          rendered.getByText('test')
        })

        fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

        // sleep is required to make sure no additional renders happen after click
        await sleep(20)

        expect(states.length).toBe(2)
        expect(states[0]).toMatchObject({
          data: undefined,
          status: 'loading',
          isFetching: true,
        })
        expect(states[1]).toMatchObject({
          data: 'test',
          status: 'success',
          isFetching: false,
        })
      })

      it('should not re-render when change props are not actively being tracked', async () => {
        const key = queryKey()
        const states: UseQueryResult<string>[] = []

        function Page() {
          const fetchCounterRef = React.useRef(0)
          const trackChangesRef = React.useRef(true)

          const notifyOnChangeProps = React.useCallback(() => {
            return trackChangesRef.current ? 'all' : []
          }, [])

          const state = useQuery(
            key,
            async () => {
              await sleep(5)
              fetchCounterRef.current++
              return `fetch counter: ${fetchCounterRef.current}`
            },
            {
              notifyOnChangeProps,
            },
          )

          states.push(state)

          return (
            <>
              <button
                onClick={async () => {
                  await state.refetch()
                }}
              >
                refetch
              </button>
              <button
                onClick={() => {
                  trackChangesRef.current = true
                }}
              >
                enableTracking
              </button>
              <button
                onClick={() => {
                  trackChangesRef.current = false
                }}
              >
                disableTracking
              </button>

              <div>{state.data}</div>
            </>
          )
        }

        const rendered = renderWithClient(queryClient, <Page />)
        await waitFor(() => {
          rendered.getByText('fetch counter: 1')
        })

        expect(states.length).toBe(2)
        expect(states[0]).toMatchObject({
          data: undefined,
          isFetching: true,
          status: 'loading',
        })
        expect(states[1]).toMatchObject({
          data: 'fetch counter: 1',
          status: 'success',
          isFetching: false,
        })

        // disable tracking and refetch to check for re-renders
        fireEvent.click(
          rendered.getByRole('button', { name: 'disableTracking' }),
        )
        fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

        // sleep is required to make sure no additional renders happen after click
        await sleep(20)
        // still expect to only have two re-renders from the initial fetch
        expect(states.length).toBe(2)

        // enable tracking and refetch to check for re-renders
        fireEvent.click(
          rendered.getByRole('button', { name: 'enableTracking' }),
        )
        fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))

        // sleep is required to make sure no additional renders happen after click
        await sleep(20)

        expect(states.length).toBe(4)
        expect(states[2]).toMatchObject({
          data: 'fetch counter: 2',
          status: 'success',
          isFetching: true,
        })
        expect(states[3]).toMatchObject({
          data: 'fetch counter: 3',
          status: 'success',
          isFetching: false,
        })
      })
    })
  })

  // See https://github.com/tannerlinsley/react-query/issues/137
  it('should not override initial data in dependent queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = useQuery(key1, () => 'data', {
        enabled: false,
        initialData: 'init',
      })

      const second = useQuery(key2, () => 'data', {
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

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('First Data: init')
    rendered.getByText('Second Data: init')
    rendered.getByText('First Status: success')
    rendered.getByText('Second Status: success')
  })

  it('should not override query configuration on render', async () => {
    const key = queryKey()

    const queryFn1 = async () => {
      await sleep(10)
      return 'data1'
    }

    const queryFn2 = async () => {
      await sleep(10)
      return 'data2'
    }

    function Page() {
      useQuery(key, queryFn1)
      useQuery(key, queryFn2)
      return null
    }

    renderWithClient(queryClient, <Page />)

    expect(queryCache.find(key)!.options.queryFn).toBe(queryFn1)
  })

  it('should batch re-renders', async () => {
    const key = queryKey()

    let renders = 0

    const queryFn = async () => {
      await sleep(15)
      return 'data'
    }

    function Page() {
      const query1 = useQuery(key, queryFn)
      const query2 = useQuery(key, queryFn)
      renders++

      return (
        <div>
          {query1.data} {query2.data}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('data data')
    })

    // Should be 2 instead of 3
    expect(renders).toBe(2)
  })

  it('should batch re-renders including hook callbacks', async () => {
    const key = queryKey()

    let renders = 0
    let callbackCount = 0

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    function Page() {
      const [count, setCount] = React.useState(0)
      useQuery(key, queryFn, {
        onSuccess: () => {
          setCount((x) => x + 1)
        },
      })
      useQuery(key, queryFn, {
        onSuccess: () => {
          setCount((x) => x + 1)
        },
      })

      React.useEffect(() => {
        renders++
        callbackCount = count
      })

      return <div>count: {count}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('count: 2'))

    // Should be 2 / 3 instead of 5, uSES batches differently
    expect(renders).toBe(process.env.REACTJS_VERSION === '17' ? 2 : 3)

    // Both callbacks should have been executed
    expect(callbackCount).toBe(2)
  })

  it('should render latest data even if react has discarded certain renders', async () => {
    const key = queryKey()

    function Page() {
      const [, setNewState] = React.useState('state')
      const state = useQuery(key, () => 'data')
      React.useEffect(() => {
        setActTimeout(() => {
          queryClient.setQueryData(key, 'new')
          // Update with same state to make react discard the next render
          setNewState('state')
        }, 10)
      }, [])
      return <div>{state.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('new'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status loading, fetchStatus idle if enabled is false', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = useQuery(key1, () => 'data', {
        enabled: false,
      })
      const second = useQuery(key2, () => 'data')

      return (
        <div>
          <div>
            First Status: {first.status}, {first.fetchStatus}
          </div>
          <div>
            Second Status: {second.status}, {second.fetchStatus}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    // use "act" to wait for state update and prevent console warning

    rendered.getByText('First Status: loading, idle')
    await waitFor(() => rendered.getByText('Second Status: loading, fetching'))
    await waitFor(() => rendered.getByText('Second Status: success, idle'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "loading" state by default', async () => {
    const key = queryKey()

    function Page() {
      const { status } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return <div>status: {status}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('status: loading')
  })

  // See https://github.com/tannerlinsley/react-query/issues/147
  it('should not pass stringified variables to query function', async () => {
    const key = queryKey()
    const variables = { number: 5, boolean: false, object: {}, array: [] }
    type CustomQueryKey = [typeof key, typeof variables]
    const states: UseQueryResult<CustomQueryKey>[] = []

    const queryFn = async (ctx: QueryFunctionContext<CustomQueryKey>) => {
      await sleep(10)
      return ctx.queryKey
    }

    function Page() {
      const state = useQuery([key, variables], queryFn)
      states.push(state)
      return <div>{state.status}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('success')
    })

    expect(states[1]?.data).toEqual([key, variables])
  })

  it('should not refetch query on focus when `enabled` is set to `false`', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')

    function Page() {
      const { data = 'default' } = useQuery(key, queryFn, {
        enabled: false,
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('default'))

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(key, () => count++, {
        staleTime: 0,
        refetchOnWindowFocus: false,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(key, () => count++, {
        staleTime: 0,
        refetchOnWindowFocus: () => false,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(key, () => count++, {
        staleTime: Infinity,
        refetchOnWindowFocus: true,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return count++
        },
        {
          staleTime: Infinity,
          refetchOnWindowFocus: 'always',
        },
      )
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(20)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await sleep(20)

    await waitFor(() => expect(states.length).toBe(4))
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })
  })

  it('should calculate focus behaviour for `refetchOnWindowFocus` depending on function', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return count++
        },
        {
          staleTime: 0,
          retry: 0,
          refetchOnWindowFocus: (query) => (query.state.data || 0) < 1,
        },
      )
      states.push(state)
      return <div>data: {String(state.data)}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('data: 0')

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await rendered.findByText('data: 1')

    // refetch should happen
    expect(states.length).toBe(4)

    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await sleep(20)

    // no more refetch now
    expect(states.length).toBe(4)
  })

  it('should refetch fresh query when refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    await queryClient.prefetchQuery(key, () => 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data', {
        refetchOnMount: 'always',
        staleTime: Infinity,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isStale: false,
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isStale: false,
      isFetching: false,
    })
  })

  it('should refetch stale query when refetchOnMount is set to true', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    await queryClient.prefetchQuery(key, () => 'prefetched')

    await sleep(10)

    function Page() {
      const state = useQuery(key, () => 'data', {
        refetchOnMount: true,
        staleTime: 0,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isStale: true,
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isStale: true,
      isFetching: false,
    })
  })

  it('should set status to error if queryFn throws', async () => {
    const key = queryKey()

    function Page() {
      const { status, error } = useQuery<unknown, string>(
        key,
        () => {
          return Promise.reject('Error test jaylen')
        },
        { retry: false },
      )

      return (
        <div>
          <h1>{status}</h1>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('error'))
    await waitFor(() => rendered.getByText('Error test jaylen'))
  })

  it('should throw error if queryFn throws and useErrorBoundary is in use', async () => {
    const key = queryKey()

    function Page() {
      const { status, error } = useQuery<unknown, string>(
        key,
        () => Promise.reject('Error test jaylen'),
        { retry: false, useErrorBoundary: true },
      )

      return (
        <div>
          <h1>{status}</h1>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
        <Page />
      </ErrorBoundary>,
    )

    await waitFor(() => rendered.getByText('error boundary'))
  })

  it('should update with data if we observe no properties and useErrorBoundary', async () => {
    const key = queryKey()

    let result: UseQueryResult<string> | undefined

    function Page() {
      const query = useQuery(key, () => Promise.resolve('data'), {
        useErrorBoundary: true,
      })

      React.useEffect(() => {
        result = query
      })

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    await waitFor(() => expect(queryClient.isFetching()).toBe(0))

    expect(result?.data).toBe('data')
  })

  it('should set status to error instead of throwing when error should not be thrown', async () => {
    const key = queryKey()

    function Page() {
      const { status, error } = useQuery<unknown, string>(
        key,
        () => Promise.reject('Local Error'),
        {
          retry: false,
          useErrorBoundary: (err) => err !== 'Local Error',
        },
      )

      return (
        <div>
          <h1>{status}</h1>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
        <Page />
      </ErrorBoundary>,
    )

    await waitFor(() => rendered.getByText('error'))
    await waitFor(() => rendered.getByText('Local Error'))
  })

  it('should throw error instead of setting status when error should be thrown', async () => {
    const key = queryKey()

    function Page() {
      const { status, error } = useQuery<unknown, Error>(
        key,
        () => Promise.reject(new Error('Remote Error')),
        {
          retry: false,
          useErrorBoundary: (err) => err.message !== 'Local Error',
        },
      )

      return (
        <div>
          <h1>{status}</h1>
          <h2>{error?.message ?? ''}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div>
            <div>error boundary</div>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
            <div>{error?.message}</div>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>,
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('Remote Error'))
  })

  it('should continue retries when observers unmount and remount while waiting for a retry (#3031)', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const result = useQuery<number, string>(
        key,
        async () => {
          count++
          await sleep(10)
          return Promise.reject('some error')
        },
        {
          retry: 2,
          retryDelay: 100,
        },
      )

      return (
        <div>
          <div>error: {result.error ?? 'null'}</div>
          <div>failureCount: {result.failureCount}</div>
          <div>failureReason: {result.failureReason}</div>
        </div>
      )
    }

    function App() {
      const [show, toggle] = React.useReducer((x) => !x, true)

      return (
        <div>
          <button onClick={toggle}>{show ? 'hide' : 'show'}</button>
          {show && <Page />}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('failureCount: 1'))
    await waitFor(() => rendered.getByText('failureReason: some error'))
    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))
    await waitFor(() => rendered.getByRole('button', { name: /show/i }))
    fireEvent.click(rendered.getByRole('button', { name: /show/i }))
    await waitFor(() => rendered.getByText('error: some error'))

    expect(count).toBe(3)
  })

  it('should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031)', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const result = useQuery<number, string>(
        key,
        async () => {
          count++
          await sleep(10)
          return Promise.reject('some error')
        },
        {
          retry: 2,
          retryDelay: 100,
        },
      )

      return (
        <div>
          <div>error: {result.error ?? 'null'}</div>
          <div>failureCount: {result.failureCount}</div>
          <div>failureReason: {result.failureReason}</div>
        </div>
      )
    }

    function App() {
      const [show, toggle] = React.useReducer((x) => !x, true)

      return (
        <div>
          <button onClick={toggle}>{show ? 'hide' : 'show'}</button>
          <button onClick={() => queryClient.cancelQueries({ queryKey: key })}>
            cancel
          </button>
          {show && <Page />}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('failureCount: 1'))
    await waitFor(() => rendered.getByText('failureReason: some error'))
    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))
    fireEvent.click(rendered.getByRole('button', { name: /cancel/i }))
    await waitFor(() => rendered.getByRole('button', { name: /show/i }))
    fireEvent.click(rendered.getByRole('button', { name: /show/i }))
    await waitFor(() => rendered.getByText('error: some error'))

    // initial fetch (1), which will be cancelled, followed by new mount(2) + 2 retries = 4
    expect(count).toBe(4)
  })

  it('should always fetch if refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    await queryClient.prefetchQuery(key, () => 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data', {
        refetchOnMount: 'always',
        staleTime: 50,
      })
      states.push(state)
      return (
        <div>
          <div>data: {state.data ?? 'null'}</div>
          <div>isFetching: {state.isFetching}</div>
          <div>isStale: {state.isStale}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: data'))
    await waitFor(() => expect(states.length).toBe(3))

    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isStale: false,
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isStale: false,
      isFetching: false,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isStale: true,
      isFetching: false,
    })
  })

  it('should fetch if initial data is set', async () => {
    const key = queryKey()
    const states: DefinedUseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', {
        initialData: 'initial',
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(50)

    expect(states.length).toBe(2)

    expect(states[0]).toMatchObject({
      data: 'initial',
      isStale: true,
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isStale: true,
      isFetching: false,
    })
  })

  it('should not fetch if initial data is set with a stale time', async () => {
    const key = queryKey()
    const states: DefinedUseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', {
        staleTime: 50,
        initialData: 'initial',
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      data: 'initial',
      isStale: false,
      isFetching: false,
    })
    expect(states[1]).toMatchObject({
      data: 'initial',
      isStale: true,
      isFetching: false,
    })
  })

  it('should fetch if initial data updated at is older than stale time', async () => {
    const key = queryKey()
    const states: DefinedUseQueryResult<string>[] = []

    const oneSecondAgo = Date.now() - 1000

    function Page() {
      const state = useQuery(key, () => 'data', {
        staleTime: 50,
        initialData: 'initial',
        initialDataUpdatedAt: oneSecondAgo,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({
      data: 'initial',
      isStale: true,
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isStale: false,
      isFetching: false,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isStale: true,
      isFetching: false,
    })
  })

  it('should fetch if "initial data updated at" is exactly 0', async () => {
    const key = queryKey()
    const states: DefinedUseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', {
        staleTime: 10 * 1000, // 10 seconds
        initialData: 'initial',
        initialDataUpdatedAt: 0,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      data: 'initial',
      isStale: true,
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isStale: false,
      isFetching: false,
    })
  })

  it('should keep initial data when the query key changes', async () => {
    const key = queryKey()
    const states: DefinedUseQueryResult<{ count: number }>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)
      const state = useQuery([key, count], () => ({ count: 10 }), {
        staleTime: Infinity,
        initialData: () => ({ count }),
      })
      states.push(state)

      React.useEffect(() => {
        setActTimeout(() => {
          setCount(1)
        }, 10)
      }, [])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)

    expect(states.length).toBe(2)
    // Initial
    expect(states[0]).toMatchObject({ data: { count: 0 } })
    // Set state
    expect(states[1]).toMatchObject({ data: { count: 1 } })
  })

  it('should retry specified number of times', async () => {
    const key = queryKey()

    const queryFn = jest.fn<unknown, unknown[]>()
    queryFn.mockImplementation(() => {
      return Promise.reject('Error test Barrett')
    })

    function Page() {
      const { status, failureCount, failureReason } = useQuery<unknown, string>(
        key,
        queryFn,
        {
          retry: 1,
          retryDelay: 1,
        },
      )

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
          <h2>Failed because {failureReason}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('error'))

    // query should fail `retry + 1` times, since first time isn't a "retry"
    await waitFor(() => rendered.getByText('Failed 2 times'))
    await waitFor(() => rendered.getByText('Failed because Error test Barrett'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should not retry if retry function `false`', async () => {
    const key = queryKey()

    const queryFn = jest.fn<unknown, unknown[]>()

    queryFn.mockImplementationOnce(() => {
      return Promise.reject('Error test Tanner')
    })

    queryFn.mockImplementation(() => {
      return Promise.reject('NoRetry')
    })

    function Page() {
      const { status, failureCount, failureReason, error } = useQuery<
        unknown,
        string,
        [string]
      >(key, queryFn, {
        retryDelay: 1,
        retry: (_failureCount, err) => err !== 'NoRetry',
      })

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
          <h2>Failed because {failureReason}</h2>
          <h2>{error}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('error'))

    await waitFor(() => rendered.getByText('Failed 2 times'))
    await waitFor(() => rendered.getByText('Failed because NoRetry'))

    await waitFor(() => rendered.getByText('NoRetry'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should extract retryDelay from error', async () => {
    const key = queryKey()

    type DelayError = { delay: number }

    const queryFn = jest.fn<unknown, unknown[]>()
    queryFn.mockImplementation(() => {
      return Promise.reject({ delay: 50 })
    })

    function Page() {
      const { status, failureCount, failureReason } = useQuery(key, queryFn, {
        retry: 1,
        retryDelay: (_, error: DelayError) => error.delay,
      })

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
          <h2>Failed because DelayError: {failureReason?.delay}ms</h2>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(queryFn).toHaveBeenCalledTimes(1)

    await waitFor(() => rendered.getByText('Failed because DelayError: 50ms'))
    await waitFor(() => rendered.getByText('Failed 2 times'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0

    function Page() {
      const query = useQuery<unknown, string>(
        key,
        () => {
          count++
          return Promise.reject<unknown>(`fetching error ${count}`)
        },
        {
          retry: 3,
          retryDelay: 1,
        },
      )

      return (
        <div>
          <div>error {String(query.error)}</div>
          <div>status {query.status}</div>
          <div>failureCount {query.failureCount}</div>
          <div>failureReason {query.failureReason}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    // The query should display the first error result
    await waitFor(() => rendered.getByText('failureCount 1'))
    await waitFor(() => rendered.getByText('failureReason fetching error 1'))
    await waitFor(() => rendered.getByText('status loading'))
    await waitFor(() => rendered.getByText('error null'))

    // Check if the query really paused
    await sleep(10)
    await waitFor(() => rendered.getByText('failureCount 1'))
    await waitFor(() => rendered.getByText('failureReason fetching error 1'))

    act(() => {
      // reset visibilityState to original value
      visibilityMock.mockRestore()
      window.dispatchEvent(new FocusEvent('focus'))
    })

    // Wait for the final result
    await waitFor(() => rendered.getByText('failureCount 4'))
    await waitFor(() => rendered.getByText('failureReason fetching error 4'))
    await waitFor(() => rendered.getByText('status error'))
    await waitFor(() => rendered.getByText('error fetching error 4'))

    // Check if the query really stopped
    await sleep(10)
    await waitFor(() => rendered.getByText('failureCount 4'))
    await waitFor(() => rendered.getByText('failureReason fetching error 4'))

    // Check if the error has been logged in the console
    expect(mockLogger.error).toHaveBeenCalledWith('fetching error 4')
  })

  it('should fetch on mount when a query was already created with setQueryData', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data')
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states).toMatchObject([
      {
        data: 'prefetched',
        isFetching: true,
        isStale: true,
      },
      {
        data: 'data',
        isFetching: false,
        isStale: true,
      },
    ])
  })

  it('should refetch after focus regain', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    // set data in cache to check if the hook query fn is actually called
    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(key, async () => {
        await sleep(10)
        return 'data'
      })
      states.push(state)
      return (
        <div>
          {state.data}, {state.isStale}, {state.isFetching}
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    await waitFor(() => expect(states.length).toBe(2))

    act(() => {
      // reset visibilityState to original value
      visibilityMock.mockRestore()
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitFor(() => expect(states.length).toBe(4))

    expect(states).toMatchObject([
      {
        data: 'prefetched',
        isFetching: true,
        isStale: true,
      },
      {
        data: 'data',
        isFetching: false,
        isStale: true,
      },
      {
        data: 'data',
        isFetching: true,
        isStale: true,
      },
      {
        data: 'data',
        isFetching: false,
        isStale: true,
      },
    ])
  })

  // See https://github.com/tannerlinsley/react-query/issues/195
  it('should refetch if stale after a prefetch', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    const queryFn = jest.fn<string, unknown[]>()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = jest.fn<string, unknown[]>()
    prefetchQueryFn.mockImplementation(() => 'not yet...')

    await queryClient.prefetchQuery(key, prefetchQueryFn, {
      staleTime: 10,
    })

    await sleep(11)

    function Page() {
      const state = useQuery(key, queryFn)
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await waitFor(() => expect(states.length).toBe(2))

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not refetch if not stale after a prefetch', async () => {
    const key = queryKey()

    const queryFn = jest.fn<string, unknown[]>()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = jest.fn<Promise<string>, unknown[]>()
    prefetchQueryFn.mockImplementation(async () => {
      await sleep(10)
      return 'not yet...'
    })

    await queryClient.prefetchQuery(key, prefetchQueryFn, {
      staleTime: 1000,
    })

    await sleep(0)

    function Page() {
      useQuery(key, queryFn, {
        staleTime: 1000,
      })
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(0)

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  // See https://github.com/tannerlinsley/react-query/issues/190
  it('should reset failureCount on successful fetch', async () => {
    const key = queryKey()

    function Page() {
      let counter = 0

      const query = useQuery<string, Error>(
        key,
        async () => {
          if (counter < 2) {
            counter++
            throw new Error('error')
          } else {
            return 'data'
          }
        },
        { retryDelay: 10 },
      )

      return (
        <div>
          <div>failureCount {query.failureCount}</div>
          <div>failureReason {query.failureReason?.message ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('failureCount 2'))
    await waitFor(() => rendered.getByText('failureReason error'))
    await waitFor(() => rendered.getByText('failureCount 0'))
    await waitFor(() => rendered.getByText('failureReason null'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/199
  it('should use prefetched data for dependent query', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const [isPrefetched, setPrefetched] = React.useState(false)

      const query = useQuery(
        key,
        async () => {
          count++
          await sleep(10)
          return count
        },
        {
          enabled,
        },
      )

      React.useEffect(() => {
        async function prefetch() {
          await queryClient.prefetchQuery(key, () =>
            Promise.resolve('prefetched data'),
          )
          act(() => setPrefetched(true))
        }

        prefetch()
      }, [])

      return (
        <div>
          {isPrefetched && <div>isPrefetched</div>}
          <button onClick={() => setEnabled(true)}>setKey</button>
          <div>data: {query.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('isPrefetched'))

    fireEvent.click(rendered.getByText('setKey'))
    await waitFor(() => rendered.getByText('data: prefetched data'))
    await waitFor(() => rendered.getByText('data: 1'))
    expect(count).toBe(1)
  })

  it('should support dependent queries via the enable config option', async () => {
    const key = queryKey()

    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(false)

      const query = useQuery(key, () => 'data', {
        enabled: shouldFetch,
      })

      return (
        <div>
          <div>FetchStatus: {query.fetchStatus}</div>
          <h2>Data: {query.data || 'no data'}</h2>
          {query.isStale ? (
            <button onClick={() => setShouldFetch(true)}>fetch</button>
          ) : null}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('FetchStatus: idle')
    rendered.getByText('Data: no data')

    fireEvent.click(rendered.getByText('fetch'))

    await waitFor(() => rendered.getByText('FetchStatus: fetching'))
    await waitFor(() => [
      rendered.getByText('FetchStatus: idle'),
      rendered.getByText('Data: data'),
    ])
  })

  it('should mark query as fetching, when using initialData', async () => {
    const key = queryKey()
    const results: DefinedUseQueryResult<string>[] = []

    function Page() {
      const result = useQuery(key, () => 'serverData', { initialData: 'data' })
      results.push(result)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 'data', isFetching: true })
    expect(results[1]).toMatchObject({ data: 'serverData', isFetching: false })
  })

  it('should initialize state properly, when initialData is falsy', async () => {
    const key = queryKey()
    const results: DefinedUseQueryResult<number>[] = []

    function Page() {
      const result = useQuery(key, () => 1, { initialData: 0 })
      results.push(result)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 0, isFetching: true })
    expect(results[1]).toMatchObject({ data: 1, isFetching: false })
  })

  it('should show the correct data when switching keys with initialData, keepPreviousData & staleTime', async () => {
    const key = queryKey()

    const ALL_TODOS = [
      { name: 'todo A', priority: 'high' },
      { name: 'todo B', priority: 'medium' },
    ]

    const initialTodos = ALL_TODOS

    function Page() {
      const [filter, setFilter] = React.useState('')
      const { data: todos } = useQuery(
        [...key, filter],
        async () => {
          return ALL_TODOS.filter((todo) =>
            filter ? todo.priority === filter : true,
          )
        },
        {
          initialData() {
            return filter === '' ? initialTodos : undefined
          },
          keepPreviousData: true,
          staleTime: 5000,
        },
      )

      return (
        <div>
          Current Todos, filter: {filter || 'all'}
          <hr />
          <button onClick={() => setFilter('')}>All</button>
          <button onClick={() => setFilter('high')}>High</button>
          <ul>
            {(todos ?? []).map((todo) => (
              <li key={todo.name}>
                {todo.name} - {todo.priority}
              </li>
            ))}
          </ul>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Current Todos, filter: all'))

    fireEvent.click(rendered.getByRole('button', { name: /high/i }))
    await waitFor(() => rendered.getByText('Current Todos, filter: high'))
    fireEvent.click(rendered.getByRole('button', { name: /all/i }))
    await waitFor(() => rendered.getByText('todo B - medium'))
  })

  // // See https://github.com/tannerlinsley/react-query/issues/214
  it('data should persist when enabled is changed to false', async () => {
    const key = queryKey()
    const results: DefinedUseQueryResult<string>[] = []

    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(true)

      const result = useQuery(key, () => 'fetched data', {
        enabled: shouldFetch,
        initialData: shouldFetch ? 'initial' : 'initial falsy',
      })

      results.push(result)

      return (
        <div>
          <div>{result.data}</div>
          <div>{shouldFetch ? 'enabled' : 'disabled'}</div>
          <button
            onClick={() => {
              setShouldFetch(false)
            }}
          >
            enable
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('fetched data')
      rendered.getByText('enabled')
    })

    fireEvent.click(rendered.getByRole('button', { name: /enable/i }))

    await waitFor(() => {
      rendered.getByText('fetched data')
      rendered.getByText('disabled')
    })

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject({ data: 'initial', isStale: true })
    expect(results[1]).toMatchObject({ data: 'fetched data', isStale: true })
    expect(results[2]).toMatchObject({ data: 'fetched data', isStale: true })
  })

  it('it should support enabled:false in query object syntax', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>()
    queryFn.mockImplementation(() => 'data')

    function Page() {
      const { fetchStatus } = useQuery({
        queryKey: key,
        queryFn,
        enabled: false,
      })
      return <div>fetchStatus: {fetchStatus}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(queryFn).not.toHaveBeenCalled()
    expect(queryCache.find(key)).not.toBeUndefined()
    rendered.getByText('fetchStatus: idle')
  })

  // See https://github.com/tannerlinsley/react-query/issues/360
  test('should init to status:loading, fetchStatus:idle when enabled is false', async () => {
    const key = queryKey()

    function Page() {
      const query = useQuery(key, () => 'data', {
        enabled: false,
      })

      return (
        <div>
          <div>
            status: {query.status}, {query.fetchStatus}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('status: loading, idle'))
  })

  test('should not schedule garbage collection, if cacheTimeout is set to `Infinity`', async () => {
    const key = queryKey()

    function Page() {
      const query = useQuery(key, () => 'fetched data', {
        cacheTime: Infinity,
      })
      return <div>{query.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('fetched data'))

    rendered.unmount()

    const query = queryCache.find(key)
    // @ts-expect-error
    expect(query!.cacheTimeout).toBe(undefined)
  })

  it('should not cause memo churn when data does not change', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
    const memoFn = jest.fn()

    function Page() {
      const result = useQuery(key, async () => {
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

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('status loading'))
    await waitFor(() => rendered.getByText('status success'))
    fireEvent.click(rendered.getByText('refetch'))
    await waitFor(() => rendered.getByText('isFetching true'))
    await waitFor(() => rendered.getByText('isFetching false'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(memoFn).toHaveBeenCalledTimes(2)
  })

  it('should update data upon interval changes', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const [int, setInt] = React.useState(200)
      const { data } = useQuery(key, () => count++, {
        refetchInterval: int,
      })

      React.useEffect(() => {
        if (data === 2) {
          setInt(0)
        }
      }, [data])

      return <div>count: {data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    // mount
    await waitFor(() => rendered.getByText('count: 0'))
    await waitFor(() => rendered.getByText('count: 1'))
    await waitFor(() => rendered.getByText('count: 2'))
  })

  it('should refetch in an interval depending on function result', async () => {
    const key = queryKey()
    let count = 0
    const states: UseQueryResult<number>[] = []

    function Page() {
      const queryInfo = useQuery(
        key,
        async () => {
          await sleep(10)
          return count++
        },
        {
          refetchInterval: (data = 0) => (data < 2 ? 10 : false),
        },
      )

      states.push(queryInfo)

      return (
        <div>
          <h1>count: {queryInfo.data}</h1>
          <h2>status: {queryInfo.status}</h2>
          <h2>data: {queryInfo.data}</h2>
          <h2>refetch: {queryInfo.isRefetching}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('count: 2'))

    expect(states.length).toEqual(6)

    expect(states).toMatchObject([
      {
        status: 'loading',
        isFetching: true,
        data: undefined,
      },
      {
        status: 'success',
        isFetching: false,
        data: 0,
      },
      {
        status: 'success',
        isFetching: true,
        data: 0,
      },
      {
        status: 'success',
        isFetching: false,
        data: 1,
      },
      {
        status: 'success',
        isFetching: true,
        data: 1,
      },
      {
        status: 'success',
        isFetching: false,
        data: 2,
      },
    ])
  })

  it('should not interval fetch with a refetchInterval of 0', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    function Page() {
      const queryInfo = useQuery(key, () => 1, {
        refetchInterval: 0,
      })

      states.push(queryInfo)

      return <div>count: {queryInfo.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('count: 1'))

    await sleep(10) //extra sleep to make sure we're not re-fetching

    expect(states.length).toEqual(2)

    expect(states).toMatchObject([
      {
        status: 'loading',
        isFetching: true,
        data: undefined,
      },
      {
        status: 'success',
        isFetching: false,
        data: 1,
      },
    ])
  })

  it('should accept an empty string as query key', async () => {
    function Page() {
      const result = useQuery([''], (ctx) => ctx.queryKey)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText(''))
  })

  it('should accept an object as query key', async () => {
    function Page() {
      const result = useQuery([{ a: 'a' }], (ctx) => ctx.queryKey)
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('[{"a":"a"}]'))
  })

  it('should refetch if any query instance becomes enabled', async () => {
    const key = queryKey()

    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')

    function Disabled() {
      useQuery(key, queryFn, { enabled: false })
      return null
    }

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const result = useQuery(key, queryFn, { enabled })
      return (
        <>
          <Disabled />
          <div>{result.data}</div>
          <button onClick={() => setEnabled(true)}>enable</button>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    expect(queryFn).toHaveBeenCalledTimes(0)
    fireEvent.click(rendered.getByText('enable'))
    await waitFor(() => rendered.getByText('data'))
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use placeholder data while the query loads', async () => {
    const key1 = queryKey()

    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key1, () => 'data', {
        placeholderData: 'placeholder',
      })

      states.push(state)

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: data'))

    expect(states).toMatchObject([
      {
        isSuccess: true,
        isPlaceholderData: true,
        data: 'placeholder',
      },
      {
        isSuccess: true,
        isPlaceholderData: false,
        data: 'data',
      },
    ])
  })

  it('should use placeholder data even for disabled queries', async () => {
    const key1 = queryKey()

    const states: { state: UseQueryResult<string>; count: number }[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(key1, () => 'data', {
        placeholderData: 'placeholder',
        enabled: count === 0,
      })

      states.push({ state, count })

      React.useEffect(() => {
        setCount(1)
      }, [])

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: data'))

    expect(states).toMatchObject([
      {
        state: {
          isSuccess: true,
          isPlaceholderData: true,
          data: 'placeholder',
        },
        count: 0,
      },
      {
        state: {
          isSuccess: true,
          isPlaceholderData: true,
          data: 'placeholder',
        },
        count: 1,
      },
      {
        state: {
          isSuccess: true,
          isPlaceholderData: false,
          data: 'data',
        },
        count: 1,
      },
    ])
  })

  it('placeholder data should run through select', async () => {
    const key1 = queryKey()

    const states: UseQueryResult<string>[] = []

    function Page() {
      const state = useQuery(key1, () => 1, {
        placeholderData: 23,
        select: (data) => String(data * 2),
      })

      states.push(state)

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: 2'))

    expect(states).toMatchObject([
      {
        isSuccess: true,
        isPlaceholderData: true,
        data: '46',
      },
      {
        isSuccess: true,
        isPlaceholderData: false,
        data: '2',
      },
    ])
  })

  it('placeholder data function result should run through select', async () => {
    const key1 = queryKey()

    const states: UseQueryResult<string>[] = []
    let placeholderFunctionRunCount = 0

    function Page() {
      const state = useQuery(key1, () => 1, {
        placeholderData: () => {
          placeholderFunctionRunCount++
          return 23
        },
        select: (data) => String(data * 2),
      })

      states.push(state)

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: 2'))

    rendered.rerender(<Page />)

    expect(states).toMatchObject([
      {
        isSuccess: true,
        isPlaceholderData: true,
        data: '46',
      },
      {
        isSuccess: true,
        isPlaceholderData: false,
        data: '2',
      },
      {
        isSuccess: true,
        isPlaceholderData: false,
        data: '2',
      },
    ])

    expect(placeholderFunctionRunCount).toEqual(1)
  })

  it('select should only run when dependencies change if memoized', async () => {
    const key1 = queryKey()

    let selectRun = 0

    function Page() {
      const [count, inc] = React.useReducer((prev) => prev + 1, 2)

      const state = useQuery(
        key1,
        async () => {
          await sleep(10)
          return 0
        },
        {
          select: React.useCallback(
            (data: number) => {
              selectRun++
              return `selected ${data + count}`
            },
            [count],
          ),
          placeholderData: 99,
        },
      )

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <button onClick={inc}>inc: {count}</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: selected 101')) // 99 + 2
    expect(selectRun).toBe(1)

    await waitFor(() => rendered.getByText('Data: selected 2')) // 0 + 2
    expect(selectRun).toBe(2)

    fireEvent.click(rendered.getByRole('button', { name: /inc/i }))

    await waitFor(() => rendered.getByText('Data: selected 3')) // 0 + 3
    expect(selectRun).toBe(3)
  })

  it('select should always return the correct state', async () => {
    const key1 = queryKey()

    function Page() {
      const [count, inc] = React.useReducer((prev) => prev + 1, 2)
      const [forceValue, forceUpdate] = React.useReducer((prev) => prev + 1, 1)

      const state = useQuery(
        key1,
        async () => {
          await sleep(10)
          return 0
        },
        {
          select: React.useCallback(
            (data: number) => {
              return `selected ${data + count}`
            },
            [count],
          ),
          placeholderData: 99,
        },
      )

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <h2>forceValue: {forceValue}</h2>
          <button onClick={inc}>inc: {count}</button>
          <button onClick={forceUpdate}>forceUpdate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: selected 101')) // 99 + 2

    await waitFor(() => rendered.getByText('Data: selected 2')) // 0 + 2

    fireEvent.click(rendered.getByRole('button', { name: /inc/i }))

    await waitFor(() => rendered.getByText('Data: selected 3')) // 0 + 3

    fireEvent.click(rendered.getByRole('button', { name: /forceUpdate/i }))

    await waitFor(() => rendered.getByText('forceValue: 2'))
    // data should still be 3 after an independent re-render
    await waitFor(() => rendered.getByText('Data: selected 3'))
  })

  it('select should structurally share data', async () => {
    const key1 = queryKey()
    const states: Array<Array<number>> = []

    function Page() {
      const [forceValue, forceUpdate] = React.useReducer((prev) => prev + 1, 1)

      const state = useQuery(
        key1,
        async () => {
          await sleep(10)
          return [1, 2]
        },
        {
          select: (res) => res.map((x) => x + 1),
        },
      )

      React.useEffect(() => {
        if (state.data) {
          states.push(state.data)
        }
      }, [state.data])

      return (
        <div>
          <h2>Data: {JSON.stringify(state.data)}</h2>
          <h2>forceValue: {forceValue}</h2>
          <button onClick={forceUpdate}>forceUpdate</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('Data: [2,3]'))
    expect(states).toHaveLength(1)

    fireEvent.click(rendered.getByRole('button', { name: /forceUpdate/i }))

    await waitFor(() => rendered.getByText('forceValue: 2'))
    await waitFor(() => rendered.getByText('Data: [2,3]'))

    // effect should not be triggered again due to structural sharing
    expect(states).toHaveLength(1)
  })

  it('should cancel the query function when there are no more subscriptions', async () => {
    const key = queryKey()
    let cancelFn: jest.Mock = jest.fn()

    const queryFn = ({ signal }: { signal?: AbortSignal }) => {
      const promise = new Promise<string>((resolve, reject) => {
        cancelFn = jest.fn(() => reject('Cancelled'))
        signal?.addEventListener('abort', cancelFn)
        sleep(20).then(() => resolve('OK'))
      })

      return promise
    }

    function Page() {
      const state = useQuery(key, queryFn)
      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <Blink duration={5}>
        <Page />
      </Blink>,
    )

    await waitFor(() => rendered.getByText('off'))

    expect(cancelFn).toHaveBeenCalled()
  })

  it('should cancel the query if the signal was consumed and there are no more subscriptions', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    const queryFn: QueryFunction<string, [typeof key, number]> = async (
      ctx,
    ) => {
      const [, limit] = ctx.queryKey
      const value = limit % 2 && ctx.signal ? 'abort' : `data ${limit}`
      await sleep(25)
      return value
    }

    function Page(props: { limit: number }) {
      const state = useQuery([key, props.limit], queryFn)
      states[props.limit] = state
      return (
        <div>
          <h1>Status: {state.status}</h1>
          <h1>data: {state.data}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <Blink duration={5}>
        <Page limit={0} />
        <Page limit={1} />
        <Page limit={2} />
        <Page limit={3} />
      </Blink>,
    )

    await waitFor(() => rendered.getByText('off'))
    await sleep(20)

    await waitFor(() => expect(states).toHaveLength(4))

    expect(queryCache.find([key, 0])?.state).toMatchObject({
      data: 'data 0',
      status: 'success',
      dataUpdateCount: 1,
    })

    expect(queryCache.find([key, 1])?.state).toMatchObject({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
    })

    expect(queryCache.find([key, 2])?.state).toMatchObject({
      data: 'data 2',
      status: 'success',
      dataUpdateCount: 1,
    })

    expect(queryCache.find([key, 3])?.state).toMatchObject({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
    })
  })

  it('should refetch when quickly switching to a failed query', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    const queryFn = async () => {
      await sleep(50)
      return 'OK'
    }

    function Page() {
      const [id, setId] = React.useState(1)
      const [hasChanged, setHasChanged] = React.useState(false)

      const state = useQuery([key, id], queryFn)

      states.push(state)

      React.useEffect(() => {
        setId((prevId) => (prevId === 1 ? 2 : 1))
        setHasChanged(true)
      }, [hasChanged])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)
    expect(states.length).toBe(4)
    // Load query 1
    expect(states[0]).toMatchObject({
      status: 'loading',
      error: null,
    })
    // Load query 2
    expect(states[1]).toMatchObject({
      status: 'loading',
      error: null,
    })
    // Load query 1
    expect(states[2]).toMatchObject({
      status: 'loading',
      error: null,
    })
    // Loaded query 1
    expect(states[3]).toMatchObject({
      status: 'success',
      error: null,
    })
  })

  it('should update query state and refetch when reset with resetQueries', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { staleTime: Infinity },
      )

      states.push(state)

      return (
        <div>
          <button onClick={() => queryClient.resetQueries(key)}>reset</button>
          <div>data: {state.data ?? 'null'}</div>
          <div>isFetching: {state.isFetching}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))

    await waitFor(() => expect(states.length).toBe(4))

    await waitFor(() => rendered.getByText('data: 2'))

    expect(count).toBe(2)

    expect(states[0]).toMatchObject({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      data: 1,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
    expect(states[2]).toMatchObject({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[3]).toMatchObject({
      data: 2,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
  })

  it('should update query state and not refetch when resetting a disabled query with resetQueries', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { staleTime: Infinity, enabled: false, notifyOnChangeProps: 'all' },
      )

      states.push(state)

      const { refetch } = state

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          <button onClick={() => queryClient.resetQueries(key)}>reset</button>
          <div>data: {state.data ?? 'null'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: null'))
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))

    await waitFor(() => rendered.getByText('data: null'))
    await waitFor(() => expect(states.length).toBe(4))

    expect(count).toBe(1)

    expect(states[0]).toMatchObject({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[2]).toMatchObject({
      data: 1,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
    expect(states[3]).toMatchObject({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
  })

  it('should only call the query hash function once each render', async () => {
    const key = queryKey()

    let hashes = 0
    let renders = 0

    function queryKeyHashFn(x: any) {
      hashes++
      return JSON.stringify(x)
    }

    function Page() {
      React.useEffect(() => {
        renders++
      })

      useQuery(key, () => 'test', { queryKeyHashFn })
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(renders).toBe(hashes)
  })

  it('should refetch when changed enabled to true in error state', async () => {
    const queryFn = jest.fn<unknown, unknown[]>()
    queryFn.mockImplementation(async () => {
      await sleep(10)
      return Promise.reject(new Error('Suspense Error Bingo'))
    })

    function Page({ enabled }: { enabled: boolean }) {
      const { error, isLoading } = useQuery(['key'], queryFn, {
        enabled,
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      })

      if (isLoading) {
        return <div>status: loading</div>
      }
      if (error instanceof Error) {
        return <div>error</div>
      }
      return <div>rendered</div>
    }

    function App() {
      const [enabled, toggle] = React.useReducer((x) => !x, true)

      return (
        <div>
          <Page enabled={enabled} />
          <button aria-label="retry" onClick={toggle}>
            retry {enabled}
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // initial state check
    rendered.getByText('status: loading')

    // // render error state component
    await waitFor(() => rendered.getByText('error'))
    expect(queryFn).toBeCalledTimes(1)

    // change to enabled to false
    fireEvent.click(rendered.getByLabelText('retry'))
    await waitFor(() => rendered.getByText('error'))
    expect(queryFn).toBeCalledTimes(1)

    // // change to enabled to true
    fireEvent.click(rendered.getByLabelText('retry'))
    expect(queryFn).toBeCalledTimes(2)
  })

  it('should refetch when query key changed when previous status is error', async () => {
    function Page({ id }: { id: number }) {
      const { error, isLoading } = useQuery(
        [id],
        async () => {
          await sleep(10)
          if (id % 2 === 1) {
            return Promise.reject(new Error('Error'))
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          retryOnMount: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
        },
      )

      if (isLoading) {
        return <div>status: loading</div>
      }
      if (error instanceof Error) {
        return <div>error</div>
      }
      return <div>rendered</div>
    }

    function App() {
      const [id, changeId] = React.useReducer((x) => x + 1, 1)

      return (
        <div>
          <Page id={id} />
          <button aria-label="change" onClick={changeId}>
            change {id}
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // initial state check
    rendered.getByText('status: loading')

    // render error state component
    await waitFor(() => rendered.getByText('error'))

    // change to unmount query
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('rendered'))

    // change to mount new query
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('error'))
  })

  it('should refetch when query key changed when switching between erroneous queries', async () => {
    function Page({ id }: { id: boolean }) {
      const { error, isFetching } = useQuery(
        [id],
        async () => {
          await sleep(10)
          return Promise.reject<unknown>(new Error('Error'))
        },
        {
          retry: false,
          retryOnMount: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
        },
      )

      if (isFetching) {
        return <div>status: fetching</div>
      }
      if (error instanceof Error) {
        return <div>error</div>
      }
      return <div>rendered</div>
    }

    function App() {
      const [value, toggle] = React.useReducer((x) => !x, true)

      return (
        <div>
          <Page id={value} />
          <button aria-label="change" onClick={toggle}>
            change {value}
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // initial state check
    rendered.getByText('status: fetching')

    // render error state component
    await waitFor(() => rendered.getByText('error'))

    // change to mount second query
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('status: fetching'))
    await waitFor(() => rendered.getByText('error'))

    // change to mount first query again
    fireEvent.click(rendered.getByLabelText('change'))
    await waitFor(() => rendered.getByText('status: fetching'))
    await waitFor(() => rendered.getByText('error'))
  })

  it('should have no error in loading state when refetching after error occurred', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []
    const error = new Error('oops')

    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          if (count === 0) {
            count++
            throw error
          }
          return 5
        },
        {
          retry: false,
        },
      )

      states.push(state)

      if (state.isLoading) {
        return <div>status: loading</div>
      }
      if (state.error instanceof Error) {
        return (
          <div>
            <div>error</div>
            <button onClick={() => state.refetch()}>refetch</button>
          </div>
        )
      }
      return <div>data: {state.data}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('error'))

    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))
    await waitFor(() => rendered.getByText('data: 5'))

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      status: 'loading',
      data: undefined,
      error: null,
    })

    expect(states[1]).toMatchObject({
      status: 'error',
      data: undefined,
      error,
    })

    expect(states[2]).toMatchObject({
      status: 'loading',
      data: undefined,
      error: null,
    })

    expect(states[3]).toMatchObject({
      status: 'success',
      data: 5,
      error: null,
    })
  })

  describe('networkMode online', () => {
    it('online queries should not start fetching if you are offline', async () => {
      const onlineMock = mockNavigatorOnLine(false)

      const key = queryKey()
      const states: Array<any> = []

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            return 'data'
          },
        })

        React.useEffect(() => {
          states.push(state.fetchStatus)
        })

        return (
          <div>
            <div>
              status: {state.status}, isPaused: {String(state.isPaused)}
            </div>
            <div>data: {state.data}</div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() => rendered.getByText('status: loading, isPaused: true'))

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        rendered.getByText('status: success, isPaused: false'),
      )
      await waitFor(() => {
        expect(rendered.getByText('data: data')).toBeInTheDocument()
      })

      expect(states).toEqual(['paused', 'fetching', 'idle'])

      onlineMock.mockRestore()
    })

    it('online queries should not refetch if you are offline', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery<string, string>({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus},
              failureCount: {state.failureCount}
            </div>
            <div>failureReason: {state.failureReason ?? 'null'}</div>
            <div>data: {state.data}</div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() => rendered.getByText('data: data1'))

      const onlineMock = mockNavigatorOnLine(false)
      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await waitFor(() =>
        rendered.getByText(
          'status: success, fetchStatus: paused, failureCount: 0',
        ),
      )
      await waitFor(() => rendered.getByText('failureReason: null'))

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        rendered.getByText(
          'status: success, fetchStatus: fetching, failureCount: 0',
        ),
      )
      await waitFor(() => rendered.getByText('failureReason: null'))
      await waitFor(() =>
        rendered.getByText(
          'status: success, fetchStatus: idle, failureCount: 0',
        ),
      )
      await waitFor(() => rendered.getByText('failureReason: null'))

      await waitFor(() => {
        expect(rendered.getByText('data: data2')).toBeInTheDocument()
      })

      onlineMock.mockRestore()
    })

    it('online queries should not refetch if you are offline and refocus', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() => rendered.getByText('data: data1'))

      const onlineMock = mockNavigatorOnLine(false)
      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: paused'),
      )

      window.dispatchEvent(new FocusEvent('focus'))
      await sleep(15)

      await waitFor(() =>
        expect(rendered.queryByText('data: data2')).not.toBeInTheDocument(),
      )
      expect(count).toBe(1)
      onlineMock.mockRestore()
    })

    it('online queries should not refetch while already paused', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const onlineMock = mockNavigatorOnLine(false)

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: loading, fetchStatus: paused'),
      )

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await sleep(15)

      // invalidation should not trigger a refetch
      await waitFor(() =>
        rendered.getByText('status: loading, fetchStatus: paused'),
      )

      expect(count).toBe(0)
      onlineMock.mockRestore()
    })

    it('online queries should not refetch while already paused if data is in the cache', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
          initialData: 'initial',
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const onlineMock = mockNavigatorOnLine(false)

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: paused'),
      )
      await waitFor(() => {
        expect(rendered.getByText('data: initial')).toBeInTheDocument()
      })

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await sleep(15)

      // invalidation should not trigger a refetch
      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: paused'),
      )

      expect(count).toBe(0)
      onlineMock.mockRestore()
    })

    it('online queries should not get stuck in fetching state when pausing multiple times', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
          initialData: 'initial',
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const onlineMock = mockNavigatorOnLine(false)

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: paused'),
      )
      await waitFor(() => {
        expect(rendered.getByText('data: initial')).toBeInTheDocument()
      })

      // triggers one pause
      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await sleep(15)

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: paused'),
      )

      // triggers a second pause
      act(() => {
        window.dispatchEvent(new FocusEvent('focus'))
      })

      onlineMock.mockReturnValue(true)
      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: idle'),
      )
      await waitFor(() => {
        expect(rendered.getByText('data: data1')).toBeInTheDocument()
      })

      expect(count).toBe(1)
      onlineMock.mockRestore()
    })

    it('online queries should pause retries if you are offline', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery<unknown, Error>({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            count++
            await sleep(10)
            throw new Error('failed' + count)
          },
          retry: 2,
          retryDelay: 10,
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus},
              failureCount: {state.failureCount}
            </div>
            <div>failureReason: {state.failureReason?.message ?? 'null'}</div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText(
          'status: loading, fetchStatus: fetching, failureCount: 1',
        ),
      )
      await waitFor(() => rendered.getByText('failureReason: failed1'))

      const onlineMock = mockNavigatorOnLine(false)

      await sleep(20)

      await waitFor(() =>
        rendered.getByText(
          'status: loading, fetchStatus: paused, failureCount: 1',
        ),
      )
      await waitFor(() => rendered.getByText('failureReason: failed1'))

      expect(count).toBe(1)

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        rendered.getByText('status: error, fetchStatus: idle, failureCount: 3'),
      )
      await waitFor(() => rendered.getByText('failureReason: failed3'))

      expect(count).toBe(3)

      onlineMock.mockRestore()
    })

    it('online queries should fetch if paused and we go online even if already unmounted (because not cancelled)', async () => {
      const key = queryKey()
      let count = 0

      function Component() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
          </div>
        )
      }

      function Page() {
        const [show, setShow] = React.useState(true)

        return (
          <div>
            {show && <Component />}
            <button onClick={() => setShow(false)}>hide</button>
          </div>
        )
      }

      const onlineMock = mockNavigatorOnLine(false)

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: loading, fetchStatus: paused'),
      )

      fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(queryClient.getQueryState(key)).toMatchObject({
          fetchStatus: 'idle',
          status: 'success',
        })
      })

      // give it a bit more time to make sure queryFn is not called again
      await sleep(15)
      expect(count).toBe(1)

      onlineMock.mockRestore()
    })

    it('online queries should not fetch if paused and we go online when cancelled and no refetchOnReconnect', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data' + count
          },
          refetchOnReconnect: false,
        })

        return (
          <div>
            <button
              onClick={() => queryClient.cancelQueries({ queryKey: key })}
            >
              cancel
            </button>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
          </div>
        )
      }

      const onlineMock = mockNavigatorOnLine(false)

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: loading, fetchStatus: paused'),
      )

      fireEvent.click(rendered.getByRole('button', { name: /cancel/i }))

      await waitFor(() =>
        rendered.getByText('status: loading, fetchStatus: idle'),
      )

      expect(count).toBe(0)

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await sleep(15)

      await waitFor(() =>
        rendered.getByText('status: loading, fetchStatus: idle'),
      )

      expect(count).toBe(0)

      onlineMock.mockRestore()
    })

    it('online queries should not fetch if paused and we go online if already unmounted when signal consumed', async () => {
      const key = queryKey()
      let count = 0

      function Component() {
        const state = useQuery({
          queryKey: key,
          queryFn: async ({ signal }) => {
            count++
            await sleep(10)
            return `${signal ? 'signal' : 'data'}${count}`
          },
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus}
            </div>
            <div>data: {state.data}</div>
          </div>
        )
      }

      function Page() {
        const [show, setShow] = React.useState(true)

        return (
          <div>
            {show && <Component />}
            <button onClick={() => setShow(false)}>hide</button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: idle'),
      )

      const onlineMock = mockNavigatorOnLine(false)

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await waitFor(() =>
        rendered.getByText('status: success, fetchStatus: paused'),
      )

      fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

      await sleep(15)

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await sleep(15)

      expect(queryClient.getQueryState(key)).toMatchObject({
        fetchStatus: 'idle',
        status: 'success',
      })

      expect(count).toBe(1)

      onlineMock.mockRestore()
    })
  })

  describe('networkMode always', () => {
    it('always queries should start fetching even if you are offline', async () => {
      const onlineMock = mockNavigatorOnLine(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
            return 'data ' + count
          },
          networkMode: 'always',
        })

        return (
          <div>
            <div>
              status: {state.status}, isPaused: {String(state.isPaused)}
            </div>
            <div>data: {state.data}</div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText('status: success, isPaused: false'),
      )

      await waitFor(() => {
        expect(rendered.getByText('data: data 1')).toBeInTheDocument()
      })

      onlineMock.mockRestore()
    })

    it('always queries should not pause retries', async () => {
      const onlineMock = mockNavigatorOnLine(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            count++
            await sleep(10)
            throw new Error('error ' + count)
          },
          networkMode: 'always',
          retry: 1,
          retryDelay: 5,
        })

        return (
          <div>
            <div>
              status: {state.status}, isPaused: {String(state.isPaused)}
            </div>
            <div>
              error: {state.error instanceof Error && state.error.message}
            </div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() => rendered.getByText('status: error, isPaused: false'))

      await waitFor(() => {
        expect(rendered.getByText('error: error 2')).toBeInTheDocument()
      })

      expect(count).toBe(2)

      onlineMock.mockRestore()
    })
  })

  describe('networkMode offlineFirst', () => {
    it('offlineFirst queries should start fetching if you are offline, but pause retries', async () => {
      const onlineMock = mockNavigatorOnLine(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery<unknown, Error>({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            count++
            await sleep(10)
            throw new Error('failed' + count)
          },
          retry: 2,
          retryDelay: 1,
          networkMode: 'offlineFirst',
        })

        return (
          <div>
            <div>
              status: {state.status}, fetchStatus: {state.fetchStatus},
              failureCount: {state.failureCount}
            </div>
            <div>failureReason: {state.failureReason?.message ?? 'null'}</div>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <Page />)

      await waitFor(() =>
        rendered.getByText(
          'status: loading, fetchStatus: paused, failureCount: 1',
        ),
      )
      await waitFor(() => rendered.getByText('failureReason: failed1'))

      expect(count).toBe(1)

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        rendered.getByText('status: error, fetchStatus: idle, failureCount: 3'),
      )
      await waitFor(() => rendered.getByText('failureReason: failed3'))

      expect(count).toBe(3)

      onlineMock.mockRestore()
    })
  })

  it('it should have status=error on mount when a query has failed', async () => {
    const key = queryKey()
    const states: UseQueryResult<unknown>[] = []
    const error = new Error('oops')

    const queryFn = async (): Promise<unknown> => {
      throw error
    }

    function Page() {
      const state = useQuery(key, queryFn, {
        retry: false,
        retryOnMount: false,
      })

      states.push(state)

      return <></>
    }

    await queryClient.prefetchQuery(key, queryFn)
    renderWithClient(queryClient, <Page />)

    await waitFor(() => expect(states).toHaveLength(1))

    expect(states[0]).toMatchObject({
      status: 'error',
      error,
    })
  })

  it('setQueryData - should not call onSuccess callback of active observers', async () => {
    const key = queryKey()
    const onSuccess = jest.fn()

    function Page() {
      const state = useQuery(key, () => 'data', { onSuccess })
      return (
        <div>
          <div>data: {state.data}</div>
          <button onClick={() => queryClient.setQueryData(key, 'newData')}>
            setQueryData
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: data'))
    fireEvent.click(rendered.getByRole('button', { name: /setQueryData/i }))
    await waitFor(() => rendered.getByText('data: newData'))

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  })

  it('setQueryData - should respect updatedAt', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(key, () => 'data')
      return (
        <div>
          <div>data: {state.data}</div>
          <div>dataUpdatedAt: {state.dataUpdatedAt}</div>
          <button
            onClick={() =>
              queryClient.setQueryData(key, 'newData', { updatedAt: 100 })
            }
          >
            setQueryData
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: data'))
    fireEvent.click(rendered.getByRole('button', { name: /setQueryData/i }))
    await waitFor(() => rendered.getByText('data: newData'))
    await waitFor(() => {
      expect(rendered.getByText('dataUpdatedAt: 100')).toBeInTheDocument()
    })
  })

  it('errorUpdateCount should increased on each fetch failure', async () => {
    const key = queryKey()
    const error = new Error('oops')

    function Page() {
      const { refetch, errorUpdateCount } = useQuery(
        key,
        async (): Promise<unknown> => {
          throw error
        },
        {
          retry: false,
        },
      )
      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          <span>data: {errorUpdateCount}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    const fetchBtn = rendered.getByRole('button', { name: 'refetch' })
    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(fetchBtn)
    await waitFor(() => rendered.getByText('data: 2'))
    fireEvent.click(fetchBtn)
    await waitFor(() => rendered.getByText('data: 3'))
  })

  it('should be notified of updates between create and subscribe', async () => {
    const key = queryKey()

    function Page() {
      const mounted = React.useRef<boolean>(false)
      const { data, status } = useQuery({
        enabled: false,
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 5
        },
      })

      // this simulates a synchronous update between the time the query is created
      // and the time it is subscribed to that could be missed otherwise
      if (!mounted.current) {
        mounted.current = true
        queryClient.setQueryData(key, 1)
      }

      return (
        <div>
          <span>status: {status}</span>
          <span>data: {data}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)
    await waitFor(() => rendered.getByText('status: success'))
    await waitFor(() => rendered.getByText('data: 1'))
  })
  it('should reuse same data object reference when queryKey changes back to some cached data', async () => {
    const spy = jest.fn()
    const key = queryKey()

    async function fetchNumber(id: number) {
      await sleep(5)
      return { numbers: { current: { id } } }
    }
    function Test() {
      const [id, setId] = React.useState(1)

      const { data } = useQuery({
        select: selector,
        queryKey: [key, 'user', id],
        queryFn: () => fetchNumber(id),
      })

      React.useEffect(() => {
        spy(data)
      }, [data])

      return (
        <div>
          <button name="1" onClick={() => setId(1)}>
            1
          </button>
          <button name="2" onClick={() => setId(2)}>
            2
          </button>
          <span>Rendered Id: {data?.id}</span>
        </div>
      )
    }

    function selector(data: any) {
      return data.numbers.current
    }

    const rendered = renderWithClient(queryClient, <Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockClear()
    await waitFor(() => rendered.getByText('Rendered Id: 1'))
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockClear()
    fireEvent.click(rendered.getByRole('button', { name: /2/ }))
    await waitFor(() => rendered.getByText('Rendered Id: 2'))
    expect(spy).toHaveBeenCalledTimes(2) // called with undefined because id changed

    spy.mockClear()
    fireEvent.click(rendered.getByRole('button', { name: /1/ }))
    await waitFor(() => rendered.getByText('Rendered Id: 1'))
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockClear()
    fireEvent.click(rendered.getByRole('button', { name: /2/ }))
    await waitFor(() => rendered.getByText('Rendered Id: 2'))
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('should reuse same data object reference when queryKey changes and placeholderData is present', async () => {
    const spy = jest.fn()
    const key = queryKey()

    async function fetchNumber(id: number) {
      await sleep(5)
      return { numbers: { current: { id } } }
    }
    function Test() {
      const [id, setId] = React.useState(1)

      const { data } = useQuery({
        select: selector,
        queryKey: [key, 'user', id],
        queryFn: () => fetchNumber(id),
        placeholderData: { numbers: { current: { id: 99 } } },
      })

      React.useEffect(() => {
        spy(data)
      }, [data])

      return (
        <div>
          <button name="1" onClick={() => setId(1)}>
            1
          </button>
          <button name="2" onClick={() => setId(2)}>
            2
          </button>
          <span>Rendered Id: {data?.id}</span>
        </div>
      )
    }

    function selector(data: any) {
      return data.numbers.current
    }

    const rendered = renderWithClient(queryClient, <Test />)
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockClear()
    await waitFor(() => rendered.getByText('Rendered Id: 99'))
    await waitFor(() => rendered.getByText('Rendered Id: 1'))
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockClear()
    fireEvent.click(rendered.getByRole('button', { name: /2/ }))
    await waitFor(() => rendered.getByText('Rendered Id: 99'))
    await waitFor(() => rendered.getByText('Rendered Id: 2'))
    expect(spy).toHaveBeenCalledTimes(2) // called with undefined because id changed

    spy.mockClear()
    fireEvent.click(rendered.getByRole('button', { name: /1/ }))
    await waitFor(() => rendered.getByText('Rendered Id: 1'))
    expect(spy).toHaveBeenCalledTimes(reactVersion() === '19' ? 2 : 1)

    spy.mockClear()
    fireEvent.click(rendered.getByRole('button', { name: /2/ }))
    await waitFor(() => rendered.getByText('Rendered Id: 2'))
    expect(spy).toHaveBeenCalledTimes(reactVersion() === '18' ? 1 : 2)
  })
  it('should not cause an infinite render loop when using unstable callback ref', async () => {
    const key = queryKey()

    function Test() {
      const [_, setRef] = React.useState<HTMLDivElement | null>()

      const { data } = useQuery({
        queryKey: [key],
        queryFn: async () => {
          await sleep(5)
          return 'Works'
        },
      })

      return <div ref={(value) => setRef(value)}>{data}</div>
    }

    const rendered = renderWithClient(queryClient, <Test />)

    await waitFor(() => rendered.getByText('Works'))
  })
})
