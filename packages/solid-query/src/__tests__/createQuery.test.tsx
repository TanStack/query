import '@testing-library/jest-dom'
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
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { vi } from 'vitest'
import { reconcile } from 'solid-js/store'
import {
  QueryCache,
  QueryClientProvider,
  createQuery,
  keepPreviousData,
} from '..'
import {
  Blink,
  createQueryClient,
  mockOnlineManagerIsOnline,
  mockVisibilityState,
  queryKey,
  setActTimeout,
  sleep,
} from './utils'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  QueryFunction,
} from '..'
import type { Mock } from 'vitest'
import type { JSX } from 'solid-js'

describe('createQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct types', () => {
    const key = queryKey()

    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      // unspecified query function should default to unknown
      const noQueryFn = createQuery(() => ({ queryKey: key }))
      expectTypeOf<unknown>(noQueryFn.data)
      expectTypeOf<unknown>(noQueryFn.error)

      // it should infer the result type from the query function
      const fromQueryFn = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))
      expectTypeOf<string | undefined>(fromQueryFn.data)
      expectTypeOf<unknown>(fromQueryFn.error)

      // it should be possible to specify the result type
      const withResult = createQuery<string>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))
      expectTypeOf<string | undefined>(withResult.data)
      expectTypeOf<unknown | null>(withResult.error)

      // it should be possible to specify the error type
      const withError = createQuery<string, Error>(() => ({
        queryKey: key,
        queryFn: () => 'test',
      }))
      expectTypeOf<string | undefined>(withError.data)
      expectTypeOf<Error | null>(withError.error)

      // it should provide the result type in the configuration
      createQuery(() => ({
        queryKey: [key],
        queryFn: async () => true,
      }))

      // it should be possible to specify a union type as result type
      const unionTypeSync = createQuery(() => ({
        queryKey: key,
        queryFn: () => (Math.random() > 0.5 ? 'a' : 'b'),
      }))
      expectTypeOf<'a' | 'b' | undefined>(unionTypeSync.data)
      const unionTypeAsync = createQuery<'a' | 'b'>(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve(Math.random() > 0.5 ? 'a' : 'b'),
      }))
      expectTypeOf<'a' | 'b' | undefined>(unionTypeAsync.data)

      // should error when the query function result does not match with the specified type
      // @ts-expect-error
      createQuery<number>(() => ({ queryKey: key, queryFn: () => 'test' }))

      // it should infer the result type from a generic query function
      function queryFn<T = string>(): Promise<T> {
        return Promise.resolve({} as T)
      }

      const fromGenericQueryFn = createQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      }))
      expectTypeOf<string | undefined>(fromGenericQueryFn.data)
      expectTypeOf<unknown>(fromGenericQueryFn.error)

      const fromGenericOptionsQueryFn = createQuery(() => ({
        queryKey: key,
        queryFn: () => queryFn(),
      }))
      expectTypeOf<string | undefined>(fromGenericOptionsQueryFn.data)
      expectTypeOf<unknown>(fromGenericOptionsQueryFn.error)

      type MyData = number
      type MyQueryKey = readonly ['my-data', number]

      const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = async ({
        queryKey: [, n],
      }) => {
        return n + 42
      }

      createQuery(() => ({
        queryKey: ['my-data', 100] as const,
        queryFn: getMyDataArrayKey,
      }))

      const getMyDataStringKey: QueryFunction<MyData, ['1']> = async (
        context,
      ) => {
        expectTypeOf<['1']>(context.queryKey)
        return Number(context.queryKey[0]) + 42
      }

      createQuery(() => ({
        queryKey: ['1'] as ['1'],
        queryFn: getMyDataStringKey,
      }))

      // it should handle query-functions that return Promise<any>
      createQuery(() => ({
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
        options?: Omit<
          CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey' | 'queryFn' | 'initialData'
        >,
      ) =>
        createQuery(() => ({
          queryKey: qk,
          queryFn: () => fetcher(qk[1], 'token'),
          ...options,
        }))
      const test = useWrappedQuery([''], async () => '1')
      expectTypeOf<string | undefined>(test.data)

      // handles wrapped queries with custom fetcher passed directly to createQuery
      const useWrappedFuncStyleQuery = <
        TQueryKey extends [string, Record<string, unknown>?],
        TQueryFnData,
        TError,
        TData = TQueryFnData,
      >(
        qk: TQueryKey,
        fetcher: () => Promise<TQueryFnData>,
        options?: Omit<
          CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey' | 'queryFn' | 'initialData'
        >,
      ) => createQuery(() => ({ queryKey: qk, queryFn: fetcher, ...options }))
      const testFuncStyle = useWrappedFuncStyleQuery([''], async () => true)
      expectTypeOf<boolean | undefined>(testFuncStyle.data)
    }
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))

      return (
        <div>
          <h1>{state.data ?? 'default'}</h1>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    screen.getByText('default')

    await waitFor(() => screen.getByText('test'))
  })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page(): JSX.Element {
      const state = createQuery<string, Error>(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      if (state.isPending) {
        expectTypeOf<undefined>(state.data)
        expectTypeOf<null>(state.error)
      } else if (state.isLoadingError) {
        expectTypeOf<undefined>(state.data)
        expectTypeOf<Error>(state.error)
      } else {
        expectTypeOf<string>(state.data)
        expectTypeOf<Error | null>(state.error)
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('test'))

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
      refetch: expect.any(Function),
      status: 'pending',
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
      isPending: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
    })
  })

  it('should return the correct states for an unsuccessful query', async () => {
    const key = queryKey()

    const states: Array<CreateQueryResult<unknown, Error>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => Promise.reject(new Error('rejected')),
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Status: error'))

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
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
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
      refetch: expect.any(Function),
      status: 'pending',
      fetchStatus: 'fetching',
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
      refetch: expect.any(Function),
      status: 'error',
      fetchStatus: 'idle',
    })
  })

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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

    await sleep(10)
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
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          fetchCount++
          await sleep(10)
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

    await sleep(20)
    // first refetch only, second refetch is ignored
    expect(fetchCount).toBe(1)
  })

  it('should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          fetchCount++
          await sleep(10)
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

    await sleep(20)
    // first refetch (gets cancelled) and second refetch
    expect(fetchCount).toBe(2)
  })

  it('should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          fetchCount++
          await sleep(10)
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

    await sleep(20)
    // first refetch will not get cancelled, second one gets skipped
    expect(fetchCount).toBe(1)
  })

  it('should be able to watch a query without providing a query function', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    queryClient.setQueryDefaults(key, { queryFn: () => 'data' })

    function Page() {
      const state = createQuery<string>(() => ({ queryKey: key }))
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

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'data' })
  })

  it('should pick up a query when re-mounting with gcTime 0', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

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
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'data: ' + value
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('data: 1')

    fireEvent.click(screen.getByRole('button', { name: /toggle/i }))

    await screen.findByText('data: 2')

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
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
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

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should not fetch when refetchOnMount is false and data has been fetched already', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
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

    await sleep(10)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({ data: 'prefetched' })
  })

  it('should be able to select a part of the data with select', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => ({ name: 'test' }),
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

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should be able to select a part of the data with select in object syntax', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => ({ name: 'test' }),
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

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should be able to select a part of the data with select in object syntax', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => ({ name: 'test' }),
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

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should not re-render when it should only re-render only data change and the selected data did not change', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return { name: 'test' }
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: test'))

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should throw an error when a selector throws', async () => {
    const key = queryKey()
    const states: Array<{ status: string; data?: unknown; error?: Error }> = []
    const error = new Error('Select Error')

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => ({ name: 'test' }),
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

    await sleep(10)

    expect(states.length).toBe(2)

    expect(states[0]).toMatchObject({ status: 'pending', data: undefined })
    expect(states[1]).toMatchObject({ status: 'error', error })
  })

  it('should track properties and only re-render when a tracked property changes', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('test'))

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined })
    expect(states[1]).toMatchObject({ data: 'test' })
  })

  it('should always re-render if we are tracking props but not using any', async () => {
    const key = queryKey()
    let renderCount = 0
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
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

    await sleep(10)
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

    const states: Array<CreateQueryResult<typeof result1>> = []

    let count = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          count++
          return count === 1 ? result1 : result2
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: false'))
    await sleep(20)
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))
    await waitFor(() => screen.getByText('data: true'))

    await waitFor(() => expect(states.length).toBe(4))

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
    const results: Array<CreateQueryResult<string>> = []

    queryClient.setQueryData(key, 'set')

    function Page() {
      const result = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: set'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))
    await waitFor(() => screen.getByText('data: fetched'))

    await waitFor(() => expect(results.length).toBe(3))

    expect(results[0]).toMatchObject({ data: 'set', isFetching: false })
    expect(results[1]).toMatchObject({ data: 'set', isFetching: true })
    expect(results[2]).toMatchObject({ data: 'fetched', isFetching: false })
  })

  it('should update query stale state and refetch when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 1'))
    fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))
    await waitFor(() => screen.getByText('data: 2'))

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
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
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
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
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
    const states: Array<CreateQueryResult<number>> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = createQuery(() => ({
        queryKey: [key, count()],
        queryFn: async () => {
          await sleep(5)
          return count()
        },
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

    await sleep(50)

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
    const states: Array<CreateQueryResult<number>> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = createQuery(() => ({
        queryKey: [key, count()],
        queryFn: async () => {
          await sleep(10)
          return count()
        },
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

    await waitFor(() => expect(states.length).toBe(4))

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
    const states: Array<DefinedCreateQueryResult<number>> = []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = createQuery(() => ({
        queryKey: [key, count()],
        queryFn: async () => {
          await sleep(10)
          return count()
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() =>
      screen.getByText('data: 0, count: 0, isFetching: false'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'inc' }))

    await waitFor(() =>
      screen.getByText('data: 1, count: 1, isFetching: false'),
    )

    await waitFor(() => expect(states.length).toBe(4))

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
    const states: Array<CreateQueryResult<number>> = []

    queryClient.setQueryData([key, 10], 10)

    await sleep(10)

    function Page() {
      const [count, setCount] = createSignal(10)

      const state = createQuery(() => ({
        queryKey: [key, count()],
        queryFn: async () => {
          await sleep(10)
          return count()
        },
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

    await sleep(100)

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
    const states: Array<CreateQueryResult<number>> = []

    function FirstComponent() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 1
        },
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
      createQuery(() => ({
        queryKey: key,
        queryFn: () => 2,
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 1'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))

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
    const states1: Array<CreateQueryResult<string>> = []
    const states2: Array<CreateQueryResult<string>> = []

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => {
        await sleep(10)
        return 'prefetch'
      },
    })

    await sleep(20)

    function FirstComponent() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'one'
        },
        staleTime: 100,
      }))
      createRenderEffect(() => {
        states1.push({ ...state })
      })
      return null
    }

    function SecondComponent() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'two'
        },
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

    await sleep(200)

    expect(states1.length).toBe(4)
    expect(states2.length).toBe(3)

    expect(states1).toMatchObject([
      // First render
      {
        data: 'prefetch',
        isStale: false,
      },
      // Second createQuery started fetching
      {
        data: 'prefetch',
        isStale: false,
      },
      // Second createQuery data came in
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
      // Second createQuery data came in
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
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
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

    await sleep(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({ isStale: true })
    expect(states[1]).toMatchObject({ isStale: false })
    expect(states[2]).toMatchObject({ isStale: true })
  })

  it('should not re-render when it should only re-render on data changes and the data did not change', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(5)
          return 'test'
        },
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

    await sleep(30)

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
  it('should not override initial data in dependent queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = createQuery(() => ({
        queryKey: key1,
        queryFn: () => 'data',
        enabled: false,
        initialData: 'init',
      }))

      const second = createQuery(() => ({
        queryKey: key2,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    screen.getByText('First Data: init')
    screen.getByText('Second Data: init')
    screen.getByText('First Status: success')
    screen.getByText('Second Status: success')
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
      createQuery(() => ({ queryKey: key, queryFn: queryFn1 }))
      createQuery(() => ({ queryKey: key, queryFn: queryFn2 }))
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(queryCache.find({ queryKey: key })!.options.queryFn).toBe(queryFn1)
  })

  it('should batch re-renders', async () => {
    const key = queryKey()

    let renders = 0

    const queryFn = async () => {
      await sleep(15)
      return 'data'
    }

    function Page() {
      createQuery(() => ({ queryKey: key, queryFn }))
      createQuery(() => ({ queryKey: key, queryFn }))
      renders++
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(20)

    // Since components are rendered once
    // There wiil only be one pass
    expect(renders).toBe(1)
  })

  it('should render latest data even if react has discarded certain renders', async () => {
    const key = queryKey()

    function Page() {
      const [, setNewState] = createSignal('state')
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('new'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status pending, fetchStatus idle if enabled is false', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = createQuery(() => ({
        queryKey: key1,
        queryFn: () => 'data',
        enabled: false,
      }))
      const second = createQuery(() => ({
        queryKey: key2,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // use "act" to wait for state update and prevent console warning

    screen.getByText('First Status: pending, idle')
    await waitFor(() => screen.getByText('Second Status: pending, fetching'))
    await waitFor(() => screen.getByText('Second Status: success, idle'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "pending" state by default', async () => {
    const key = queryKey()

    function Page() {
      const { status } = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'test'
        },
      }))

      return <div>status: {status}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    screen.getByText('status: pending')
  })

  it('should not refetch query on focus when `enabled` is set to `false`', async () => {
    const key = queryKey()
    const queryFn = vi.fn<Array<unknown>, string>().mockReturnValue('data')

    function Page() {
      const { data = 'default' } = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('default'))

    window.dispatchEvent(new Event('visibilitychange'))

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => count++,
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

    await sleep(10)

    window.dispatchEvent(new Event('visibilitychange'))

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => count++,
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

    await sleep(10)

    window.dispatchEvent(new Event('visibilitychange'))

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => count++,
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

    await sleep(10)

    window.dispatchEvent(new Event('visibilitychange'))

    await sleep(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return count++
        },
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

    await sleep(20)

    window.dispatchEvent(new Event('visibilitychange'))

    await sleep(20)

    await waitFor(() => expect(states.length).toBe(4))
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })
  })

  it('should calculate focus behaviour for refetchOnWindowFocus depending on function', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return count++
        },
        staleTime: 0,
        retry: 0,
        refetchOnWindowFocus: (query) => (query.state.data || 0) < 1,
      }))
      createRenderEffect(() => {
        states.push({ ...state })
      })
      return <div>data: {state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await screen.findByText('data: 0')

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })

    window.dispatchEvent(new Event('visibilitychange'))

    await screen.findByText('data: 1')

    // refetch should happen
    expect(states.length).toBe(4)

    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })

    await sleep(20)

    // no more refetch now
    expect(states.length).toBe(4)
  })

  it('should refetch fresh query when refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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
    const states: Array<CreateQueryResult<string>> = []

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    await sleep(10)

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => {
          return Promise.reject(new Error('Error test jaylen'))
        },
        retry: false,
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>{state.error?.message}</h2>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error'))
    await waitFor(() => screen.getByText('Error test jaylen'))

    consoleMock.mockRestore()
  })

  it('should throw error if queryFn throws and throwOnError is in use', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => Promise.reject(new Error('Error test jaylen')),
        retry: false,
        throwOnError: true,
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>{state.error?.message}</h2>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))

    consoleMock.mockRestore()
  })

  it('should update with data if we observe no properties and throwOnError', async () => {
    const key = queryKey()

    let result: CreateQueryResult<string> | undefined

    function Page() {
      const query = createQuery(() => ({
        queryKey: key,
        queryFn: () => Promise.resolve('data'),
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

    await sleep(10)

    expect(result?.data).toBe('data')
  })

  it('should set status to error instead of throwing when error should not be thrown', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => Promise.reject(new Error('Local Error')),
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error'))
    await waitFor(() => screen.getByText('Local Error'))
  })

  it('should throw error instead of setting status when error should be thrown', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery<unknown, Error>(() => ({
        queryKey: key,
        queryFn: () => Promise.reject(new Error('Remote Error')),
        retry: false,
        throwOnError: (err) => err.message !== 'Local Error',
      }))

      return (
        <div>
          <h1>{state.status}</h1>
          <h2>{state.error?.message ?? ''}</h2>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          fallback={(error) => (
            <div>
              <div>error boundary</div>
              {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
              <div>{error?.message}</div>
            </div>
          )}
        >
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('Remote Error'))
  })

  it('should continue retries when observers unmount and remount while waiting for a retry (#3031)', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const result = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          count++
          await sleep(10)
          return Promise.reject(new Error('some error'))
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('failureCount: 1'))
    await waitFor(() => screen.getByText('failureReason: some error'))
    fireEvent.click(screen.getByRole('button', { name: /hide/i }))
    await waitFor(() => screen.getByRole('button', { name: /show/i }))
    fireEvent.click(screen.getByRole('button', { name: /show/i }))
    await waitFor(() => screen.getByText('error: some error'))

    expect(count).toBe(3)
  })

  it('should restart when observers unmount and remount while waiting for a retry when query was cancelled in between (#3031)', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const result = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          count++
          await sleep(10)
          return Promise.reject(new Error('some error'))
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('failureCount: 1'))
    await waitFor(() => screen.getByText('failureReason: some error'))
    fireEvent.click(screen.getByRole('button', { name: /hide/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => screen.getByRole('button', { name: /show/i }))
    fireEvent.click(screen.getByRole('button', { name: /show/i }))
    await waitFor(() => screen.getByText('error: some error'))

    // initial fetch (1), which will be cancelled, followed by new mount(2) + 2 retries = 4
    expect(count).toBe(4)
  })

  it('should always fetch if refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: data'))
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
    const states: Array<DefinedCreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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
    const states: Array<DefinedCreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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
    const states: Array<DefinedCreateQueryResult<string>> = []

    const oneSecondAgo = Date.now() - 1000

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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
    const states: Array<DefinedCreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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
    const states: Array<Partial<DefinedCreateQueryResult<{ count: number }>>> =
      []

    function Page() {
      const [count, setCount] = createSignal(0)
      const state = createQuery(() => ({
        queryKey: [key, count()],
        queryFn: () => ({ count: 10 }),
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

    await sleep(100)

    expect(states.length).toBe(2)
    // Initial
    expect(states[0]).toMatchObject({ data: { count: 0 } })
    // Set state
    expect(states[1]).toMatchObject({ data: { count: 1 } })
  })

  it('should retry specified number of times', async () => {
    const key = queryKey()

    const queryFn = vi.fn<Array<unknown>, unknown>()
    queryFn.mockImplementation(() => {
      return Promise.reject(new Error('Error test Barrett'))
    })

    function Page() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('pending'))
    await waitFor(() => screen.getByText('error'))

    // query should fail `retry + 1` times, since first time isn't a "retry"
    await waitFor(() => screen.getByText('Failed 2 times'))
    await waitFor(() => screen.getByText('Failed because Error test Barrett'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should not retry if retry function `false`', async () => {
    const key = queryKey()

    const queryFn = vi.fn<Array<unknown>, unknown>()

    queryFn.mockImplementationOnce(() => {
      return Promise.reject(new Error('Error test Tanner'))
    })

    queryFn.mockImplementation(() => {
      return Promise.reject(new Error('NoRetry'))
    })

    function Page() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('pending'))
    await waitFor(() => screen.getByText('error'))
    await waitFor(() => screen.getByText('Failed 2 times'))
    await waitFor(() => screen.getByText('Failed because NoRetry'))
    await waitFor(() => screen.getByText('NoRetry'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should extract retryDelay from error', async () => {
    const key = queryKey()

    type DelayError = { delay: number }

    const queryFn = vi.fn<Array<unknown>, unknown>()
    queryFn.mockImplementation(() => {
      return Promise.reject({ delay: 50 })
    })

    function Page() {
      const state = createQuery<unknown, DelayError>(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(10)

    expect(queryFn).toHaveBeenCalledTimes(1)

    await waitFor(() => screen.getByText('Failed because DelayError: 50ms'))
    await waitFor(() => screen.getByText('Failed 2 times'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0

    function Page() {
      const query = createQuery<unknown, string>(() => ({
        queryKey: key,
        queryFn: () => {
          count++
          return Promise.reject<unknown>(`fetching error ${count}`)
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // The query should display the first error result
    await waitFor(() => screen.getByText('failureCount 1'))
    await waitFor(() => screen.getByText('failureReason fetching error 1'))
    await waitFor(() => screen.getByText('status pending'))
    await waitFor(() => screen.getByText('error null'))

    // Check if the query really paused
    await sleep(10)
    await waitFor(() => screen.getByText('failureCount 1'))
    await waitFor(() => screen.getByText('failureReason fetching error 1'))

    visibilityMock.mockRestore()
    window.dispatchEvent(new Event('visibilitychange'))

    // Wait for the final result
    await waitFor(() => screen.getByText('failureCount 4'))
    await waitFor(() => screen.getByText('failureReason fetching error 4'))
    await waitFor(() => screen.getByText('status error'))
    await waitFor(() => screen.getByText('error fetching error 4'))

    // Check if the query really stopped
    await sleep(10)
    await waitFor(() => screen.getByText('failureCount 4'))
    await waitFor(() => screen.getByText('failureReason fetching error 4'))
  })

  it('should fetch on mount when a query was already created with setQueryData', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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
    const states: Array<CreateQueryResult<string>> = []

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    // set data in cache to check if the hook query fn is actually called
    queryClient.setQueryData(key, 'prefetched')

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'data'
        },
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

    await waitFor(() => expect(states.length).toBe(2))

    // reset visibilityState to original value
    visibilityMock.mockRestore()
    window.dispatchEvent(new Event('visibilitychange'))

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
    const states: Array<CreateQueryResult<string>> = []

    const queryFn = vi.fn<Array<unknown>, string>()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = vi.fn<Array<unknown>, string>()
    prefetchQueryFn.mockImplementation(() => 'not yet...')

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: prefetchQueryFn,
      staleTime: 10,
    })

    await sleep(11)

    function Page() {
      const state = createQuery(() => ({ queryKey: key, queryFn }))
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

    await waitFor(() => expect(states.length).toBe(2))

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not refetch if not stale after a prefetch', async () => {
    const key = queryKey()

    const queryFn = vi.fn<Array<unknown>, string>()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = vi.fn<Array<unknown>, Promise<string>>()
    prefetchQueryFn.mockImplementation(async () => {
      await sleep(10)
      return 'not yet...'
    })

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: prefetchQueryFn,
      staleTime: 1000,
    })

    await sleep(0)

    function Page() {
      createQuery(() => ({ queryKey: key, queryFn, staleTime: 1000 }))
      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(0)

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  // See https://github.com/tannerlinsley/react-query/issues/190
  it('should reset failureCount and failureReason on successful fetch', async () => {
    const key = queryKey()

    function Page() {
      let counter = 0

      const query = createQuery<unknown, Error>(() => ({
        queryKey: key,
        queryFn: async () => {
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('failureCount 2'))
    await waitFor(() => screen.getByText('failureReason error'))
    await waitFor(() => screen.getByText('failureCount 0'))
    await waitFor(() => screen.getByText('failureReason null'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/199
  it('should use prefetched data for dependent query', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const [isPrefetched, setPrefetched] = createSignal(false)

      const query = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          count++
          await sleep(10)
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('isPrefetched'))

    fireEvent.click(screen.getByText('setKey'))
    await waitFor(() => screen.getByText('data: prefetched data'))
    await waitFor(() => screen.getByText('data: 1'))
    expect(count).toBe(1)
  })

  it('should support dependent queries via the enable config option', async () => {
    const key = queryKey()

    function Page() {
      const [shouldFetch, setShouldFetch] = createSignal(false)

      const query = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
        enabled: shouldFetch(),
      }))

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    screen.getByText('FetchStatus: idle')
    screen.getByText('Data: no data')

    fireEvent.click(screen.getByText('fetch'))

    await waitFor(() => screen.getByText('FetchStatus: fetching'))
    await waitFor(() => [
      screen.getByText('FetchStatus: idle'),
      screen.getByText('Data: data'),
    ])
  })

  it('should mark query as fetching, when using initialData', async () => {
    const key = queryKey()
    const results: Array<DefinedCreateQueryResult<string>> = []

    function Page() {
      const result = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'serverData'
        },
        initialData: 'initialData',
      }))

      createRenderEffect(() => {
        results.push({ ...result })
      })

      return <div>data: {result.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: initialData'))
    await waitFor(() => screen.getByText('data: serverData'))

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 'initialData', isFetching: true })
    expect(results[1]).toMatchObject({ data: 'serverData', isFetching: false })
  })

  it('should initialize state properly, when initialData is falsy', async () => {
    const key = queryKey()
    const results: Array<DefinedCreateQueryResult<number>> = []

    function Page() {
      const result = createQuery(() => ({
        queryKey: key,
        queryFn: () => 1,
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

    await sleep(10)

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 0, isFetching: true })
    expect(results[1]).toMatchObject({ data: 1, isFetching: false })
  })

  // // See https://github.com/tannerlinsley/react-query/issues/214
  it('data should persist when enabled is changed to false', async () => {
    const key = queryKey()
    const results: Array<DefinedCreateQueryResult<string>> = []

    function Page() {
      const [shouldFetch, setShouldFetch] = createSignal(true)

      const result = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'fetched data',
        enabled: shouldFetch(),
        initialData: shouldFetch() ? 'initial' : 'initial falsy',
      }))

      createRenderEffect(() => {
        results.push({ ...result })
      })

      createEffect(() => {
        setActTimeout(() => {
          setShouldFetch(false)
        }, 5)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(50)
    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ data: 'initial', isStale: true })
    expect(results[1]).toMatchObject({ data: 'fetched data', isStale: true })
    // Wont render 3rd time, because data is still the same
  })

  it('it should support enabled:false in query object syntax', async () => {
    const key = queryKey()
    const queryFn = vi.fn<Array<unknown>, string>()
    queryFn.mockImplementation(() => 'data')

    function Page() {
      const { fetchStatus } = createQuery(() => ({
        queryKey: key,
        queryFn,
        enabled: false,
      }))

      return <div>fetchStatus: {fetchStatus}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(queryFn).not.toHaveBeenCalled()
    expect(queryCache.find({ queryKey: key })).not.toBeUndefined()
    screen.getByText('fetchStatus: idle')
  })

  // See https://github.com/tannerlinsley/react-query/issues/360
  it('should init to status:pending, fetchStatus:idle when enabled is false', async () => {
    const key = queryKey()

    function Page() {
      const query = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('status: pending, idle'))
  })

  it('should not schedule garbage collection, if gcTimeout is set to `Infinity`', async () => {
    const key = queryKey()

    function Page() {
      const query = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'fetched data',
        gcTime: Infinity,
      }))
      return <div>{query.data}</div>
    }

    const result = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('fetched data'))
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    result.unmount()

    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  it('should schedule garbage collection, if gcTimeout is not set to `Infinity`', async () => {
    const key = queryKey()

    function Page() {
      const query = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'fetched data',
        gcTime: 1000 * 60 * 10, //10 Minutes
      }))
      return <div>{query.data}</div>
    }

    const result = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('fetched data'))
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    result.unmount()

    expect(setTimeoutSpy).toHaveBeenLastCalledWith(
      expect.any(Function),
      1000 * 60 * 10,
    )
  })

  it('should not cause memo churn when data does not change', async () => {
    const key = queryKey()
    const queryFn = vi.fn<Array<unknown>, string>().mockReturnValue('data')
    const memoFn = vi.fn()

    function Page() {
      const result = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return (
            queryFn() || {
              data: {
                nested: true,
              },
            }
          )
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('status pending'))
    await waitFor(() => screen.getByText('status success'))
    fireEvent.click(screen.getByText('refetch'))
    await waitFor(() => screen.getByText('isFetching true'))
    await waitFor(() => screen.getByText('isFetching false'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(memoFn).toHaveBeenCalledTimes(2)
  })

  it('should update data upon interval changes', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const [int, setInt] = createSignal(200)
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => count++,
        refetchInterval: int(),
      }))

      createEffect(() => {
        if (state.data === 2) {
          setInt(0)
        }
      })

      return <div>count: {state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    // mount
    await waitFor(() => screen.getByText('count: 0'))
    await waitFor(() => screen.getByText('count: 1'))
    await waitFor(() => screen.getByText('count: 2'))
  })

  it('should refetch in an interval depending on function result', async () => {
    const key = queryKey()
    let count = 0
    const states: Array<CreateQueryResult<number>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return count++
        },
        refetchInterval: (data = 0) => (data < 2 ? 10 : false),
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('count: 2'))

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
    const states: Array<CreateQueryResult<number>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 1,
        refetchInterval: 0,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return <div>count: {state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('count: 1'))

    await sleep(10) //extra sleep to make sure we're not re-fetching

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
      const result = createQuery(() => ({
        queryKey: [''],
        queryFn: (ctx) => ctx.queryKey,
      }))
      return <>{JSON.stringify(result.data)}</>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText(''))
  })

  it('should accept an object as query key', async () => {
    function Page() {
      const result = createQuery(() => ({
        queryKey: [{ a: 'a' }],
        queryFn: (ctx) => ctx.queryKey,
      }))
      return <>{JSON.stringify(result.data)}</>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('[{"a":"a"}]'))
  })

  it('should refetch if any query instance becomes enabled', async () => {
    const key = queryKey()

    const queryFn = vi.fn<Array<unknown>, string>().mockReturnValue('data')

    function Disabled() {
      createQuery(() => ({ queryKey: key, queryFn, enabled: false }))
      return null
    }

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const result = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    expect(queryFn).toHaveBeenCalledTimes(0)
    fireEvent.click(screen.getByText('enable'))
    await waitFor(() => screen.getByText('data'))
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use placeholder data while the query loads', async () => {
    const key1 = queryKey()

    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: data'))

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

    const states: Array<{ state: CreateQueryResult<string>; count: number }> =
      []

    function Page() {
      const [count, setCount] = createSignal(0)

      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: () => 'data',
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: data'))

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

    const states: Array<CreateQueryResult<string>> = []

    function Page() {
      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: () => 1,
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: 2'))

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

    const states: Array<CreateQueryResult<string>> = []
    let placeholderFunctionRunCount = 0

    function Page() {
      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: () => 1,
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: 2'))

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

      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 0
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: selected 101')) // 99 + 2

    await waitFor(() => screen.getByText('Data: selected 2')) // 0 + 2

    fireEvent.click(screen.getByRole('button', { name: /inc/i }))

    await waitFor(() => screen.getByText('Data: selected 3')) // 0 + 3

    fireEvent.click(screen.getByRole('button', { name: /forceUpdate/i }))

    await waitFor(() => screen.getByText('forceValue: 2'))
    // data should still be 3 after an independent re-render
    await waitFor(() => screen.getByText('Data: selected 3'))
  })

  it('select should structurally share data', async () => {
    const key1 = queryKey()
    const states: Array<Array<number>> = []

    function Page() {
      const [forceValue, setForceValue] = createSignal(1)

      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return [1, 2]
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: [2,3]'))
    expect(states).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /forceUpdate/i }))

    await waitFor(() => screen.getByText('forceValue: 2'))
    await waitFor(() => screen.getByText('Data: [2,3]'))

    // effect should not be triggered again due to structural sharing
    expect(states).toHaveLength(1)
  })

  it('The reconcile fn callback should correctly maintain referential equality', async () => {
    const key1 = queryKey()
    const states: Array<Array<number>> = []

    function Page() {
      const [forceValue, setForceValue] = createSignal(1)

      const state = createQuery(() => ({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return [1, 2]
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    await waitFor(() => screen.getByText('Data: [2,3]'))
    expect(states).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /forceUpdate/i }))

    await waitFor(() => screen.getByText('forceValue: 2'))
    await waitFor(() => screen.getByText('Data: [2,3]'))

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
      const state = createQuery(() => ({ queryKey: key, queryFn }))
      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Blink duration={5}>
          <Page />
        </Blink>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('off'))

    expect(cancelFn).toHaveBeenCalled()
  })

  it('should cancel the query if the signal was consumed and there are no more subscriptions', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

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
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Blink duration={5}>
          <Page limit={0} />
          <Page limit={1} />
          <Page limit={2} />
          <Page limit={3} />
        </Blink>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('off'))
    await sleep(20)

    await waitFor(() => expect(states).toHaveLength(4))

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
    const states: Array<CreateQueryResult<string>> = []

    const queryFn = async () => {
      await sleep(50)
      return 'OK'
    }

    function Page() {
      const [id, setId] = createSignal(1)
      const [hasChanged, setHasChanged] = createSignal(false)

      const state = createQuery(() => ({ queryKey: [key, id()], queryFn }))

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

    await sleep(100)
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
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 1'))
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    await waitFor(() => expect(states.length).toBe(4))

    await waitFor(() => screen.getByText('data: 2'))

    expect(count).toBe(2)

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
    const states: Array<CreateQueryResult<number>> = []
    let count = 0

    function Page() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: null'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))

    await waitFor(() => screen.getByText('data: 1'))
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    await waitFor(() => screen.getByText('data: null'))
    await waitFor(() => expect(states.length).toBe(4))

    expect(count).toBe(1)

    expect(states[0]).toMatchObject({
      isPending: true,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      isPending: true,
      isFetching: true,
      isSuccess: false,
      isStale: true,
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
      isStale: true,
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
      createQuery(() => ({
        queryKey: key,
        queryFn: () => 'test',
        queryKeyHashFn,
      }))

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(10)
    expect(hashes).toBe(1)
  })

  it('should refetch when changed enabled to true in error state', async () => {
    const queryFn = vi.fn<Array<unknown>, unknown>()
    queryFn.mockImplementation(async () => {
      await sleep(10)
      return Promise.reject(new Error('Suspense Error Bingo'))
    })

    function Page(props: { enabled: boolean }) {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // initial state check
    screen.getByText('status: pending')

    // // render error state component
    await waitFor(() => screen.getByText('error'))
    expect(queryFn).toBeCalledTimes(1)

    // change to enabled to false
    fireEvent.click(screen.getByLabelText('retry'))
    await waitFor(() => screen.getByText('error'))
    expect(queryFn).toBeCalledTimes(1)

    // // change to enabled to true
    fireEvent.click(screen.getByLabelText('retry'))
    expect(queryFn).toBeCalledTimes(2)
  })

  it('should refetch when query key changed when previous status is error', async () => {
    function Page(props: { id: number }) {
      const state = createQuery(() => ({
        queryKey: [props.id],
        queryFn: async () => {
          await sleep(10)
          if (props.id % 2 === 1) {
            return Promise.reject(new Error('Error'))
          } else {
            return 'data'
          }
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // initial state check
    screen.getByText('status: pending')

    // render error state component
    await waitFor(() => screen.getByText('error'))

    // change to unmount query
    fireEvent.click(screen.getByLabelText('change'))
    await waitFor(() => screen.getByText('rendered'))

    // change to mount new query
    fireEvent.click(screen.getByLabelText('change'))
    await waitFor(() => screen.getByText('error'))
  })

  it('should refetch when query key changed when switching between erroneous queries', async () => {
    function Page(props: { id: boolean }) {
      const state = createQuery(() => ({
        queryKey: [props.id],
        queryFn: async () => {
          await sleep(10)
          return Promise.reject<unknown>(new Error('Error'))
        },
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // initial state check
    screen.getByText('status: fetching')

    // render error state component
    await waitFor(() => screen.getByText('error'))

    // change to mount second query
    fireEvent.click(screen.getByLabelText('change'))
    await waitFor(() => screen.getByText('status: fetching'))
    await waitFor(() => screen.getByText('error'))

    // change to mount first query again
    fireEvent.click(screen.getByLabelText('change'))
    await waitFor(() => screen.getByText('status: fetching'))
    await waitFor(() => screen.getByText('error'))
  })

  it('should have no error in pending state when refetching after error occurred', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<number>> = []
    const error = new Error('oops')

    let count = 0

    function Page() {
      const state = createQuery(() => ({
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error'))

    fireEvent.click(screen.getByRole('button', { name: 'refetch' }))
    await waitFor(() => screen.getByText('data: 5'))

    await waitFor(() => expect(states.length).toBe(4))

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
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            return 'data'
          },
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      await waitFor(() => screen.getByText('status: pending, isPaused: true'))

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await waitFor(() => screen.getByText('status: success, isPaused: false'))
      await waitFor(() => {
        expect(screen.getByText('data: data')).toBeInTheDocument()
      })

      expect(states).toEqual(['paused', 'fetching', 'idle'])
    })

    it('online queries should not refetch if you are offline', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery<unknown, string, string>(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('data: data1'))

      const onlineMock = mockOnlineManagerIsOnline(false)
      window.dispatchEvent(new Event('offline'))
      fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))

      await waitFor(() =>
        screen.getByText(
          'status: success, fetchStatus: paused, failureCount: 0',
        ),
      )
      await waitFor(() => screen.getByText('failureReason: null'))

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        screen.getByText(
          'status: success, fetchStatus: fetching, failureCount: 0',
        ),
      )
      await waitFor(() => screen.getByText('failureReason: null'))
      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: idle, failureCount: 0'),
      )
      await waitFor(() => screen.getByText('failureReason: null'))

      await waitFor(() => {
        expect(screen.getByText('data: data2')).toBeInTheDocument()
      })
    })

    it('online queries should not refetch if you are offline and refocus', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('data: data1'))

      const onlineMock = mockOnlineManagerIsOnline(false)
      fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: paused'),
      )

      window.dispatchEvent(new Event('visibilitychange'))
      await sleep(15)

      await waitFor(() =>
        expect(screen.queryByText('data: data2')).not.toBeInTheDocument(),
      )
      expect(count).toBe(1)
      onlineMock.mockRestore()
    })

    it('online queries should not refetch while already paused', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() =>
        screen.getByText('status: pending, fetchStatus: paused'),
      )

      fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))

      await sleep(15)

      // invalidation should not trigger a refetch
      await waitFor(() =>
        screen.getByText('status: pending, fetchStatus: paused'),
      )

      expect(count).toBe(0)
      onlineMock.mockRestore()
    })

    it('online queries should not refetch while already paused if data is in the cache', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: paused'),
      )
      await waitFor(() => {
        expect(screen.getByText('data: initial')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))

      await sleep(15)

      // invalidation should not trigger a refetch
      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: paused'),
      )

      expect(count).toBe(0)
      onlineMock.mockRestore()
    })

    it('online queries should not get stuck in fetching state when pausing multiple times', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: paused'),
      )
      await waitFor(() => {
        expect(screen.getByText('data: initial')).toBeInTheDocument()
      })

      // triggers one pause
      fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))

      await sleep(15)

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: paused'),
      )

      // triggers a second pause
      window.dispatchEvent(new Event('visibilitychange'))

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: idle'),
      )
      await waitFor(() => {
        expect(screen.getByText('data: data1')).toBeInTheDocument()
      })

      expect(count).toBe(1)
    })

    it('online queries should pause retries if you are offline', async () => {
      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery<unknown, Error>(() => ({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() =>
        screen.getByText(
          'status: pending, fetchStatus: fetching, failureCount: 1',
        ),
      )
      await waitFor(() => screen.getByText('failureReason: failed1'))

      window.dispatchEvent(new Event('offline'))
      const onlineMock = mockOnlineManagerIsOnline(false)

      await sleep(20)

      await waitFor(() =>
        screen.getByText(
          'status: pending, fetchStatus: paused, failureCount: 1',
        ),
      )
      await waitFor(() => screen.getByText('failureReason: failed1'))

      expect(count).toBe(1)

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        screen.getByText('status: error, fetchStatus: idle, failureCount: 3'),
      )
      await waitFor(() => screen.getByText('failureReason: failed3'))

      expect(count).toBe(3)
    })

    it('online queries should fetch if paused and we go online even if already unmounted (because not cancelled)', async () => {
      const key = queryKey()
      let count = 0

      function Component() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      await waitFor(() =>
        screen.getByText('status: pending, fetchStatus: paused'),
      )

      fireEvent.click(screen.getByRole('button', { name: /hide/i }))

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await sleep(15)

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
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() =>
        screen.getByText('status: pending, fetchStatus: paused'),
      )

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() =>
        screen.getByText('status: pending, fetchStatus: idle'),
      )

      expect(count).toBe(0)

      onlineMock.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))

      await sleep(15)

      await waitFor(() =>
        screen.getByText('status: pending, fetchStatus: idle'),
      )

      expect(count).toBe(0)

      onlineMock.mockRestore()
    })

    it('online queries should not fetch if paused and we go online if already unmounted when signal consumed', async () => {
      const key = queryKey()
      let count = 0

      function Component() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async ({ signal: _signal }) => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: idle'),
      )

      const onlineMock = mockOnlineManagerIsOnline(false)

      fireEvent.click(screen.getByRole('button', { name: /invalidate/i }))

      await waitFor(() =>
        screen.getByText('status: success, fetchStatus: paused'),
      )

      fireEvent.click(screen.getByRole('button', { name: /hide/i }))

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
      const onlineMock = mockOnlineManagerIsOnline(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async () => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('status: success, isPaused: false'))

      await waitFor(() => {
        expect(screen.getByText('data: data 1')).toBeInTheDocument()
      })

      onlineMock.mockRestore()
    })

    it('always queries should not pause retries', async () => {
      const onlineMock = mockOnlineManagerIsOnline(false)

      const key = queryKey()
      let count = 0

      function Page() {
        const state = createQuery(() => ({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('status: error, isPaused: false'))

      await waitFor(() => {
        expect(screen.getByText('error: error 2')).toBeInTheDocument()
      })

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
        const state = createQuery<unknown, Error>(() => ({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            count++
            await sleep(10)
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

      render(() => (
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>
      ))

      window.dispatchEvent(new Event('offline'))

      await waitFor(() =>
        screen.getByText(
          'status: pending, fetchStatus: paused, failureCount: 1',
        ),
      )
      await waitFor(() => screen.getByText('failureReason: failed1'))

      expect(count).toBe(1)

      onlineMock.mockRestore()
      window.dispatchEvent(new Event('online'))

      await waitFor(() =>
        screen.getByText('status: error, fetchStatus: idle, failureCount: 3'),
      )
      await waitFor(() => screen.getByText('failureReason: failed3'))

      expect(count).toBe(3)
    })
  })

  it('it should have status=error on mount when a query has failed', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<unknown>> = []
    const error = new Error('oops')

    const queryFn = async (): Promise<unknown> => {
      throw error
    }

    function Page() {
      const state = createQuery(() => ({
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

    await queryClient.prefetchQuery({ queryKey: key, queryFn })
    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => expect(states).toHaveLength(1))

    expect(states[0]).toMatchObject({
      status: 'error',
      error,
    })
  })

  it('setQueryData - should respect updatedAt', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: () => 'data',
      }))
      return (
        <div>
          <div>data: {state.data}</div>
          <div>dataUpdatedAt: {state.dataUpdatedAt}</div>
          <button
            onClick={() =>
              queryClient.setQueryData(key, 'newData', {
                updatedAt: 100,
              })
            }
          >
            setQueryData
          </button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: data'))
    fireEvent.click(screen.getByRole('button', { name: /setQueryData/i }))
    await waitFor(() => screen.getByText('data: newData'))
    await waitFor(() => {
      expect(screen.getByText('dataUpdatedAt: 100')).toBeInTheDocument()
    })
  })

  it('errorUpdateCount should increased on each fetch failure', async () => {
    const key = queryKey()
    const error = new Error('oops')

    function Page() {
      const state = createQuery(() => ({
        queryKey: key,
        queryFn: async (): Promise<unknown> => {
          throw error
        },
        retry: false,
      }))
      return (
        <div>
          <button onClick={() => state.refetch()}>refetch</button>
          <span>data: {state.errorUpdateCount}</span>
        </div>
      )
    }
    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    const fetchBtn = screen.getByRole('button', { name: 'refetch' })
    await waitFor(() => screen.getByText('data: 1'))
    fireEvent.click(fetchBtn)
    await waitFor(() => screen.getByText('data: 2'))
    fireEvent.click(fetchBtn)
    await waitFor(() => screen.getByText('data: 3'))
  })

  it('should use provided custom queryClient', async () => {
    const key = queryKey()
    const queryFn = () => {
      return Promise.resolve('custom client')
    }

    function Page() {
      const state = createQuery(
        () => ({ queryKey: key, queryFn }),
        () => queryClient,
      )
      return (
        <div>
          <h1>Status: {state.data}</h1>
        </div>
      )
    }

    render(() => <Page />)

    await waitFor(() => screen.getByText('Status: custom client'))
  })
})
