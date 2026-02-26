import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import {
  ErrorBoundary,
  Match,
  Switch,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  on,
} from 'solid-js'
import { fireEvent, render } from '@solidjs/testing-library'
import { reconcile } from 'solid-js/store'
import {
  mockVisibilityState,
  queryKey,
  sleep,
} from '@tanstack/query-test-utils'
import {
  IsRestoringProvider,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useQuery,
} from '..'
import { Blink, mockOnlineManagerIsOnline, setActTimeout } from './utils'
import type {
  DefinedUseQueryResult,
  OmitKeyof,
  QueryFunction,
  UseQueryOptions,
  UseQueryResult,
} from '..'
import type { Mock } from 'vitest'
import type { JSX } from 'solid-js'

describe('useQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the correct types', () => {
    const key = queryKey()

    // @ts-expect-error
    function Page() {
      // unspecified query function should default to unknown
      const noQueryFn = useQuery(() => ({ queryKey: key }))
      expectTypeOf(noQueryFn.data).toEqualTypeOf<unknown>()
      expectTypeOf(noQueryFn.error).toEqualTypeOf<Error | null>()

      // it should infer the result type from the query function
      const fromQueryFn = useQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))
      expectTypeOf(fromQueryFn.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(fromQueryFn.error).toEqualTypeOf<Error | null>()

      // it should be possible to specify the result type
      const withResult = useQuery<string>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))
      expectTypeOf(withResult.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(withResult.error).toEqualTypeOf<Error | null>()

      // it should be possible to specify the error type
      const withError = useQuery<string, Error>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))
      expectTypeOf(withError.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(withError.error).toEqualTypeOf<Error | null>()

      // it should provide the result type in the configuration
      useQuery(() => ({
        queryKey: [key],
        queryFn: () => true,
      }))

      // it should be possible to specify a union type as result type
      const unionTypeSync = useQuery(() => ({
        queryKey: key,
        queryFn: () => (Math.random() > 0.5 ? ('a' as const) : ('b' as const)),
      }))
      expectTypeOf(unionTypeSync.data).toEqualTypeOf<'a' | 'b' | undefined>()
      const unionTypeAsync = useQuery<'a' | 'b'>(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
      }))
      expectTypeOf(unionTypeAsync.data).toEqualTypeOf<'a' | 'b' | undefined>()

      // should error when the query function result does not match with the specified type
      // @ts-expect-error
      useQuery<number>(() => ({ queryKey: key, queryFn: () => 'test' }))

      // it should infer the result type from a generic query function
      function queryFn<T = string>(): Promise<T> {
        return Promise.resolve({} as T)
      }

      const fromGenericQueryFn = useQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      }))
      expectTypeOf(fromGenericQueryFn.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(fromGenericQueryFn.error).toEqualTypeOf<Error | null>()

      const fromGenericOptionsQueryFn = useQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      }))
      expectTypeOf(fromGenericOptionsQueryFn.data).toEqualTypeOf<
        string | undefined
      >()
      expectTypeOf(
        fromGenericOptionsQueryFn.error,
      ).toEqualTypeOf<Error | null>()

      type MyData = number
      type MyQueryKey = readonly ['my-data', number]

      const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = ({
        queryKey: [, n],
      }) => {
        return n + 42
      }

      useQuery(() => ({
        queryKey: ['my-data', 100] as const,
        queryFn: getMyDataArrayKey,
      }))

      const getMyDataStringKey: QueryFunction<MyData, ['1']> = (context) => {
        expectTypeOf(context.queryKey).toEqualTypeOf<['1']>()
        return Number(context.queryKey[0]) + 42
      }

      useQuery(() => ({
        queryKey: ['1'] as ['1'],
        queryFn: getMyDataStringKey,
      }))

      // it should handle query-functions that return Promise<any>
      useQuery(() => ({
        queryKey: key,
        queryFn: () => fetch('return Promise<any>').then((resp) => resp.json()),
      }))

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
        options?: OmitKeyof<
          UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey' | 'queryFn' | 'initialData',
          'safely'
        >,
      ) =>
        useQuery(() => ({
          queryKey: qk,
          queryFn: () => fetcher(qk[1], 'token'),
          ...options,
        }))
      const test = useWrappedQuery([''], () => Promise.resolve('1'))
      expectTypeOf(test.data).toEqualTypeOf<string | undefined>()

      // handles wrapped queries with custom fetcher passed directly to useQuery
      const useWrappedFuncStyleQuery = <
        TQueryKey extends [string, Record<string, unknown>?],
        TQueryFnData,
        TError,
        TData = TQueryFnData,
      >(
        qk: TQueryKey,
        fetcher: () => Promise<TQueryFnData>,
        options?: OmitKeyof<
          UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey' | 'queryFn' | 'initialData',
          'safely'
        >,
      ) => useQuery(() => ({ queryKey: qk, queryFn: fetcher, ...options }))
      const testFuncStyle = useWrappedFuncStyleQuery([''], () =>
        Promise.resolve(true),
      )
      expectTypeOf(testFuncStyle.data).toEqualTypeOf<boolean | undefined>()
    }
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      return (
        <div>
          <h1>{state.data ?? 'default'}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('default')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()
  })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page(): JSX.Element {
      const state = useQuery<string, Error>(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      if (state.isPending) {
        expectTypeOf(state.data).toEqualTypeOf<undefined>()
        expectTypeOf(state.error).toEqualTypeOf<null>()
      } else if (state.isLoadingError) {
        expectTypeOf(state.data).toEqualTypeOf<undefined>()
        expectTypeOf(state.error).toEqualTypeOf<Error>()
      } else {
        expectTypeOf(state.data).toEqualTypeOf<string>()
        expectTypeOf(state.error).toEqualTypeOf<Error | null>()
      }

      return (
        <Switch fallback={<span>{state.data}</span>}>
          <Match when={state.isPending}>
            <span>pending</span>
          </Match>
          <Match when={state.isLoadingError}>
            <span>{state.error!.message}</span>
          </Match>
        </Switch>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()

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
      isPending: true,
      isInitialLoading: true,
      isLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
      promise: expect.any(Promise),
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
      isPending: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
      promise: expect.any(Promise),
    })
  })

  it('should return the correct states for an unsuccessful query', async () => {
    const key = queryKey()

    const states: Array<UseQueryResult<unknown, Error>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('rejected'))),
        retry: 1,
        retryDelay: 1,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <h1>Status: {state.status}</h1>
          <div>Failure Count: {state.failureCount}</div>
          <div>Failure Reason: {state.failureReason?.message}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('Status: error')).toBeInTheDocument()

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
      isPending: true,
      isInitialLoading: true,
      isLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
      promise: expect.any(Promise),
    })

    expect(states[1]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: new Error('rejected'),
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isPending: true,
      isInitialLoading: true,
      isLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
      promise: expect.any(Promise),
    })

    expect(states[2]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: new Error('rejected'),
      errorUpdatedAt: expect.any(Number),
      failureCount: 2,
      failureReason: new Error('rejected'),
      errorUpdateCount: 1,
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isPending: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: true,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      isEnabled: true,
      refetch: expect.any(Function),
      status: 'error',
      fetchStatus: 'idle',
      promise: expect.any(Promise),
    })
  })

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'prefetched'),
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(states.length).toBe(2)

    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isFetched: true,
      isFetchedAfterMount: false,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isFetched: true,
      isFetchedAfterMount: true,
    })
  })

  it('should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          fetchCount++
          return 'data'
        },
        enabled: false,
        initialData: 'initialData',
      }))

      createEffect(() => {
        setActTimeout(() => {
          state.refetch()
        }, 5)
        setActTimeout(() => {
          state.refetch({ cancelRefetch: false })
        }, 5)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(15)
    // first refetch only, second refetch is ignored
    expect(fetchCount).toBe(1)
  })

  it('should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          fetchCount++
          return 'data'
        },
        enabled: false,
        initialData: 'initialData',
      }))

      createEffect(() => {
        setActTimeout(() => {
          state.refetch()
        }, 5)
        setActTimeout(() => {
          state.refetch()
        }, 5)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(15)
    // first refetch (gets cancelled) and second refetch
    expect(fetchCount).toBe(2)
  })

  it('should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          fetchCount++
          return 'data'
        },
        enabled: false,
      }))

      createEffect(() => {
        setActTimeout(() => {
          state.refetch()
        }, 5)
        setActTimeout(() => {
          state.refetch()
        }, 5)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(15)
    // first refetch will not get cancelled, second one gets skipped
    expect(fetchCount).toBe(1)
  })

  it('should be able to watch a query without providing a query function', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    queryClient.setQueryDefaults(key, {
      queryFn: () => sleep(10).then(() => 'data'),
    })

    function Page() {
      const state = useQuery<string>(() => ({ queryKey: key }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'data' })
  })

  it('should pick up a query when re-mounting with gcTime 0', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const [toggle, setToggle] = createSignal(false)

      return (
        <div>
          <button onClick={() => setToggle(true)}>toggle</button>
          <Switch>
            <Match when={toggle()}>
              <Component value="2" />
            </Match>
            <Match when={!toggle()}>
              <Component value="1" />
            </Match>
          </Switch>
        </div>
      )
    }

    function Component({ value }: { value: string }) {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data: ' + value),
        gcTime: 0,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return (
        <div>
          <div>{state.data}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /toggle/i }))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states.length).toBe(4)
    // First load
    expect(states[0]).toMatchObject({
      isPending: true,
      isSuccess: false,
      isFetching: true,
    })
    // First success
    expect(states[1]).toMatchObject({
      isPending: false,
      isSuccess: true,
      isFetching: false,
    })
    // Switch, goes to fetching
    expect(states[2]).toMatchObject({
      isPending: false,
      isSuccess: true,
      isFetching: true,
    })
    // Second success
    expect(states[3]).toMatchObject({
      isPending: false,
      isSuccess: true,
      isFetching: false,
    })
  })

  it('should fetch when refetchOnMount is false and nothing has been fetched yet', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
        refetchOnMount: false,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should not fetch when refetchOnMount is false and data has been fetched already', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
        refetchOnMount: false,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({ data: 'prefetched' })
  })

  it('should be able to select a part of the data with select', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: (data) => data.name,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should be able to select a part of the data with select in object syntax 2', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: (data) => data.name,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should be able to select a part of the data with select in object syntax 1', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: (data) => data.name,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should not re-render when it should only re-render only data change and the selected data did not change', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: (data) => data.name,
        notifyOnChangeProps: ['data'],
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          data: {state.data}
          <button onClick={() => state.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: test')).toBeInTheDocument()

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should throw an error when a selector throws', async () => {
    const key = queryKey()
    const states: Array<{ status: string; data?: unknown; error?: Error }> = []
    const error = new Error('Select Error')

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'test' })),
        select: () => {
          throw error
        },
      }))
      createRenderEffect(() => {
        if (state.status === 'pending')
          states.push({ status: 'pending', data: undefined })
        else if (state.status === 'error')
          states.push({ status: 'error', error: state.error })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)

    expect(states[0]).toMatchObject({ status: 'pending', data: undefined })
    expect(states[1]).toMatchObject({ status: 'error', error })
  })

  it('should track properties and only re-render when a tracked property changes', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const data = state.data
        const refetch = state.refetch
        setActTimeout(() => {
          if (data) {
            refetch()
          }
        }, 20)
      })

      return (
        <div>
          <h1>{state.data ?? null}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('test')).toBeInTheDocument()

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should always re-render if we are tracking props but not using any', async () => {
    const key = queryKey()
    let renderCount = 0
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(
        on(
          () => ({ ...state }),
          () => {
            renderCount++
          },
        ),
      )

      return (
        <div>
          <h1>hello</h1>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(renderCount).toBe(2)
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
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

    const states: Array<UseQueryResult<typeof result1>> = []

    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count === 1 ? result1 : result2
        },
        reconcile: (oldData, newData) => {
          return reconcile(newData)(oldData)
        },
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      const { refetch } = state

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          data: {String(state.data?.[1]?.done)}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: false')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: true')).toBeInTheDocument()

    expect(states.length).toBe(4)

    const todos = states[2]?.data
    const todo1 = todos?.[0]
    const todo2 = todos?.[1]

    const newTodos = states[3]?.data
    const newTodo1 = newTodos?.[0]
    const newTodo2 = newTodos?.[1]

    expect(todos).toEqual(result1)
    expect(newTodos).toEqual(result2)
    expect(newTodo1).toBe(todo1)
    expect(newTodo2).toBe(todo2)

    return null
  })

  it('should use query function from hook when the existing query does not have a query function', async () => {
    const key = queryKey()
    const results: Array<UseQueryResult<string>> = []

    queryClient.setQueryData(key, 'set')

    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
        initialData: 'initial',
        staleTime: Infinity,
      }))

      createRenderEffect(() => {
        results.push({ ...result })
      })

      return (
        <div>
          <div>isFetching: {result.isFetching}</div>
          <button onClick={() => queryClient.refetchQueries({ queryKey: key })}>
            refetch
          </button>
          data: {result.data}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: set')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: fetched')).toBeInTheDocument()

    expect(results.length).toBe(3)

    expect(results[0]).toMatchObject({ data: 'set', isFetching: false })
    expect(results[1]).toMatchObject({ data: 'set', isFetching: true })
    expect(results[2]).toMatchObject({ data: 'fetched', isFetching: false })
  })

  it('should update query stale state and refetch when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count
        },
        staleTime: Infinity,
      }))

      createEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: key })}
          >
            invalidate
          </button>
          data: {state.data}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states.length).toBe(4)

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

  it('should not update disabled query when refetch with refetchQueries', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count
        },
        enabled: false,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        setActTimeout(() => {
          queryClient.refetchQueries({ queryKey: key })
        }, 20)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(30)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isStale: false,
    })
  })

  it('should not refetch disabled query when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count
        },
        enabled: false,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        setActTimeout(() => {
          queryClient.invalidateQueries({ queryKey: key })
        }, 20)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(30)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isStale: false,
    })
  })

  it('should not fetch when switching to a disabled query', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = useQuery(() => ({
        queryKey: [key, count()],
        queryFn: () => sleep(5).then(() => count()),
        enabled: count() === 0,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        setActTimeout(() => {
          setCount(1)
        }, 10)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(3)

    // Fetch query
    expect(states[0]).toMatchObject({
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
      isFetching: false,
      isSuccess: false,
    })
  })

  it('should keep the previous data when placeholderData is set', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = useQuery(() => ({
        queryKey: [key, count()],
        queryFn: () => sleep(10).then(() => count()),
        placeholderData: keepPreviousData,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        setActTimeout(() => {
          setCount(1)
        }, 20)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(30)

    expect(states.length).toBe(4)

    // Initial
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isPlaceholderData: false,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // Set state
    expect(states[2]).toMatchObject({
      data: 0,
      isFetching: true,
      isSuccess: true,
      isPlaceholderData: true,
    })
    // New data
    expect(states[3]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
  })

  it('should not show initial data from next query if placeholderData is set', async () => {
    const key = queryKey()
    const states: Array<DefinedUseQueryResult<number>> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = useQuery(() => ({
        queryKey: [key, count()],
        queryFn: () => sleep(10).then(() => count()),
        initialData: 99,
        placeholderData: keepPreviousData,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <h1>
            data: {state.data}, count: {count()}, isFetching:{' '}
            {String(state.isFetching)}
          </h1>
          <button onClick={() => setCount(1)}>inc</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('data: 0, count: 0, isFetching: false'),
    ).toBeInTheDocument()
    fireEvent.click(rendered.getByRole('button', { name: 'inc' }))
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('data: 1, count: 1, isFetching: false'),
    ).toBeInTheDocument()

    expect(states.length).toBe(4)

    // Initial
    expect(states[0]).toMatchObject({
      data: 99,
      isFetching: true,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // Fetched
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // Set state
    expect(states[2]).toMatchObject({
      data: 99,
      isFetching: true,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // New data
    expect(states[3]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
  })

  it('should keep the previous data on disabled query when placeholderData is set and switching query key multiple times', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []

    queryClient.setQueryData([key, 10], 10)

    function Page() {
      const [count, setCount] = createSignal(10)

      const state = useQuery(() => ({
        queryKey: [key, count()],
        queryFn: () => sleep(10).then(() => count()),
        enabled: false,
        placeholderData: keepPreviousData,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const refetch = state.refetch
        setActTimeout(() => {
          setCount(11)
        }, 20)
        setActTimeout(() => {
          setCount(12)
        }, 30)
        setActTimeout(() => {
          refetch()
        }, 40)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(50)

    expect(states.length).toBe(4)

    // Disabled query
    expect(states[0]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // Set state
    expect(states[1]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: true,
    })
    // Refetch
    expect(states[2]).toMatchObject({
      data: 10,
      isFetching: true,
      isSuccess: true,
      isPlaceholderData: true,
    })
    // Refetch done
    expect(states[3]).toMatchObject({
      data: 12,
      isFetching: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
  })

  it('should use the correct query function when components use different configurations', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []

    function FirstComponent() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 1),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => state.refetch()}>refetch</button>
          data: {state.data}
        </div>
      )
    }

    function SecondComponent() {
      useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(15).then(() => 2),
      }))
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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(4)

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
    const states1: Array<UseQueryResult<string>> = []
    const states2: Array<UseQueryResult<string>> = []

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'prefetch'),
    })
    await vi.advanceTimersByTimeAsync(20)

    function FirstComponent() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'one'),
        staleTime: 100,
      }))
      createRenderEffect(() => {
        states1.push({ ...state })
      })
      return null
    }

    function SecondComponent() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'two'),
        staleTime: 10,
      }))
      createRenderEffect(() => {
        states2.push({ ...state })
      })
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(200)

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
      // Data became stale after 10ms
      {
        data: 'two',
        isStale: true,
      },
    ])
  })

  it('should re-render when a query becomes stale', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
        staleTime: 50,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(70)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({ isStale: true })
    expect(states[1]).toMatchObject({ isStale: false })
    expect(states[2]).toMatchObject({ isStale: true })
  })

  it('should not re-render when it should only re-render on data changes and the data did not change', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(5).then(() => 'test'),
        notifyOnChangeProps: ['data'],
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const refetch = state.refetch
        setActTimeout(() => {
          refetch()
        }, 10)
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(15)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      data: undefined,
      status: 'pending',
      isFetching: true,
    })
    expect(states[1]).toMatchObject({
      data: 'test',
      status: 'success',
      isFetching: false,
    })
  })

  // See https://github.com/tannerlinsley/react-query/issues/137
  it('should not override initial data in dependent queries', () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'data'),
        enabled: false,
        initialData: 'init',
      }))

      const second = useQuery(() => ({
        queryKey: key2,
        queryFn: () => sleep(10).then(() => 'data'),
        enabled: false,
        initialData: 'init',
      }))

      return (
        <div>
          <h2>First Data: {first.data}</h2>
          <h2>Second Data: {second.data}</h2>
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('First Data: init')).toBeInTheDocument()
    expect(rendered.getByText('Second Data: init')).toBeInTheDocument()
    expect(rendered.getByText('First Status: success')).toBeInTheDocument()
    expect(rendered.getByText('Second Status: success')).toBeInTheDocument()
  })

  it('should update query options', () => {
    const key = queryKey()

    const queryFn = () => sleep(10).then(() => 'data1')

    function Page() {
      useQuery(() => ({ queryKey: key, queryFn, retryDelay: 10 }))
      useQuery(() => ({ queryKey: key, queryFn, retryDelay: 20 }))
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(queryCache.find({ queryKey: key })!.options.retryDelay).toBe(20)
  })

  it('should batch re-renders', async () => {
    const key = queryKey()

    let renders = 0

    const queryFn = () => sleep(15).then(() => 'data')

    function Page() {
      useQuery(() => ({ queryKey: key, queryFn }))
      useQuery(() => ({ queryKey: key, queryFn }))
      renders++
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(0)

    // Since components are rendered once
    // There will only be one pass
    expect(renders).toBe(1)
  })

  it('should render latest data even if react has discarded certain renders', async () => {
    const key = queryKey()

    function Page() {
      const [, setNewState] = createSignal('state')
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))
      createEffect(() => {
        setActTimeout(() => {
          queryClient.setQueryData(key, 'new')
          // Update with same state to make react discard the next render
          setNewState('state')
        }, 10)
      })
      return <div>{state.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('new')).toBeInTheDocument()
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status pending, fetchStatus idle if enabled is false', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'data'),
        enabled: false,
      }))
      const second = useQuery(() => ({
        queryKey: key2,
        queryFn: () => sleep(10).then(() => 'data'),
      }))

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

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // use "act" to wait for state update and prevent console warning

    expect(
      rendered.getByText('First Status: pending, idle'),
    ).toBeInTheDocument()
    expect(
      rendered.getByText('Second Status: pending, fetching'),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('Second Status: success, idle'),
    ).toBeInTheDocument()
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "pending" state by default', () => {
    const key = queryKey()

    function Page() {
      const { status } = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))

      return <div>status: {status}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('status: pending')).toBeInTheDocument()
  })

  it('should not refetch query on focus when `enabled` is set to `false`', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn<(...args: Array<unknown>) => string>()
      .mockReturnValue('data')

    function Page() {
      const { data = 'default' } = useQuery(() => ({
        queryKey: key,
        queryFn,
        enabled: false,
      }))

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('default')).toBeInTheDocument()

    window.dispatchEvent(new Event('visibilitychange'))

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        staleTime: 0,
        refetchOnWindowFocus: false,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        staleTime: 0,
        refetchOnWindowFocus: () => false,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        staleTime: Infinity,
        refetchOnWindowFocus: true,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        staleTime: Infinity,
        refetchOnWindowFocus: 'always',
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })
  })

  it('should calculate focus behavior for refetchOnWindowFocus depending on function', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        staleTime: 0,
        retry: 0,
        refetchOnWindowFocus: (query) => (query.state.data || 0) < 1,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return <div>data: {state.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('data: 0')).toBeInTheDocument()

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })

    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    // refetch should happen
    expect(states.length).toBe(4)

    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })

    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    // no more refetch now
    expect(states.length).toBe(4)
  })

  it('should refetch fresh query when refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'prefetched'),
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        refetchOnMount: 'always',
        staleTime: Infinity,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

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
    const states: Array<UseQueryResult<string>> = []

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'prefetched'),
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        refetchOnMount: true,
        staleTime: 0,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

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

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Error test'))),
        retry: false,
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>{state.error?.message}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()
    expect(rendered.getByText('Error test')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should throw error if queryFn throws and throwOnError is in use', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Error test'))),
        retry: false,
        throwOnError: true,
      }))

      return (
        <div>
          <h1>{state.data}</h1>
          <h1>{state.status}</h1>
          <h2>{state.error?.message}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should throw error inside the same component if queryFn throws and throwOnError is in use', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Error test'))),
        retry: false,
        throwOnError: true,
      }))

      return (
        <div>
          <ErrorBoundary fallback={() => <div>error boundary</div>}>
            <h1>{state.data}</h1>
            <h1>{state.status}</h1>
            <h2>{state.error?.message}</h2>
          </ErrorBoundary>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should throw error inside the same component if queryFn throws and show the correct error message', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Error test'))),
        retry: false,
        throwOnError: true,
      }))

      return (
        <div>
          <ErrorBoundary
            fallback={(err) => <div>Fallback error: {err.message}</div>}
          >
            <h1>{state.data}</h1>
            <h1>{state.status}</h1>
            <h2>{state.error?.message}</h2>
          </ErrorBoundary>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Fallback error: Error test')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should show the correct error message on the error property when accessed outside error boundary', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Error test'))),
        retry: false,
        throwOnError: true,
      }))

      return (
        <div>
          <h2>Outside error boundary: {state.error?.message}</h2>
          <ErrorBoundary
            fallback={(err) => <div>Fallback error: {err.message}</div>}
          >
            <h1>{state.data}</h1>
            <h1>{state.status}</h1>
          </ErrorBoundary>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('Outside error boundary: Error test'),
    ).toBeInTheDocument()
    expect(rendered.getByText('Fallback error: Error test')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should update with data if we observe no properties and throwOnError', async () => {
    const key = queryKey()

    let result: UseQueryResult<string> | undefined

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        throwOnError: true,
      }))

      createEffect(() => {
        result = query
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(result?.data).toBe('data')
  })

  it('should set status to error instead of throwing when error should not be thrown', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Local Error'))),
        retry: false,
        throwOnError: (err) => err.message !== 'Local Error',
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>{state.error?.message}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()
    expect(rendered.getByText('Local Error')).toBeInTheDocument()
  })

  it('should throw error instead of setting status when error should be thrown', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Remote Error'))),
        retry: false,
        throwOnError: (err) => err.message !== 'Local Error',
      }))

      return (
        <div>
          <div>{state.data}</div>
          <h1>{state.status}</h1>
          <h2>{state.error?.message ?? ''}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          fallback={(error) => (
            <div>
              <div>error boundary</div>
              <div>{error?.message}</div>
            </div>
          )}
        >
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('Remote Error')).toBeInTheDocument()
  })

  it('should continue retries when observers unmount and remount while waiting for a retry (#3031)', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          throw new Error('some error')
        },
        retry: 2,

        retryDelay: 100,
      }))

      return (
        <div>
          <div>error: {result.error?.message ?? 'null'}</div>
          <div>failureCount: {result.failureCount}</div>
          <div>failureReason: {result.failureReason?.message}</div>
        </div>
      )
    }

    function App() {
      const [show, setShow] = createSignal(true)

      const toggle = () => setShow((s) => !s)

      return (
        <div>
          <button onClick={toggle}>{show() ? 'hide' : 'show'}</button>
          {show() && <Page />}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('failureCount: 1')).toBeInTheDocument()
    expect(rendered.getByText('failureReason: some error')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))
    expect(rendered.getByRole('button', { name: /show/i })).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /show/i }))

    // Wait for retry delay and second attempt
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(10)

    // Wait for third attempt
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('error: some error')).toBeInTheDocument()

    expect(count).toBe(3)
  })

  it('should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031)', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          throw new Error('some error')
        },
        retry: 2,
        retryDelay: 100,
      }))

      return (
        <div>
          <div>error: {result.error?.message ?? 'null'}</div>
          <div>failureCount: {result.failureCount}</div>
          <div>failureReason: {result.failureReason?.message}</div>
        </div>
      )
    }

    function App() {
      const [show, setShow] = createSignal(true)

      const toggle = () => setShow((s) => !s)

      return (
        <div>
          <button onClick={toggle}>{show() ? 'hide' : 'show'}</button>
          <button onClick={() => queryClient.cancelQueries({ queryKey: key })}>
            cancel
          </button>
          {show() && <Page />}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('failureCount: 1')).toBeInTheDocument()
    expect(rendered.getByText('failureReason: some error')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /hide/i }))
    fireEvent.click(rendered.getByRole('button', { name: /cancel/i }))

    expect(rendered.getByRole('button', { name: /show/i })).toBeInTheDocument()
    fireEvent.click(rendered.getByRole('button', { name: /show/i }))

    // Wait for new mount fetch
    await vi.advanceTimersByTimeAsync(10)

    // Wait for first retry
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(10)

    // Wait for second retry
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('error: some error')).toBeInTheDocument()

    // initial fetch (1), which will be cancelled, followed by new mount(2) + 2 retries = 4
    expect(count).toBe(4)
  })

  it('should always fetch if refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'prefetched'),
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        refetchOnMount: 'always',
        staleTime: 50,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return (
        <div>
          <div>data: {state.data ?? 'null'}</div>
          <div>isFetching: {state.isFetching}</div>
          <div>isStale: {state.isStale}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(60)

    expect(states.length).toBe(3)

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
    const states: Array<DefinedUseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        initialData: 'initial',
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

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
    const states: Array<DefinedUseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        staleTime: 50,
        initialData: 'initial',
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(60)

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
    const states: Array<DefinedUseQueryResult<string>> = []

    const oneSecondAgo = Date.now() - 1000

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        staleTime: 50,
        initialData: 'initial',
        initialDataUpdatedAt: oneSecondAgo,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(70)

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
    const states: Array<DefinedUseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        staleTime: 10 * 1000, // 10 seconds
        initialData: 'initial',
        initialDataUpdatedAt: 0,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

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
    const states: Array<Partial<DefinedUseQueryResult<{ count: number }>>> = []

    function Page() {
      const [count, setCount] = createSignal(0)
      const state = useQuery(() => ({
        queryKey: [key, count()],
        queryFn: () => sleep(10).then(() => ({ count: 10 })),
        staleTime: Infinity,
        initialData: () => ({ count: count() }),
        reconcile: false,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        setActTimeout(() => {
          setCount(1)
        }, 10)
      }, [])

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)
    // Initial
    expect(states[0]).toMatchObject({ data: { count: 0 } })
    // Set state
    expect(states[1]).toMatchObject({ data: { count: 1 } })
  })

  it('should retry specified number of times', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()
    queryFn.mockImplementation(() =>
      sleep(10).then(() => Promise.reject(new Error('Error test Barrett'))),
    )

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        retry: 1,
        retryDelay: 1,
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>Failed {state.failureCount} times</h2>
          <h2>Failed because {state.failureReason?.message}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pending')).toBeInTheDocument()
    expect(rendered.getByText('Failed 1 times')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()
    expect(rendered.getByText('Failed 2 times')).toBeInTheDocument()
    expect(
      rendered.getByText('Failed because Error test Barrett'),
    ).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should not retry if retry function `false`', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()

    queryFn.mockImplementationOnce(() =>
      sleep(10).then(() => Promise.reject(new Error('Error test Tanner'))),
    )

    queryFn.mockImplementation(() =>
      sleep(10).then(() => Promise.reject(new Error('NoRetry'))),
    )

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        retryDelay: 1,
        retry: (_failureCount, err) => err.message !== 'NoRetry',
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>Failed {state.failureCount} times</h2>
          <h2>Failed because {state.failureReason?.message}</h2>
          <h2>{state.error?.message}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pending')).toBeInTheDocument()
    expect(rendered.getByText('Failed 1 times')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()
    expect(rendered.getByText('Failed 2 times')).toBeInTheDocument()
    expect(rendered.getByText('Failed because NoRetry')).toBeInTheDocument()
    expect(rendered.getByText('NoRetry')).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should extract retryDelay from error', async () => {
    const key = queryKey()

    type DelayError = { delay: number }

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()
    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw { delay: 50 }
    })

    function Page() {
      const state = useQuery<unknown, DelayError>(() => ({
        queryKey: key,
        queryFn,
        retry: 1,
        retryDelay: (_, error: DelayError) => error.delay,
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>Failed {state.failureCount} times</h2>
          <h2>Failed because DelayError: {state.failureReason?.delay}ms</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pending')).toBeInTheDocument()
    expect(rendered.getByText('Failed 1 times')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(50)
    expect(
      rendered.getByText('Failed because DelayError: 50ms'),
    ).toBeInTheDocument()
    expect(rendered.getByText('Failed 2 times')).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0

    function Page() {
      const query = useQuery<unknown, string>(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          throw `fetching error ${count}`
        },
        retry: 3,
        retryDelay: 1,
      }))

      return (
        <div>
          <div>error {String(query.error)}</div>
          <div>status {query.status}</div>
          <div>failureCount {query.failureCount}</div>
          <div>failureReason {query.failureReason}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // The query should display the first error result
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('failureCount 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(11)

    expect(
      rendered.getByText('failureReason fetching error 1'),
    ).toBeInTheDocument()
    expect(rendered.getByText('status pending')).toBeInTheDocument()
    expect(rendered.getByText('error null')).toBeInTheDocument()
    // Check if the query really paused
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('failureCount 1')).toBeInTheDocument()

    expect(
      rendered.getByText('failureReason fetching error 1'),
    ).toBeInTheDocument()

    visibilityMock.mockRestore()
    window.dispatchEvent(new Event('visibilitychange'))

    // Wait for the final result
    // 2nd retry: 10ms (queryFn)
    await vi.advanceTimersByTimeAsync(10)
    // 3rd retry: 1ms (retryDelay) + 10ms (queryFn)
    await vi.advanceTimersByTimeAsync(11)
    // 4th retry (final): 1ms (retryDelay) + 10ms (queryFn)
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('failureCount 4')).toBeInTheDocument()

    expect(
      rendered.getByText('failureReason fetching error 4'),
    ).toBeInTheDocument()

    expect(rendered.getByText('status error')).toBeInTheDocument()

    expect(rendered.getByText('error fetching error 4')).toBeInTheDocument()
    // Check if the query really stopped
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('failureCount 4')).toBeInTheDocument()
    expect(
      rendered.getByText('failureReason fetching error 4'),
    ).toBeInTheDocument()
  })

  it('should fetch on mount when a query was already created with setQueryData', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

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
    const states: Array<UseQueryResult<string>> = []

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    // set data in cache to check if the hook query fn is actually called
    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return (
        <div>
          {state.data}, {state.isStale}, {state.isFetching}
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)

    // reset visibilityState to original value
    visibilityMock.mockRestore()
    window.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(4)

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
    const states: Array<UseQueryResult<string>> = []

    const queryFn = vi.fn<(...args: Array<unknown>) => string>()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = vi.fn<(...args: Array<unknown>) => string>()
    prefetchQueryFn.mockImplementation(() => 'not yet...')

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: prefetchQueryFn,
      staleTime: 10,
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(states.length).toBe(2)

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not refetch if not stale after a prefetch', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => Promise<string>>()
    queryFn.mockImplementation(() => sleep(10).then(() => 'data'))

    const prefetchQueryFn =
      vi.fn<(...args: Array<unknown>) => Promise<string>>()
    prefetchQueryFn.mockImplementation(() => sleep(10).then(() => 'not yet...'))

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: prefetchQueryFn,
      staleTime: 1000,
    })
    await vi.advanceTimersByTimeAsync(10)

    function Page() {
      useQuery(() => ({ queryKey: key, queryFn, staleTime: 1000 }))
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  // See https://github.com/tannerlinsley/react-query/issues/190
  it('should reset failureCount and failureReason on successful fetch', async () => {
    const key = queryKey()

    function Page() {
      let counter = 0

      const query = useQuery<unknown, Error>(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          if (counter < 2) {
            counter++
            throw new Error('error')
          } else {
            return 'data'
          }
        },
        retryDelay: 10,
      }))

      return (
        <div>
          <div>failureCount {query.failureCount}</div>
          <div>failureReason {query.failureReason?.message ?? 'null'}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('failureCount 1')).toBeInTheDocument()

    // Wait for first retry
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('failureCount 2')).toBeInTheDocument()
    expect(rendered.getByText('failureReason error')).toBeInTheDocument()

    // Wait for second retry (success)
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('failureCount 0')).toBeInTheDocument()
    expect(rendered.getByText('failureReason null')).toBeInTheDocument()
  })

  // See https://github.com/tannerlinsley/react-query/issues/199
  it('should use prefetched data for dependent query', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const [isPrefetched, setPrefetched] = createSignal(false)

      const query = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count
        },
        enabled: enabled(),
      }))

      createEffect(() => {
        async function prefetch() {
          await queryClient.prefetchQuery({
            queryKey: key,
            queryFn: () => Promise.resolve('prefetched data'),
          })
          setPrefetched(true)
        }
        prefetch()
      })

      return (
        <div>
          {isPrefetched() && <div>isPrefetched</div>}
          <button onClick={() => setEnabled(true)}>setKey</button>
          <div>data: {query.data}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isPrefetched')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('setKey'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('data: prefetched data')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(count).toBe(1)
  })

  it('should support dependent queries via the enable config option', async () => {
    const key = queryKey()

    function Page() {
      const [shouldFetch, setShouldFetch] = createSignal(false)

      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        enabled: shouldFetch(),
      }))

      return (
        <div>
          <div>FetchStatus: {query.fetchStatus}</div>
          <h2>Data: {query.data || 'no data'}</h2>
          {shouldFetch() ? null : (
            <button onClick={() => setShouldFetch(true)}>fetch</button>
          )}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('FetchStatus: idle')).toBeInTheDocument()
    expect(rendered.getByText('Data: no data')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('fetch'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('FetchStatus: fetching')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: data')).toBeInTheDocument()
  })

  // See https://github.com/TanStack/query/issues/7711
  it('race condition: should cleanup observers after component that created the query is unmounted #1', async () => {
    const key = queryKey()

    function Component() {
      let val = 1
      const dataQuery = useQuery(() => ({
        queryKey: [key],
        queryFn: () => sleep(10).then(() => val++),
      }))

      return (
        <div>
          <p>component</p>
          <p>data: {String(dataQuery.data)}</p>
        </div>
      )
    }

    const Outer = () => {
      const [showComp, setShowComp] = createSignal(true)
      return (
        <div>
          <button
            onClick={() => {
              queryClient.invalidateQueries()
              setShowComp(!showComp())
            }}
          >
            toggle
          </button>
          {showComp() ? <Component /> : <div>not showing</div>}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Outer />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('component')).toBeInTheDocument()
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('toggle'))
    expect(rendered.getByText('not showing')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('toggle'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('component')).toBeInTheDocument()
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('toggle'))
    expect(rendered.getByText('not showing')).toBeInTheDocument()

    const entry = queryClient.getQueryCache().find({
      queryKey: [key],
    })!

    expect(entry.getObserversCount()).toBe(0)
  })

  // See https://github.com/TanStack/query/issues/7711
  it('race condition: should cleanup observers after component that created the query is unmounted #2', async () => {
    const key = queryKey()

    function Component() {
      let val = 1
      const dataQuery = useQuery(() => ({
        queryKey: [key],
        queryFn: () => sleep(10).then(() => val++),
      }))

      return (
        <div>
          <p>component</p>
          <p>data: {String(dataQuery.data)}</p>
        </div>
      )
    }

    const Outer = () => {
      const [showComp, setShowComp] = createSignal(true)
      return (
        <div>
          <button
            onClick={() => {
              queueMicrotask(() => setShowComp(!showComp()))
              queryClient.invalidateQueries()
            }}
          >
            toggle
          </button>
          {showComp() ? <Component /> : <div>not showing</div>}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Outer />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('component')).toBeInTheDocument()
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('toggle'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('not showing')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('toggle'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('component')).toBeInTheDocument()
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('toggle'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('not showing')).toBeInTheDocument()

    const entry = queryClient.getQueryCache().find({
      queryKey: [key],
    })!

    expect(entry.getObserversCount()).toBe(0)
  })

  it('should mark query as fetching, when using initialData', async () => {
    const key = queryKey()
    const results: Array<DefinedUseQueryResult<string>> = []

    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'serverData'),
        initialData: 'initialData',
      }))

      createRenderEffect(() => {
        results.push({ ...result })
      })

      return <div>data: {result.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('data: initialData')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: serverData')).toBeInTheDocument()

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 'initialData', isFetching: true })
    expect(results[1]).toMatchObject({ data: 'serverData', isFetching: false })
  })

  it('should initialize state properly, when initialData is falsy', async () => {
    const key = queryKey()
    const results: Array<DefinedUseQueryResult<number>> = []

    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 1),
        initialData: 0,
      }))

      createRenderEffect(() => {
        results.push({ ...result })
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 0, isFetching: true })
    expect(results[1]).toMatchObject({ data: 1, isFetching: false })
  })

  // // See https://github.com/tannerlinsley/react-query/issues/214
  it('data should persist when enabled is changed to false', async () => {
    const key = queryKey()
    const results: Array<DefinedUseQueryResult<string>> = []

    function Page() {
      const [shouldFetch, setShouldFetch] = createSignal(true)

      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched data'),
        enabled: shouldFetch(),
        initialData: shouldFetch() ? 'initial' : 'initial falsy',
      }))

      createRenderEffect(() => {
        results.push({ ...result })
      })

      createEffect(() => {
        setActTimeout(() => {
          setShouldFetch(false)
        }, 15)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(15)

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject({ data: 'initial', isStale: true })
    expect(results[1]).toMatchObject({ data: 'fetched data', isStale: true })
    // disabled observers are not stale
    expect(results[2]).toMatchObject({ data: 'fetched data', isStale: false })
  })

  it('should support enabled:false in query object syntax', () => {
    const key = queryKey()
    const queryFn = vi.fn<(...args: Array<unknown>) => string>()
    queryFn.mockImplementation(() => 'data')

    function Page() {
      const { fetchStatus } = useQuery(() => ({
        queryKey: key,
        queryFn,
        enabled: false,
      }))

      return <div>fetchStatus: {fetchStatus}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(queryFn).not.toHaveBeenCalled()
    expect(queryCache.find({ queryKey: key })).not.toBeUndefined()
    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()
  })

  // See https://github.com/tannerlinsley/react-query/issues/360
  it('should init to status:pending, fetchStatus:idle when enabled is false', async () => {
    const key = queryKey()

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        enabled: false,
      }))

      return (
        <div>
          <div>
            status: {query.status}, {query.fetchStatus}
          </div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('status: pending, idle')).toBeInTheDocument()
  })

  it('should not schedule garbage collection, if gcTimeout is set to `Infinity`', async () => {
    const key = queryKey()

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched data'),
        gcTime: Infinity,
      }))
      return <div>{query.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('fetched data')).toBeInTheDocument()
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    rendered.unmount()

    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  it('should schedule garbage collection, if gcTimeout is not set to `Infinity`', async () => {
    const key = queryKey()

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched data'),
        gcTime: 1000 * 60 * 10, // 10 Minutes
      }))
      return <div>{query.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('fetched data')).toBeInTheDocument()
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    rendered.unmount()

    expect(setTimeoutSpy).toHaveBeenLastCalledWith(
      expect.any(Function),
      1000 * 60 * 10,
    )
  })

  it('should not cause memo churn when data does not change', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn<(...args: Array<unknown>) => string>()
      .mockReturnValue('data')
    const memoFn = vi.fn()

    function Page() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => queryFn() || { data: { nested: true } }),
      }))

      createMemo(() => {
        memoFn()
        return result.data
      })

      return (
        <div>
          <div>status {result.status}</div>
          <div>isFetching {result.isFetching ? 'true' : 'false'}</div>
          <button onClick={() => result.refetch()}>refetch</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('status pending')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('status success')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('refetch'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isFetching true')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('isFetching false')).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(memoFn).toHaveBeenCalledTimes(2)
  })

  it('should update data upon interval changes', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const [int, setInt] = createSignal(200)
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        refetchInterval: int(),
      }))

      createEffect(() => {
        if (state.data === 2) {
          setInt(0)
        }
      })

      return <div>count: {state.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // mount
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('count: 0')).toBeInTheDocument()
    // Wait for first interval
    await vi.advanceTimersByTimeAsync(210)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
    // Wait for second interval
    await vi.advanceTimersByTimeAsync(210)
    expect(rendered.getByText('count: 2')).toBeInTheDocument()
  })

  it('should refetch in an interval depending on function result', async () => {
    const key = queryKey()
    let count = 0
    const states: Array<UseQueryResult<number>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => count++),
        refetchInterval: ({ state: { data = 0 } }) => (data < 2 ? 10 : false),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <h1>count: {state.data}</h1>
          <h2>status: {state.status}</h2>
          <h2>data: {state.data}</h2>
          <h2>refetch: {state.isRefetching}</h2>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // Initial fetch (10ms)
    await vi.advanceTimersByTimeAsync(10)

    // First interval (10ms delay + 10ms fetch)
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(10)

    // Second interval (10ms delay + 10ms fetch)
    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('count: 2')).toBeInTheDocument()

    expect(states.length).toEqual(6)

    expect(states).toMatchObject([
      {
        status: 'pending',
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
    const states: Array<UseQueryResult<number>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 1),
        refetchInterval: 0,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return <div>count: {state.data}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

    // extra advance to make sure we're not re-fetching
    await vi.advanceTimersByTimeAsync(100)

    expect(states.length).toEqual(2)

    expect(states).toMatchObject([
      {
        status: 'pending',
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
      const result = useQuery(() => ({
        queryKey: [''],
        queryFn: (ctx) => sleep(10).then(() => ctx.queryKey),
      }))
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('[""]')).toBeInTheDocument()
  })

  it('should accept an object as query key', async () => {
    function Page() {
      const result = useQuery(() => ({
        queryKey: [{ a: 'a' }],
        queryFn: (ctx) => sleep(10).then(() => ctx.queryKey),
      }))
      return <>{JSON.stringify(result.data)}</>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('[{"a":"a"}]')).toBeInTheDocument()
  })

  it('should refetch if any query instance becomes enabled', async () => {
    const key = queryKey()

    const queryFn = vi
      .fn<(...args: Array<unknown>) => Promise<string>>()
      .mockReturnValue(sleep(10).then(() => 'data'))

    function Disabled() {
      useQuery(() => ({ queryKey: key, queryFn, enabled: false }))
      return null
    }

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const result = useQuery(() => ({
        queryKey: key,
        queryFn,
        enabled: enabled(),
      }))
      return (
        <>
          <Disabled />
          <div>{result.data}</div>
          <button onClick={() => setEnabled(true)}>enable</button>
        </>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(queryFn).toHaveBeenCalledTimes(0)

    fireEvent.click(rendered.getByText('enable'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data')).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use placeholder data while the query loads', async () => {
    const key1 = queryKey()

    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'data'),
        placeholderData: 'placeholder',
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: data')).toBeInTheDocument()

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

    const states: Array<{ state: UseQueryResult<string>; count: number }> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 'data'),
        placeholderData: 'placeholder',
        enabled: count() === 0,
      }))

      createRenderEffect(() => {
        states.push({ state: { ...state }, count: count() })
      })

      createEffect(() => {
        setCount(1)
      })

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: data')).toBeInTheDocument()

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

    const states: Array<UseQueryResult<string>> = []

    function Page() {
      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 1),
        placeholderData: 23,
        select: (data) => String(data * 2),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: 2')).toBeInTheDocument()

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

    const states: Array<UseQueryResult<string>> = []
    let placeholderFunctionRunCount = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 1),
        placeholderData: () => {
          placeholderFunctionRunCount++
          return 23
        },
        select: (data) => String(data * 2),
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <div>Status: {state.status}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: 2')).toBeInTheDocument()

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

    expect(placeholderFunctionRunCount).toEqual(1)
  })

  it('select should always return the correct state', async () => {
    const key1 = queryKey()

    function Page() {
      const [count, setCount] = createSignal(2)
      const [forceValue, setForceValue] = createSignal(1)

      const inc = () => {
        setCount((prev) => prev + 1)
      }

      const forceUpdate = () => {
        setForceValue((prev) => prev + 1)
      }

      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 0),
        get select() {
          const currentCount = count()
          return (data: number) => `selected ${data + currentCount}`
        },
        placeholderData: 99,
      }))

      return (
        <div>
          <h2>Data: {state.data}</h2>
          <h2>forceValue: {forceValue()}</h2>
          <button onClick={inc}>inc: {count()}</button>
          <button onClick={forceUpdate}>forceUpdate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('Data: selected 101')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: selected 2')).toBeInTheDocument()
    fireEvent.click(rendered.getByRole('button', { name: /inc/i }))
    expect(rendered.getByText('Data: selected 3')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /forceUpdate/i }))
    expect(rendered.getByText('forceValue: 2')).toBeInTheDocument()
    // data should still be 3 after an independent re-render
    expect(rendered.getByText('Data: selected 3')).toBeInTheDocument()
  })

  it('select should structurally share data', async () => {
    const key1 = queryKey()
    const states: Array<Array<number>> = []

    function Page() {
      const [forceValue, setForceValue] = createSignal(1)

      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => [1, 2]),
        select: (res) => res.map((x) => x + 1),
      }))

      createEffect(() => {
        if (state.data) {
          states.push(state.data)
        }
      })

      const forceUpdate = () => {
        setForceValue((prev) => prev + 1)
      }

      return (
        <div>
          <h2>Data: {JSON.stringify(state.data)}</h2>
          <h2>forceValue: {forceValue()}</h2>
          <button onClick={forceUpdate}>forceUpdate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: [2,3]')).toBeInTheDocument()
    expect(states).toHaveLength(1)

    fireEvent.click(rendered.getByRole('button', { name: /forceUpdate/i }))
    expect(rendered.getByText('forceValue: 2')).toBeInTheDocument()
    expect(rendered.getByText('Data: [2,3]')).toBeInTheDocument()

    // effect should not be triggered again due to structural sharing
    expect(states).toHaveLength(1)
  })

  it('The reconcile fn callback should correctly maintain referential equality', async () => {
    const key1 = queryKey()
    const states: Array<Array<number>> = []

    function Page() {
      const [forceValue, setForceValue] = createSignal(1)

      const state = useQuery(() => ({
        queryKey: key1,
        queryFn: () => sleep(10).then(() => [1, 2]),
        select: (res) => res.map((x) => x + 1),
        reconcile(oldData, newData) {
          return reconcile(newData)(oldData)
        },
      }))

      createEffect(() => {
        if (state.data) {
          states.push(state.data)
        }
      })

      const forceUpdate = () => {
        setForceValue((prev) => prev + 1)
      }

      return (
        <div>
          <h2>Data: {JSON.stringify(state.data)}</h2>
          <h2>forceValue: {forceValue()}</h2>
          <button onClick={forceUpdate}>forceUpdate</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data: [2,3]')).toBeInTheDocument()
    expect(states).toHaveLength(1)

    fireEvent.click(rendered.getByRole('button', { name: /forceUpdate/i }))
    expect(rendered.getByText('forceValue: 2')).toBeInTheDocument()
    expect(rendered.getByText('Data: [2,3]')).toBeInTheDocument()

    // effect should not be triggered again due to structural sharing
    expect(states).toHaveLength(1)
  })

  it('should cancel the query function when there are no more subscriptions', async () => {
    const key = queryKey()
    let cancelFn: Mock = vi.fn()

    const queryFn = ({ signal }: { signal?: AbortSignal }) => {
      const promise = new Promise<string>((resolve, reject) => {
        cancelFn = vi.fn(() => reject('Cancelled'))
        signal?.addEventListener('abort', cancelFn)
        sleep(20).then(() => resolve('OK'))
      })

      return promise
    }

    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn }))
      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Blink duration={5}>
          <Page />
        </Blink>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('off')).toBeInTheDocument()

    expect(cancelFn).toHaveBeenCalled()
  })

  it('should cancel the query if the signal was consumed and there are no more subscriptions', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    const queryFn: QueryFunction<
      string,
      readonly [typeof key, number]
    > = async (ctx) => {
      const [, limit] = ctx.queryKey
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const value = limit % 2 && ctx.signal ? 'abort' : `data ${limit}`
      await sleep(25)
      return value
    }

    function Page(props: { limit: number }) {
      const state = useQuery(() => ({
        queryKey: [key, props.limit] as const,
        queryFn,
      }))
      states[props.limit] = state
      return (
        <div>
          <h1>Status: {state.status}</h1>
          <h1>data: {state.data}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Blink duration={5}>
          <Page limit={0} />
          <Page limit={1} />
          <Page limit={2} />
          <Page limit={3} />
        </Blink>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('off')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(15)

    expect(states).toHaveLength(4)

    expect(queryCache.find({ queryKey: [key, 0] })?.state).toMatchObject({
      data: 'data 0',
      status: 'success',
      dataUpdateCount: 1,
    })

    expect(queryCache.find({ queryKey: [key, 1] })?.state).toMatchObject({
      data: undefined,
      status: 'pending',
      fetchStatus: 'idle',
    })

    expect(queryCache.find({ queryKey: [key, 2] })?.state).toMatchObject({
      data: 'data 2',
      status: 'success',
      dataUpdateCount: 1,
    })

    expect(queryCache.find({ queryKey: [key, 3] })?.state).toMatchObject({
      data: undefined,
      status: 'pending',
      fetchStatus: 'idle',
    })
  })

  it('should refetch when quickly switching to a failed query', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    const queryFn = () => sleep(50).then(() => 'OK')

    function Page() {
      const [id, setId] = createSignal(1)
      const [hasChanged, setHasChanged] = createSignal(false)

      const state = useQuery(() => ({ queryKey: [key, id()], queryFn }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(
        on(hasChanged, () => {
          setId((prevId) => (prevId === 1 ? 2 : 1))
          setHasChanged(true)
        }),
      )

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(50)
    expect(states.length).toBe(2)
    // Load query 1
    expect(states[0]).toMatchObject({
      status: 'pending',
      error: null,
    })
    // No rerenders - No state updates
    // Loaded query 1
    expect(states[1]).toMatchObject({
      status: 'success',
      error: null,
    })
  })

  it('should update query state and refetch when reset with resetQueries', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count
        },
        staleTime: Infinity,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => queryClient.resetQueries({ queryKey: key })}>
            reset
          </button>
          <div>data: {state.data ?? 'null'}</div>
          <div>isFetching: {state.isFetching}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(count).toBe(2)
    expect(states.length).toBe(4)

    expect(states[0]).toMatchObject({
      isPending: true,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      data: 1,
      isPending: false,
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
    expect(states[2]).toMatchObject({
      isPending: true,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[3]).toMatchObject({
      data: 2,
      isPending: false,
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
  })

  it('should update query state and not refetch when resetting a disabled query with resetQueries', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count
        },
        staleTime: Infinity,
        enabled: false,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      const { refetch } = state

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          <button onClick={() => queryClient.resetQueries({ queryKey: key })}>
            reset
          </button>
          <div>data: {state.data ?? 'null'}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('data: null')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /reset/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: null')).toBeInTheDocument()

    expect(states.length).toBe(4)

    expect(count).toBe(1)

    expect(states[0]).toMatchObject({
      isPending: true,
      isFetching: false,
      isSuccess: false,
      isStale: false,
    })
    expect(states[1]).toMatchObject({
      isPending: true,
      isFetching: true,
      isSuccess: false,
      isStale: false,
    })
    expect(states[2]).toMatchObject({
      data: 1,
      isPending: false,
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
    expect(states[3]).toMatchObject({
      isPending: true,
      isFetching: false,
      isSuccess: false,
      isStale: false,
    })
  })

  it('should only call the query hash function once', async () => {
    const key = queryKey()

    let hashes = 0

    function queryKeyHashFn(x: any) {
      hashes++
      return JSON.stringify(x)
    }

    function Page() {
      useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
        queryKeyHashFn,
      }))

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(hashes).toBe(1)
  })

  it('should refetch when changed enabled to true in error state', async () => {
    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()
    queryFn.mockImplementation(() =>
      sleep(10).then(() => Promise.reject(new Error('Suspense Error Bingo'))),
    )

    function Page(props: { enabled: boolean }) {
      const state = useQuery(() => ({
        queryKey: ['key'],
        queryFn,
        enabled: props.enabled,
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }))

      return (
        <Switch fallback={<div>rendered</div>}>
          <Match when={state.isPending}>
            <div>status: pending</div>
          </Match>
          <Match when={state.error instanceof Error}>
            <div>error</div>
          </Match>
        </Switch>
      )
    }

    function App() {
      const [enabled, setEnabled] = createSignal(true)
      const toggle = () => setEnabled((prev) => !prev)

      return (
        <div>
          <Page enabled={enabled()} />
          <button aria-label="retry" onClick={toggle}>
            retry {enabled()}
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // initial state check
    expect(rendered.getByText('status: pending')).toBeInTheDocument()

    // // render error state component
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('error')).toBeInTheDocument()
    expect(queryFn).toBeCalledTimes(1)

    // change to enabled to false
    fireEvent.click(rendered.getByLabelText('retry'))
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('error')).toBeInTheDocument()
    expect(queryFn).toBeCalledTimes(1)

    // // change to enabled to true
    fireEvent.click(rendered.getByLabelText('retry'))
    expect(queryFn).toBeCalledTimes(2)
  })

  it('should refetch when query key changed when previous status is error', async () => {
    function Page(props: { id: number }) {
      const state = useQuery(() => ({
        queryKey: [props.id],
        queryFn: () =>
          sleep(10).then(() =>
            props.id % 2 === 1 ? Promise.reject(new Error('Error')) : 'data',
          ),
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }))

      return (
        <Switch fallback={<div>rendered</div>}>
          <Match when={state.isPending}>
            <div>status: pending</div>
          </Match>
          <Match when={state.error instanceof Error}>
            <div>error</div>
          </Match>
        </Switch>
      )
    }

    function App() {
      const [id, setId] = createSignal(1)
      const changeId = () => setId((x) => x + 1)

      return (
        <div>
          <Page id={id()} />
          <button aria-label="change" onClick={changeId}>
            change {id()}
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // initial state check
    expect(rendered.getByText('status: pending')).toBeInTheDocument()
    // render error state component
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()

    // change to unmount query
    fireEvent.click(rendered.getByLabelText('change'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change to mount new query
    fireEvent.click(rendered.getByLabelText('change'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()
  })

  it('should refetch when query key changed when switching between erroneous queries', async () => {
    function Page(props: { id: boolean }) {
      const state = useQuery(() => ({
        queryKey: [props.id],
        queryFn: () => sleep(10).then(() => Promise.reject(new Error('Error'))),
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      }))
      return (
        <Switch fallback={<div>rendered</div>}>
          <Match when={state.isFetching}>
            <div>status: fetching</div>
          </Match>
          <Match when={state.error instanceof Error}>
            <div>error</div>
          </Match>
        </Switch>
      )
    }

    function App() {
      const [value, setValue] = createSignal(true)
      const toggle = () => setValue((x) => !x)

      return (
        <div>
          <Page id={value()} />
          <button aria-label="change" onClick={toggle}>
            change {value()}
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // initial state check
    expect(rendered.getByText('status: fetching')).toBeInTheDocument()
    // render error state component
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()

    // change to mount second query
    fireEvent.click(rendered.getByLabelText('change'))
    expect(rendered.getByText('status: fetching')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()

    // change to mount first query again
    fireEvent.click(rendered.getByLabelText('change'))
    expect(rendered.getByText('status: fetching')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()
  })

  it('should have no error in pending state when refetching after error occurred', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []
    const error = new Error('oops')

    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          if (count === 0) {
            count++
            throw error
          }
          return 5
        },
        retry: false,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <Switch fallback={<div>data: {state.data}</div>}>
          <Match when={state.isPending}>
            <div>status: pending</div>
          </Match>
          <Match when={state.error instanceof Error}>
            <div>
              <div>error</div>
              <button onClick={() => state.refetch()}>refetch</button>
            </div>
          </Match>
        </Switch>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 5')).toBeInTheDocument()

    expect(states.length).toBe(4)

    expect(states[0]).toMatchObject({
      status: 'pending',
      data: undefined,
      error: null,
    })

    expect(states[1]).toMatchObject({
      status: 'error',
      data: undefined,
      error,
    })

    expect(states[2]).toMatchObject({
      status: 'pending',
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
      const onlineMock = mockOnlineManagerIsOnline(false)

      const key = queryKey()
      const states: Array<any> = []

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'data'),
        }))

        createEffect(() => {
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

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: pending, isPaused: true'),
      ).toBeInTheDocument()

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, isPaused: false'),
      ).toBeInTheDocument()
      expect(rendered.getByText('data: data')).toBeInTheDocument()

      expect(states).toEqual(['paused', 'fetching', 'idle'])
    })

    it('online queries should not refetch if you are offline', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery<unknown, string, string>(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
        }))

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

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      expect(
        rendered.getByText(
          'status: pending, fetchStatus: fetching, failureCount: 0',
        ),
      ).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(10)
      expect(rendered.getByText('data: data1')).toBeInTheDocument()

      const onlineMock = mockOnlineManagerIsOnline(false)
      window.dispatchEvent(new Event('offline'))

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText(
          'status: success, fetchStatus: paused, failureCount: 0',
        ),
      ).toBeInTheDocument()
      expect(rendered.getByText('failureReason: null')).toBeInTheDocument()

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await vi.advanceTimersByTimeAsync(0)
      expect(
        rendered.getByText(
          'status: success, fetchStatus: fetching, failureCount: 0',
        ),
      ).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText(
          'status: success, fetchStatus: idle, failureCount: 0',
        ),
      ).toBeInTheDocument()
      expect(rendered.getByText('failureReason: null')).toBeInTheDocument()
      expect(rendered.getByText('data: data2')).toBeInTheDocument()
    })

    it('online queries should not refetch if you are offline and refocus', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
        }))

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

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      expect(
        rendered.getByText('status: pending, fetchStatus: fetching'),
      ).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(10)
      expect(rendered.getByText('data: data1')).toBeInTheDocument()

      const onlineMock = mockOnlineManagerIsOnline(false)

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, fetchStatus: paused'),
      ).toBeInTheDocument()
      window.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(10)
      expect(rendered.queryByText('data: data2')).not.toBeInTheDocument()
      expect(count).toBe(1)
      onlineMock.mockRestore()
    })

    it('online queries should not refetch while already paused', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
        }))

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

      const onlineMock = mockOnlineManagerIsOnline(false)

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      expect(
        rendered.getByText('status: pending, fetchStatus: paused'),
      ).toBeInTheDocument()
      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
      // invalidation should not trigger a refetch
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: pending, fetchStatus: paused'),
      ).toBeInTheDocument()
      expect(count).toBe(0)
      onlineMock.mockRestore()
    })

    it('online queries should not refetch while already paused if data is in the cache', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
          initialData: 'initial',
        }))

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

      const onlineMock = mockOnlineManagerIsOnline(false)

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      expect(
        rendered.getByText('status: success, fetchStatus: paused'),
      ).toBeInTheDocument()
      expect(rendered.getByText('data: initial')).toBeInTheDocument()

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
      // invalidation should not trigger a refetch
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, fetchStatus: paused'),
      ).toBeInTheDocument()
      expect(count).toBe(0)
      onlineMock.mockRestore()
    })

    it('online queries should not get stuck in fetching state when pausing multiple times', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
          initialData: 'initial',
        }))

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

      const onlineMock = mockOnlineManagerIsOnline(false)

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, fetchStatus: paused'),
      ).toBeInTheDocument()
      expect(rendered.getByText('data: initial')).toBeInTheDocument()

      // triggers one pause
      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))

      await vi.advanceTimersByTimeAsync(10)

      expect(
        rendered.getByText('status: success, fetchStatus: paused'),
      ).toBeInTheDocument()
      // triggers a second pause
      window.dispatchEvent(new Event('visibilitychange'))

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, fetchStatus: idle'),
      ).toBeInTheDocument()
      expect(rendered.getByText('data: data1')).toBeInTheDocument()

      expect(count).toBe(1)
    })

    it('online queries should pause retries if you are offline', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery<unknown, Error>(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            throw new Error('failed' + count)
          },
          retry: 2,
          retryDelay: 10,
        }))

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

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      // First retry (online): retryDelay (10ms) + queryFn (10ms)
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText(
          'status: pending, fetchStatus: fetching, failureCount: 1',
        ),
      ).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(10)
      expect(rendered.getByText('failureReason: failed1')).toBeInTheDocument()

      window.dispatchEvent(new Event('offline'))
      const onlineMock = mockOnlineManagerIsOnline(false)

      // Second retry (offline, paused): retryDelay (10ms) + queryFn (10ms)
      // Third retry is scheduled but paused due to offline
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText(
          'status: pending, fetchStatus: paused, failureCount: 2',
        ),
      ).toBeInTheDocument()
      expect(rendered.getByText('failureReason: failed2')).toBeInTheDocument()

      expect(count).toBe(2)

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      // Third retry (resumed): only queryFn (10ms), retryDelay already consumed while paused
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: error, fetchStatus: idle, failureCount: 3'),
      ).toBeInTheDocument()
      expect(rendered.getByText('failureReason: failed3')).toBeInTheDocument()

      expect(count).toBe(3)
    })

    it('online queries should fetch if paused and we go online even if already unmounted (because not cancelled)', async () => {
      const key = queryKey()
      let count = 0

      function Component() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
        }))

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
        const [show, setShow] = createSignal(true)

        return (
          <div>
            {show() && <Component />}
            <button onClick={() => setShow(false)}>hide</button>
          </div>
        )
      }

      const onlineMock = mockOnlineManagerIsOnline(false)

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      expect(
        rendered.getByText('status: pending, fetchStatus: paused'),
      ).toBeInTheDocument()

      fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await vi.advanceTimersByTimeAsync(10)
      expect(queryClient.getQueryState(key)).toMatchObject({
        fetchStatus: 'idle',
        status: 'success',
      })

      expect(count).toBe(1)
    })

    it('online queries should not fetch if paused and we go online when cancelled and no refetchOnReconnect', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data' + count
          },
          refetchOnReconnect: false,
        }))

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

      const onlineMock = mockOnlineManagerIsOnline(false)

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      expect(
        rendered.getByText('status: pending, fetchStatus: paused'),
      ).toBeInTheDocument()

      fireEvent.click(rendered.getByRole('button', { name: /cancel/i }))
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: pending, fetchStatus: idle'),
      ).toBeInTheDocument()
      expect(count).toBe(0)

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      expect(
        rendered.getByText('status: pending, fetchStatus: idle'),
      ).toBeInTheDocument()
      expect(count).toBe(0)

      onlineMock.mockRestore()
    })

    it('online queries should not fetch if paused and we go online if already unmounted when signal consumed', async () => {
      const key = queryKey()
      let count = 0

      function Component() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async ({ signal: _signal }) => {
            await sleep(10)
            count++
            return `signal${count}`
          },
        }))

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
        const [show, setShow] = createSignal(true)

        return (
          <div>
            {show() && <Component />}
            <button onClick={() => setShow(false)}>hide</button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: key })}
            >
              invalidate
            </button>
          </div>
        )
      }

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, fetchStatus: idle'),
      ).toBeInTheDocument()
      const onlineMock = mockOnlineManagerIsOnline(false)

      fireEvent.click(rendered.getByRole('button', { name: /invalidate/i }))
      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, fetchStatus: paused'),
      ).toBeInTheDocument()
      fireEvent.click(rendered.getByRole('button', { name: /hide/i }))

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

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
      const onlineMock = mockOnlineManagerIsOnline(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'data ' + count
          },
          networkMode: 'always',
        }))

        return (
          <div>
            <div>
              status: {state.status}, isPaused: {String(state.isPaused)}
            </div>
            <div>data: {state.data}</div>
          </div>
        )
      }

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await vi.advanceTimersByTimeAsync(10)
      expect(
        rendered.getByText('status: success, isPaused: false'),
      ).toBeInTheDocument()
      expect(rendered.getByText('data: data 1')).toBeInTheDocument()

      onlineMock.mockRestore()
    })

    it('always queries should not pause retries', async () => {
      const onlineMock = mockOnlineManagerIsOnline(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            throw new Error('error ' + count)
          },
          networkMode: 'always',
          retry: 1,
          retryDelay: 5,
        }))

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

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(10)

      expect(
        rendered.getByText('status: error, isPaused: false'),
      ).toBeInTheDocument()

      expect(rendered.getByText('error: error 2')).toBeInTheDocument()

      expect(count).toBe(2)

      onlineMock.mockRestore()
    })
  })

  describe('networkMode offlineFirst', () => {
    it('offlineFirst queries should start fetching if you are offline, but pause retries', async () => {
      const onlineMock = mockOnlineManagerIsOnline(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = useQuery<unknown, Error>(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            throw new Error('failed' + count)
          },
          retry: 2,
          retryDelay: 1,
          networkMode: 'offlineFirst',
        }))

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

      const rendered = render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      // Initial fetch completes while offline: queryFn (10ms) + micro delay (1ms)
      // First retry is scheduled but paused due to offline
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(1)

      expect(
        rendered.getByText(
          'status: pending, fetchStatus: paused, failureCount: 1',
        ),
      ).toBeInTheDocument()
      expect(rendered.getByText('failureReason: failed1')).toBeInTheDocument()

      expect(count).toBe(1)

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      // Resume retries when back online
      // First retry (resumed): queryFn (10ms)
      // Second retry: retryDelay (10ms) + queryFn (10ms) - but only 10ms shown means they overlap or execute together
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(10)

      expect(
        rendered.getByText('status: error, fetchStatus: idle, failureCount: 3'),
      ).toBeInTheDocument()
      expect(rendered.getByText('failureReason: failed3')).toBeInTheDocument()

      expect(count).toBe(3)
    })
  })

  it('should have status=error on mount when a query has failed', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<unknown>> = []
    const error = new Error('oops')

    const queryFn = () => sleep(10).then(() => Promise.reject(error))

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        retry: false,
        retryOnMount: false,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return <></>
    }

    queryClient.prefetchQuery({ queryKey: key, queryFn })
    await vi.advanceTimersByTimeAsync(10)

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(states).toHaveLength(1)

    expect(states[0]).toMatchObject({
      status: 'error',
      error,
    })
  })

  it('setQueryData - should respect updatedAt', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))
      return (
        <div>
          <div>data: {state.data}</div>
          <div>dataUpdatedAt: {state.dataUpdatedAt}</div>
          <button
            onClick={() => {
              queryClient.setQueryData(key, 'newData', {
                updatedAt: 100,
              })
            }}
          >
            setQueryData
          </button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /setQueryData/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('data: newData')).toBeInTheDocument()
    expect(rendered.getByText('dataUpdatedAt: 100')).toBeInTheDocument()
  })

  it('errorUpdateCount should increased on each fetch failure', async () => {
    const key = queryKey()
    const error = new Error('oops')

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => Promise.reject(error)),
        retry: false,
      }))
      return (
        <div>
          <button onClick={() => state.refetch()}>refetch</button>
          <span>data: {state.errorUpdateCount}</span>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    const fetchBtn = rendered.getByRole('button', { name: 'refetch' })

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    fireEvent.click(fetchBtn)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
    fireEvent.click(fetchBtn)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 3')).toBeInTheDocument()
  })

  it('should not fetch while restoring and refetch after restoring is complete', async () => {
    const key = queryKey()
    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))

    const [isRestoring, setIsRestoring] = createSignal(true)

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn,
      }))

      return (
        <div>
          <div data-testid="status">{query.status}</div>
          <div data-testid="fetchStatus">{query.fetchStatus}</div>
          <div data-testid="data">{query.data ?? 'undefined'}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <IsRestoringProvider value={isRestoring}>
          <Page />
        </IsRestoringProvider>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(queryFn).toHaveBeenCalledTimes(0)

    // Restoring complete: should refetch
    setIsRestoring(false)
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByTestId('status')).toHaveTextContent('success')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('data')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use provided custom queryClient', async () => {
    const key = queryKey()
    const queryFn = () => sleep(10).then(() => 'custom client')

    function Page() {
      const state = useQuery(
        () => ({ queryKey: key, queryFn }),
        () => queryClient,
      )
      return (
        <div>
          <h1>Status: {state.data}</h1>
        </div>
      )
    }

    const rendered = render(() => <Page />)

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Status: custom client')).toBeInTheDocument()
  })

  it('should refetch query when queryClient changes', async () => {
    const key = queryKey()

    const queryClient1 = new QueryClient()
    const queryClient2 = new QueryClient()

    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'data'))

    function Page(props: { client: () => QueryClient }) {
      const query = useQuery(
        () => ({
          queryKey: key,
          queryFn,
        }),
        props.client,
      )

      return <div>status: {query.status}</div>
    }

    const [client, setClient] = createSignal(queryClient1)

    const rendered = render(() => <Page client={client} />)

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('status: success')).toBeInTheDocument()
    expect(queryClient1.getQueryCache().find({ queryKey: key })).toBeDefined()
    expect(queryFn).toHaveBeenCalledTimes(1)

    setClient(queryClient2)
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('status: success')).toBeInTheDocument()
    expect(queryClient2.getQueryCache().find({ queryKey: key })).toBeDefined()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })
})
