import { render, act, waitFor, fireEvent } from '@testing-library/react'
import * as React from 'react'

import {
  sleep,
  expectType,
  queryKey,
  mockVisibilityState,
  mockConsoleError,
  waitForMs,
} from './utils'
import { useQuery, queryCache, QueryResult } from '../..'

describe('useQuery', () => {
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

      // it should be possible to specify the query function arguments
      useQuery<void, string, [string]>(key, arg1 => {
        expectType<string>(arg1)
      })

      // the query function arguments should default to unknown
      useQuery(key, arg1 => {
        expectType<unknown>(arg1)
      })

      // the query function arguments should default to any if other generics are provided
      useQuery<void>(key, arg1 => {
        expectType<any>(arg1)
        arg1.someMethod()
      })

      // it should be possible to specify the query function argument types
      useQuery(key, (arg1: string) => {
        expectType<string>(arg1)
      })

      // it should be possible to specify the query function argument types when generics are provided
      useQuery<void>(key, (arg1: string) => {
        expectType<string>(arg1)
      })

      // it should provide the result type in the configuration
      useQuery([key], async () => true, {
        onSuccess: data => expectType<boolean>(data),
        onSettled: data => expectType<boolean | undefined>(data),
      })

      // should error when the query function result does not match with the specified type
      // @ts-expect-error
      useQuery<number>(key, () => 'test')
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

    const rendered = render(<Page />)

    rendered.getByText('default')

    await waitFor(() => rendered.getByText('test'))
  })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'test')

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
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: true,
      isLoading: true,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[1]).toEqual({
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: 'test',
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: false,
      isLoading: false,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: true,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'success',
      updatedAt: expect.any(Number),
    })
  })

  it('should return the correct states for an unsuccessful query', async () => {
    const key = queryKey()
    const consoleMock = mockConsoleError()

    const states: QueryResult<undefined, string>[] = []

    function Page() {
      const state = useQuery<undefined, string, [string]>(
        key,
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
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: true,
      isLoading: true,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[1]).toEqual({
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 1,
      fetchMore: expect.any(Function),
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: true,
      isLoading: true,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[2]).toEqual({
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: undefined,
      error: 'rejected',
      failureCount: 2,
      fetchMore: expect.any(Function),
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: true,
      isLoading: false,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'error',
      updatedAt: expect.any(Number),
    })

    consoleMock.mockRestore()
  })

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    await queryCache.prefetchQuery(key, () => 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data')
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(3))

    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isFetched: true,
      isFetchedAfterMount: false,
    })
    expect(states[1]).toMatchObject({
      data: 'prefetched',
      isFetched: true,
      isFetchedAfterMount: false,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isFetched: true,
      isFetchedAfterMount: true,
    })
  })

  it('should call onSuccess after a query has been fetched', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []
    const onSuccess = jest.fn()

    function Page() {
      const state = useQuery(key, () => 'data', { onSuccess })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(2))
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  })

  it('should call onError after a query has been fetched with an error', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []
    const onError = jest.fn()
    const consoleMock = mockConsoleError()

    function Page() {
      const state = useQuery(key, () => Promise.reject('error'), {
        retry: false,
        onError,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(2))
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith('error')
    consoleMock.mockRestore()
  })

  it('should call onSettled after a query has been fetched', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []
    const onSettled = jest.fn()

    function Page() {
      const state = useQuery(key, () => 'data', { onSettled })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(2))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith('data', null)
  })

  it('should call onSettled after a query has been fetched with an error', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []
    const onSettled = jest.fn()
    const consoleMock = mockConsoleError()

    function Page() {
      const state = useQuery(key, () => Promise.reject('error'), {
        retry: false,
        onSettled,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(2))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(undefined, 'error')
    consoleMock.mockRestore()
  })

  // https://github.com/tannerlinsley/react-query/issues/896
  it('should fetch data in Strict mode when refetchOnMount is false', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          refetchOnMount: false,
        }
      )
      states.push(state)
      return null
    }

    render(
      <React.StrictMode>
        <Page />
      </React.StrictMode>
    )

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      data: undefined,
    })
    expect(states[1]).toMatchObject({
      data: undefined,
    })
    expect(states[2]).toMatchObject({
      data: 'test',
    })
    expect(states[3]).toMatchObject({
      data: 'test',
    })
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

    const states: QueryResult<typeof result1>[] = []

    let count = 0

    function Page() {
      const state = useQuery(key, () => {
        count++
        return count === 1 ? result1 : result2
      })

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        setTimeout(() => {
          refetch()
        }, 10)
      }, [refetch])
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(4))

    const todos = states[2].data!
    const todo1 = todos[0]
    const todo2 = todos[1]

    const newTodos = states[3].data!
    const newTodo1 = newTodos[0]
    const newTodo2 = newTodos[1]

    expect(todos).toEqual(result1)
    expect(newTodos).toEqual(result2)
    expect(newTodos).not.toBe(todos)
    expect(newTodo1).toBe(todo1)
    expect(newTodo2).not.toBe(todo2)

    return null
  })

  it('should update query stale state when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', { staleTime: Infinity })

      states.push(state)

      React.useEffect(() => {
        setTimeout(() => {
          queryCache.invalidateQueries(key, {
            refetchActive: false,
            refetchInactive: false,
          })
        }, 10)
      }, [])

      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isFetching: false,
      isSuccess: true,
      isStale: false,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isFetching: false,
      isSuccess: true,
      isStale: true,
    })
  })

  it('should update disabled query when updated with invalidateQueries', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { enabled: false }
      )

      states.push(state)

      React.useEffect(() => {
        setTimeout(() => {
          queryCache.invalidateQueries(key, { refetchInactive: true })
        }, 20)
      }, [])

      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
    expect(states[1]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isStale: true,
    })
    expect(states[2]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isStale: true,
    })
  })

  it('should not refetch disabled query when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          count++
          return count
        },
        { enabled: false }
      )

      states.push(state)

      React.useEffect(() => {
        setTimeout(() => {
          queryCache.invalidateQueries(key)
        }, 20)
      }, [])

      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: false,
      isSuccess: false,
      isStale: true,
    })
  })

  it('should keep the previous data when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { keepPreviousData: true }
      )

      states.push(state)

      React.useEffect(() => {
        setTimeout(() => {
          setCount(1)
        }, 20)
      }, [])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isSuccess: false,
      isPreviousData: false,
    })
    expect(states[1]).toMatchObject({
      data: 0,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
    expect(states[2]).toMatchObject({
      data: 0,
      isFetching: true,
      isSuccess: true,
      isPreviousData: true,
    })
    expect(states[3]).toMatchObject({
      data: 1,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should keep the previous data on disabled query when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { enabled: false, keepPreviousData: true }
      )

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        refetch()

        setTimeout(() => {
          setCount(1)
        }, 20)

        setTimeout(() => {
          refetch()
        }, 30)
      }, [refetch])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(6))

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
    // Switched query key
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
    const states: QueryResult<number>[] = []

    queryCache.setQueryData([key, 10], 10)

    await sleep(10)

    function Page() {
      const [count, setCount] = React.useState(10)

      const state = useQuery(
        [key, count],
        async () => {
          await sleep(10)
          return count
        },
        { enabled: false, keepPreviousData: true }
      )

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        setTimeout(() => {
          setCount(11)
        }, 20)
        setTimeout(() => {
          setCount(12)
        }, 30)
        setTimeout(() => {
          refetch()
        }, 40)
      }, [refetch])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(5))

    // Disabled query
    expect(states[0]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPreviousData: false,
    })
    // Switched query key
    expect(states[1]).toMatchObject({
      data: 10,
      isFetching: false,
      isSuccess: true,
      isPreviousData: true,
    })
    // Switched query key
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
    const states: QueryResult<number>[] = []

    function FirstComponent() {
      const state = useQuery(key, () => 1)
      const refetch = state.refetch

      states.push(state)

      React.useEffect(() => {
        setTimeout(() => {
          refetch()
        }, 10)
      }, [refetch])

      return null
    }

    function SecondComponent() {
      useQuery(key, () => 2)
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

    render(<Page />)

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
    const states1: QueryResult<string>[] = []
    const states2: QueryResult<string>[] = []

    await queryCache.prefetchQuery(key, () => 'prefetch')

    await sleep(20)

    function FirstComponent() {
      const state = useQuery(key, () => 'one', {
        staleTime: 100,
      })
      states1.push(state)
      return null
    }

    function SecondComponent() {
      const state = useQuery(key, () => 'two', {
        staleTime: 10,
      })
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

    render(<Page />)

    await waitFor(() =>
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
    )

    await waitFor(() =>
      expect(states2).toMatchObject([
        // First render, data is stale
        {
          data: 'prefetch',
          isStale: true,
        },
        // Second useQuery started fetching
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
    )
  })

  it('should re-render when a query becomes stale', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'test', {
        staleTime: 50,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states[0]).toMatchObject({ isStale: true })
    expect(states[1]).toMatchObject({ isStale: false })
    expect(states[2]).toMatchObject({ isStale: true })
  })

  it('should notify query cache when a query becomes stale', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []
    const fn = jest.fn()

    const unsubscribe = queryCache.subscribe(fn)

    function Page() {
      const state = useQuery(key, () => 'test', {
        staleTime: 10,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(20)
    unsubscribe()
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should not re-render when a query status changes and notifyOnStatusChange is false', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(5)
          return 'test'
        },
        {
          notifyOnStatusChange: false,
        }
      )

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        setTimeout(refetch, 10)
      }, [refetch])
      return null
    }

    render(<Page />)

    await waitForMs(30)

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

    const rendered = render(<Page />)

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

    render(<Page />)

    expect(queryCache.getQuery(key)!.config.queryFn).toBe(queryFn1)
  })

  it('should batch re-renders', async () => {
    const key = queryKey()

    let renders = 0

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    function Page() {
      useQuery(key, queryFn)
      useQuery(key, queryFn)
      renders++
      return null
    }

    render(<Page />)

    await waitForMs(20)

    // Should be 2 instead of 3
    expect(renders).toBe(2)
  })

  it('should batch re-renders including hook callbacks', async () => {
    const key = queryKey()

    let renders = 0
    let renderedCount = 0

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    function Page() {
      const [count, setCount] = React.useState(0)
      useQuery(key, queryFn, {
        onSuccess: () => {
          setCount(x => x + 1)
        },
      })
      useQuery(key, queryFn, {
        onSuccess: () => {
          setCount(x => x + 1)
        },
      })
      renders++
      renderedCount = count
      return null
    }

    render(<Page />)

    await waitForMs(20)

    // Should be 2 instead of 5
    expect(renders).toBe(2)

    // Both callbacks should have been executed
    expect(renderedCount).toBe(2)
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status idle if enabled is false', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const first = useQuery(key1, () => 'data', {
        enabled: false,
      })
      const second = useQuery(key2, () => 'data')

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
    const key = queryKey()

    function Page() {
      const { status } = useQuery(key, async () => {
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
    const key = queryKey()
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    const variables = { number: 5, boolean: false, object: {}, array: [] }

    function Page() {
      useQuery([key, variables], queryFn)

      return null
    }

    render(<Page />)

    expect(queryFn).toHaveBeenCalledWith(key, variables)
  })

  it('should not refetch query on focus when `enabled` is set to `false`', async () => {
    const key = queryKey()
    const queryFn = jest.fn()

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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('default'))

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(key, () => count++, {
        staleTime: 0,
        refetchOnWindowFocus: false,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(10)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitForMs(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(key, () => count++, {
        staleTime: Infinity,
        refetchOnWindowFocus: true,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(10)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitForMs(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
  })

  it('should refetch fresh query on focus when `refetchOnWindowFocus` is set to `always`', async () => {
    const key = queryKey()
    const states: QueryResult<number>[] = []
    let count = 0

    function Page() {
      const state = useQuery(key, () => count++, {
        staleTime: Infinity,
        refetchOnWindowFocus: 'always',
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(10)

    act(() => {
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitForMs(10)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
    expect(states[1]).toMatchObject({ data: 0, isFetching: false })
    expect(states[2]).toMatchObject({ data: 0, isFetching: true })
    expect(states[3]).toMatchObject({ data: 1, isFetching: false })
  })

  it('should refetch fresh query when refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    await queryCache.prefetchQuery(key, () => 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data', {
        refetchOnMount: 'always',
        staleTime: Infinity,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(10)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isStale: false,
      isFetching: false,
    })
    expect(states[1]).toMatchObject({
      data: 'prefetched',
      isStale: false,
      isFetching: true,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isStale: false,
      isFetching: false,
    })
  })

  it('should refetch stale query when refetchOnMount is set to true', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    await queryCache.prefetchQuery(key, () => 'prefetched')

    await sleep(10)

    function Page() {
      const state = useQuery(key, () => 'data', {
        refetchOnMount: true,
        staleTime: 0,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(10)

    expect(states.length).toBe(3)
    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isStale: true,
      isFetching: false,
    })
    expect(states[1]).toMatchObject({
      data: 'prefetched',
      isStale: true,
      isFetching: true,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isStale: true,
      isFetching: false,
    })
  })

  it('should set status to error if queryFn throws', async () => {
    const key = queryKey()
    const consoleMock = mockConsoleError()

    function Page() {
      const { status, error } = useQuery<undefined, string>(
        key,
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

  it('should always fetch if forceFetchOnMount is set', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    await queryCache.prefetchQuery(key, () => 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data', {
        forceFetchOnMount: true,
        staleTime: 100,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(3))

    expect(states).toMatchObject([
      { data: 'prefetched', isStale: false, isFetching: false },
      { data: 'prefetched', isStale: false, isFetching: true },
      { data: 'data', isStale: false, isFetching: false },
    ])
  })

  it('should not fetch if initial data is set', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', {
        initialData: 'initial',
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(10)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: 'initial', isStale: false })
    expect(states[1]).toMatchObject({ data: 'initial', isStale: true })
  })

  it('should fetch if initial data is set and initial stale is set to true', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', {
        initialData: 'initial',
        initialStale: true,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(3))

    expect(states).toMatchObject([
      { data: 'initial', isStale: true, isFetching: false },
      { data: 'initial', isStale: true, isFetching: true },
      { data: 'data', isStale: true, isFetching: false },
    ])
  })

  it('should fetch if initial data is set and initial stale is set to true with stale time', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    function Page() {
      const state = useQuery(key, () => 'data', {
        staleTime: 50,
        initialData: 'initial',
        initialStale: true,
      })
      states.push(state)
      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      data: 'initial',
      isStale: true,
      isFetching: false,
    })
    expect(states[1]).toMatchObject({
      data: 'initial',
      isStale: true,
      isFetching: true,
    })
    expect(states[2]).toMatchObject({
      data: 'data',
      isStale: false,
      isFetching: false,
    })
    expect(states[3]).toMatchObject({
      data: 'data',
      isStale: true,
      isFetching: false,
    })
  })

  it('should keep initial stale and initial data when the query key changes', async () => {
    const key = queryKey()
    const states: QueryResult<{ count: number }>[] = []

    function Page() {
      const [count, setCount] = React.useState(0)
      const state = useQuery([key, count], () => ({ count: 10 }), {
        initialStale: () => false,
        initialData: () => ({ count }),
      })
      states.push(state)

      React.useEffect(() => {
        setTimeout(() => setCount(1), 10)
      }, [])

      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({ data: { count: 0 } })
    expect(states[1]).toMatchObject({ data: { count: 0 } })
    expect(states[2]).toMatchObject({ data: { count: 1 } })
    expect(states[3]).toMatchObject({ data: { count: 1 } })
  })

  it('should retry specified number of times', async () => {
    const key = queryKey()
    const consoleMock = mockConsoleError()

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => {
      return Promise.reject('Error test Barrett')
    })

    function Page() {
      const { status, failureCount } = useQuery(key, queryFn, {
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
    const key = queryKey()

    const consoleMock = mockConsoleError()

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
        [string]
      >(key, queryFn, {
        retryDelay: 1,
        retry: (_failureCount, err) => err !== 'NoRetry',
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

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const key = queryKey()

    const consoleMock = mockConsoleError()

    const originalVisibilityState = document.visibilityState

    // make page unfocused
    mockVisibilityState('hidden')

    let count = 0

    function Page() {
      const query = useQuery(
        key,
        () => {
          count++
          return Promise.reject(`fetching error ${count}`)
        },
        {
          retry: 3,
          retryDelay: 1,
        }
      )

      return (
        <div>
          <div>error {String(query.error)}</div>
          <div>status {query.status}</div>
          <div>failureCount {query.failureCount}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    // The query should display the first error result
    await waitFor(() => rendered.getByText('failureCount 1'))
    await waitFor(() => rendered.getByText('status loading'))
    await waitFor(() => rendered.getByText('error null'))

    // Check if the query really paused
    await sleep(10)
    await waitFor(() => rendered.getByText('failureCount 1'))

    act(() => {
      // reset visibilityState to original value
      mockVisibilityState(originalVisibilityState)
      window.dispatchEvent(new FocusEvent('focus'))
    })

    // Wait for the final result
    await waitFor(() => rendered.getByText('failureCount 4'))
    await waitFor(() => rendered.getByText('status error'))
    await waitFor(() => rendered.getByText('error fetching error 4'))

    // Check if the query really stopped
    await sleep(10)
    await waitFor(() => rendered.getByText('failureCount 4'))

    // Check if the error has been logged in the console
    expect(consoleMock).toHaveBeenCalledWith('fetching error 4')

    consoleMock.mockRestore()
  })

  it('should fetch on mount when a query was already created with setQueryData', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    queryCache.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data')
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() =>
      expect(states).toMatchObject([
        {
          data: 'prefetched',
          isFetching: false,
          isStale: true,
        },
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
    )
  })

  it('should refetch after focus regain', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []
    const consoleMock = mockConsoleError()

    // make page unfocused
    const originalVisibilityState = document.visibilityState
    mockVisibilityState('hidden')

    // set data in cache to check if the hook query fn is actually called
    queryCache.setQueryData(key, 'prefetched')

    function Page() {
      const state = useQuery(key, () => 'data')
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(3))

    act(() => {
      // reset visibilityState to original value
      mockVisibilityState(originalVisibilityState)
      window.dispatchEvent(new FocusEvent('focus'))
    })

    await waitFor(() => expect(states.length).toBe(5))

    expect(states).toMatchObject([
      {
        data: 'prefetched',
        isFetching: false,
        isStale: true,
      },
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

    consoleMock.mockRestore()
  })

  // See https://github.com/tannerlinsley/react-query/issues/195
  it('should refetch if stale after a prefetch', async () => {
    const key = queryKey()
    const states: QueryResult<string>[] = []

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(() => 'not yet...')

    await queryCache.prefetchQuery(key, prefetchQueryFn, {
      staleTime: 10,
    })

    await sleep(11)

    function Page() {
      const state = useQuery(key, queryFn)
      states.push(state)
      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(3))

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not refetch if not stale after a prefetch', async () => {
    const key = queryKey()

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')

    const prefetchQueryFn = jest.fn()
    prefetchQueryFn.mockImplementation(async () => {
      await sleep(10)
      return 'not yet...'
    })

    await queryCache.prefetchQuery(key, prefetchQueryFn, {
      staleTime: 1000,
    })

    await sleep(0)

    function Page() {
      useQuery(key, queryFn, {
        staleTime: 1000,
      })
      return null
    }

    render(<Page />)

    await sleep(0)

    expect(prefetchQueryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  // See https://github.com/tannerlinsley/react-query/issues/190
  it('should reset failureCount on successful fetch', async () => {
    const key = queryKey()

    const consoleMock = mockConsoleError()

    function Page() {
      let counter = 0

      const query = useQuery(
        key,
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
    const key = queryKey()

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const [isPrefetched, setPrefetched] = React.useState(false)

      const query = useQuery(key, () => undefined, {
        enabled,
      })

      React.useEffect(() => {
        async function prefetch() {
          await queryCache.prefetchQuery(key, () =>
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
    const key = queryKey()

    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(false)

      const query = useQuery(key, () => 'data', {
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
    const key = queryKey()

    function Page() {
      const query = useQuery(key, () => 'serverData', {
        initialData: 'data',
      })

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
    const key = queryKey()

    function Page() {
      const query = useQuery(key, () => 1, { initialData: 0 })

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
    const key = queryKey()
    const callback = jest.fn()

    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(true)
      const query = useQuery(key, () => 'fetched data', {
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
    const key = queryKey()
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => 'data')

    function Page() {
      const { status } = useQuery({
        queryKey: key,
        queryFn,
        config: {
          enabled: false,
        },
      })
      return <div>status: {status}</div>
    }

    const rendered = render(<Page />)

    expect(queryFn).not.toHaveBeenCalled()
    expect(queryCache.getQuery(key)).not.toBeUndefined()
    rendered.getByText('status: idle')
  })

  // See https://github.com/tannerlinsley/react-query/issues/360
  test('should init to status:idle when enabled is falsey', async () => {
    const key = queryKey()

    function Page() {
      const query = useQuery(key, () => undefined, {
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
    const key = queryKey()

    function Page() {
      const query = useQuery(key, () => 'fetched data', {
        cacheTime: Infinity,
      })
      return <div>{query.data}</div>
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('fetched data'))

    rendered.unmount()

    const query = queryCache.getQuery(key)
    // @ts-expect-error
    expect(query!.cacheTimeout).toBe(undefined)
  })

  it('should not cause memo churn when data does not change', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
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

    const rendered = render(<Page />)

    // mount
    await waitFor(() => rendered.getByText('count: 0'))
    await waitFor(() => rendered.getByText('count: 1'))
    await waitFor(() => rendered.getByText('count: 2'))
  })

  it('should error when using functions as query keys', () => {
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
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

  it('should refetch if any query instance becomes enabled', async () => {
    const key = queryKey()

    const queryFn = jest.fn().mockReturnValue('data')

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

    const rendered = render(<Page />)
    expect(queryFn).toHaveBeenCalledTimes(0)
    fireEvent.click(rendered.getByText('enable'))
    await waitFor(() => rendered.getByText('data'))
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use placeholder data while the query loads', async () => {
    const key1 = queryKey()

    const states: QueryResult<string>[] = []

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

    const rendered = render(<Page />)
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
})
