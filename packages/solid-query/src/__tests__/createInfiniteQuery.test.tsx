import { fireEvent, render, screen, waitFor } from 'solid-testing-library'

import { createQueryClient, sleep } from './utils'

import {
  createEffect,
  createRenderEffect,
  createSignal,
  For,
  Index,
  Match,
  Switch,
} from 'solid-js'
import type {
  CreateInfiniteQueryResult,
  InfiniteData,
  QueryFunctionContext,
} from '..'
import { createInfiniteQuery, QueryCache, QueryClientProvider } from '..'
import { Blink, queryKey, setActTimeout } from './utils'

interface Result {
  items: number[]
  nextId?: number
  prevId?: number
  ts: number
}

const pageSize = 10

const fetchItems = async (
  page: number,
  ts: number,
  noNext?: boolean,
  noPrev?: boolean,
): Promise<Result> => {
  await sleep(10)
  return {
    items: [...new Array(10)].fill(null).map((_, d) => page * pageSize + d),
    nextId: noNext ? undefined : page + 1,
    prevId: noPrev ? undefined : page - 1,
    ts,
  }
}

describe('useInfiniteQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        ({ pageParam = 0 }) => Number(pageParam),
        {
          getNextPageParam: (lastPage) => lastPage + 1,
        },
      )
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
    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      fetchNextPage: expect.any(Function),
      fetchPreviousPage: expect.any(Function),
      hasNextPage: undefined,
      hasPreviousPage: undefined,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
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
      data: { pages: [0], pageParams: [undefined] },
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      fetchNextPage: expect.any(Function),
      fetchPreviousPage: expect.any(Function),
      hasNextPage: true,
      hasPreviousPage: undefined,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
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

  it('should not throw when fetchNextPage returns an error', async () => {
    const key = queryKey()
    let noThrow: boolean

    function Page() {
      const start = 1
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = start }) => {
          if (pageParam === 2) {
            throw new Error('error')
          }
          return Number(pageParam)
        },
        {
          retry: 1,
          retryDelay: 10,
          getNextPageParam: (lastPage) => lastPage + 1,
        },
      )

      createEffect(() => {
        const fetchNextPage = state.fetchNextPage
        setActTimeout(() => {
          fetchNextPage()
            .then(() => {
              noThrow = true
            })
            .catch(() => undefined)
        }, 20)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => expect(noThrow).toBe(true))
  })

  it('should keep the previous data when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<string>[] = []

    function Page() {
      const [order, setOrder] = createSignal('desc')

      const state = createInfiniteQuery(
        () => [key(), order()],
        async ({ pageParam = 0 }) => {
          await sleep(10)
          return `${pageParam}-${order()}`
        },
        {
          getNextPageParam: () => 1,
          keepPreviousData: true,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <button onClick={() => setOrder('asc')}>order</button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 0-desc'))
    fireEvent.click(screen.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => screen.getByText('data: 0-desc,1-desc'))
    fireEvent.click(screen.getByRole('button', { name: /order/i }))

    await waitFor(() => screen.getByText('data: 0-asc'))
    await waitFor(() => screen.getByText('isFetching: false'))
    await waitFor(() => expect(states.length).toBe(6))

    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
      isPreviousData: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: ['0-desc'] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isPreviousData: false,
    })
    expect(states[2]).toMatchObject({
      data: { pages: ['0-desc'] },
      isFetching: true,
      isFetchingNextPage: true,
      isSuccess: true,
      isPreviousData: false,
    })
    expect(states[3]).toMatchObject({
      data: { pages: ['0-desc', '1-desc'] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isPreviousData: false,
    })
    // Set state
    expect(states[4]).toMatchObject({
      data: { pages: ['0-desc', '1-desc'] },
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
      isPreviousData: true,
    })
    expect(states[5]).toMatchObject({
      data: { pages: ['0-asc'] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should be able to select a part of the data', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<string>[] = []

    function Page() {
      const state = createInfiniteQuery(key, () => ({ count: 1 }), {
        select: (data) => ({
          pages: data.pages.map((x) => `count: ${x.count}`),
          pageParams: data.pageParams,
        }),
      })
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
      data: undefined,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: ['count: 1'] },
      isSuccess: true,
    })
  })

  it('should be able to select a new result and not cause infinite renders', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<{ count: number; id: number }>[] =
      []
    let selectCalled = 0

    function Page() {
      const state = createInfiniteQuery(key, () => ({ count: 1 }), {
        select: (data: InfiniteData<{ count: number }>) => {
          selectCalled++
          return {
            pages: data.pages.map((x) => ({ ...x, id: Math.random() })),
            pageParams: data.pageParams,
          }
        },
      })
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

    expect(states.length).toBe(2)
    expect(selectCalled).toBe(1)
    expect(states[0]).toMatchObject({
      data: undefined,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [{ count: 1 }] },
      isSuccess: true,
    })
  })

  it('should be able to reverse the data', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = 0 }) => {
          await sleep(10)
          return Number(pageParam)
        },
        {
          select: (data) => ({
            pages: [...data.pages].reverse(),
            pageParams: [...data.pageParams].reverse(),
          }),
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => state.fetchNextPage({ pageParam: 1 })}>
            fetchNextPage
          </button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {state.isFetching}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 0'))
    fireEvent.click(screen.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => screen.getByText('data: 1,0'))

    await waitFor(() => expect(states.length).toBe(4))
    expect(states[0]).toMatchObject({
      data: undefined,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [0] },
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      data: { pages: [0] },
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      data: { pages: [1, 0] },
      isSuccess: true,
    })
  })

  it('should be able to fetch a previous page', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const start = 10
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = start }) => {
          await sleep(10)
          return Number(pageParam)
        },
        {
          getPreviousPageParam: (firstPage) => firstPage - 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const fetchPreviousPage = state.fetchPreviousPage
        setActTimeout(() => {
          fetchPreviousPage()
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

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      data: undefined,
      hasNextPage: undefined,
      hasPreviousPage: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      hasNextPage: undefined,
      hasPreviousPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      data: { pages: [10] },
      hasNextPage: undefined,
      hasPreviousPage: true,
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: true,
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      data: { pages: [9, 10] },
      hasNextPage: undefined,
      hasPreviousPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isSuccess: true,
    })
  })

  it('should be able to refetch when providing page params manually', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(key, async ({ pageParam = 10 }) => {
        await sleep(10)
        return Number(pageParam)
      })

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => state.fetchNextPage({ pageParam: 11 })}>
            fetchNextPage
          </button>
          <button onClick={() => state.fetchPreviousPage({ pageParam: 9 })}>
            fetchPreviousPage
          </button>
          <button onClick={() => state.refetch()}>refetch</button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 10'))
    fireEvent.click(screen.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => screen.getByText('data: 10,11'))
    fireEvent.click(screen.getByRole('button', { name: /fetchPreviousPage/i }))
    await waitFor(() => screen.getByText('data: 9,10,11'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))

    await waitFor(() => screen.getByText('isFetching: false'))
    await waitFor(() => expect(states.length).toBe(8))

    // Initial fetch
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
    })
    // Initial fetch done
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      isFetching: false,
      isFetchingNextPage: false,
    })
    // Fetch next page
    expect(states[2]).toMatchObject({
      data: { pages: [10] },
      isFetching: true,
      isFetchingNextPage: true,
    })
    // Fetch next page done
    expect(states[3]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
    })
    // Fetch previous page
    expect(states[4]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: true,
    })
    // Fetch previous page done
    expect(states[5]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
    })
    // Refetch
    expect(states[6]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
    })
    // Refetch done
    expect(states[7]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
    })
  })

  it('should be able to refetch when providing page params automatically', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = 10 }) => {
          await sleep(10)
          return Number(pageParam)
        },
        {
          getPreviousPageParam: (firstPage) => firstPage - 1,
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <button onClick={() => state.fetchPreviousPage()}>
            fetchPreviousPage
          </button>
          <button onClick={() => state.refetch()}>refetch</button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 10'))
    fireEvent.click(screen.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => screen.getByText('data: 10,11'))
    fireEvent.click(screen.getByRole('button', { name: /fetchPreviousPage/i }))
    await waitFor(() => screen.getByText('data: 9,10,11'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))

    await waitFor(() => screen.getByText('isFetching: false'))
    await waitFor(() => expect(states.length).toBe(8))

    // Initial fetch
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
    })
    // Initial fetch done
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      isFetching: false,
      isFetchingNextPage: false,
    })
    // Fetch next page
    expect(states[2]).toMatchObject({
      data: { pages: [10] },
      isFetching: true,
      isFetchingNextPage: true,
    })
    // Fetch next page done
    expect(states[3]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
    })
    // Fetch previous page
    expect(states[4]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: true,
    })
    // Fetch previous page done
    expect(states[5]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
    })
    // Refetch
    expect(states[6]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
    })
    // Refetch done
    expect(states[7]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
    })
  })

  it('should be able to refetch only specific pages when refetchPages is provided', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      let multiplier = 1
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = 10 }) => {
          await sleep(10)
          return Number(pageParam) * multiplier
        },
        {
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <button
            onClick={() => {
              multiplier = 2
              state.refetch({
                refetchPage: (_, index) => index === 0,
              })
            }}
          >
            refetchPage
          </button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 10'))
    fireEvent.click(screen.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => screen.getByText('data: 10,11'))
    fireEvent.click(screen.getByRole('button', { name: /refetchPage/i }))

    await waitFor(() => screen.getByText('data: 20,11'))
    await waitFor(() => screen.getByText('isFetching: false'))
    await waitFor(() => expect(states.length).toBe(6))

    // Initial fetch
    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
    })
    // Initial fetch done
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      isFetching: false,
      isFetchingNextPage: false,
    })
    // Fetch next page
    expect(states[2]).toMatchObject({
      data: { pages: [10] },
      isFetching: true,
      isFetchingNextPage: true,
    })
    // Fetch next page done
    expect(states[3]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
    })
    // Refetch
    expect(states[4]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
    })
    // Refetch done, only page one has been refetched and multiplied
    expect(states[5]).toMatchObject({
      data: { pages: [20, 11] },
      isFetching: false,
      isFetchingNextPage: false,
    })
  })

  it('should silently cancel any ongoing fetch when fetching more', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const start = 10
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = start }) => {
          await sleep(50)
          return Number(pageParam)
        },
        {
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const { refetch, fetchNextPage } = state
        setActTimeout(() => {
          refetch()
        }, 100)
        setActTimeout(() => {
          fetchNextPage()
        }, 110)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(300)

    expect(states.length).toBe(5)
    expect(states[0]).toMatchObject({
      hasNextPage: undefined,
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      hasNextPage: true,
      data: { pages: [10] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      hasNextPage: true,
      data: { pages: [10] },
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      hasNextPage: true,
      data: { pages: [10] },
      isFetching: true,
      isFetchingNextPage: true,
      isSuccess: true,
    })
    expect(states[4]).toMatchObject({
      hasNextPage: true,
      data: { pages: [10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: jest.Mock<any, any>[] = []
    const abortListeners: jest.Mock<any, any>[] = []
    const fetchPage = jest.fn<
      Promise<number>,
      [QueryFunctionContext<ReturnType<typeof key>, number>]
    >(async ({ pageParam = start, signal }) => {
      if (signal) {
        const onAbort = jest.fn()
        const abortListener = jest.fn()
        onAborts.push(onAbort)
        abortListeners.push(abortListener)
        signal.onabort = onAbort
        signal.addEventListener('abort', abortListener)
      }
      await sleep(50)
      return Number(pageParam)
    })

    function Page() {
      const state = createInfiniteQuery(key, fetchPage, {
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      createEffect(() => {
        const { fetchNextPage } = state
        setActTimeout(() => {
          fetchNextPage()
        }, 100)
        setActTimeout(() => {
          fetchNextPage()
        }, 110)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(300)

    const expectedCallCount = 3
    expect(fetchPage).toBeCalledTimes(expectedCallCount)
    expect(onAborts).toHaveLength(expectedCallCount)
    expect(abortListeners).toHaveLength(expectedCallCount)

    let callIndex = 0
    const firstCtx = fetchPage.mock.calls[callIndex]![0]
    expect(firstCtx.pageParam).toBeUndefined()
    expect(firstCtx.queryKey).toEqual(key())
    expect(firstCtx.signal).toBeInstanceOf(AbortSignal)
    expect(firstCtx.signal?.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()

    callIndex = 1
    const secondCtx = fetchPage.mock.calls[callIndex]![0]
    expect(secondCtx.pageParam).toBe(11)
    expect(secondCtx.queryKey).toEqual(key())
    expect(secondCtx.signal).toBeInstanceOf(AbortSignal)
    expect(secondCtx.signal?.aborted).toBe(true)
    expect(onAborts[callIndex]).toHaveBeenCalledTimes(1)
    expect(abortListeners[callIndex]).toHaveBeenCalledTimes(1)

    callIndex = 2
    const thirdCtx = fetchPage.mock.calls[callIndex]![0]
    expect(thirdCtx.pageParam).toBe(11)
    expect(thirdCtx.queryKey).toEqual(key())
    expect(thirdCtx.signal).toBeInstanceOf(AbortSignal)
    expect(thirdCtx.signal?.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()
  })

  it('should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used ', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: jest.Mock<any, any>[] = []
    const abortListeners: jest.Mock<any, any>[] = []
    const fetchPage = jest.fn<
      Promise<number>,
      [QueryFunctionContext<ReturnType<typeof key>, number>]
    >(async ({ pageParam = start, signal }) => {
      if (signal) {
        const onAbort = jest.fn()
        const abortListener = jest.fn()
        onAborts.push(onAbort)
        abortListeners.push(abortListener)
        signal.onabort = onAbort
        signal.addEventListener('abort', abortListener)
      }
      await sleep(50)
      return Number(pageParam)
    })

    function Page() {
      const state = createInfiniteQuery(key, fetchPage, {
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      createEffect(() => {
        const { fetchNextPage } = state
        setActTimeout(() => {
          fetchNextPage()
        }, 100)
        setActTimeout(() => {
          fetchNextPage({ cancelRefetch: false })
        }, 110)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(300)

    const expectedCallCount = 2
    expect(fetchPage).toBeCalledTimes(expectedCallCount)
    expect(onAborts).toHaveLength(expectedCallCount)
    expect(abortListeners).toHaveLength(expectedCallCount)

    let callIndex = 0
    const firstCtx = fetchPage.mock.calls[callIndex]![0]
    expect(firstCtx.pageParam).toBeUndefined()
    expect(firstCtx.queryKey).toEqual(key())
    expect(firstCtx.signal).toBeInstanceOf(AbortSignal)
    expect(firstCtx.signal?.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()

    callIndex = 1
    const secondCtx = fetchPage.mock.calls[callIndex]![0]
    expect(secondCtx.pageParam).toBe(11)
    expect(secondCtx.queryKey).toEqual(key())
    expect(secondCtx.signal).toBeInstanceOf(AbortSignal)
    expect(secondCtx.signal?.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()
  })

  it('should keep fetching first page when not loaded yet and triggering fetch more', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const start = 10
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = start }) => {
          await sleep(50)
          return Number(pageParam)
        },
        {
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const { fetchNextPage } = state
        setActTimeout(() => {
          fetchNextPage()
        }, 10)
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
      hasNextPage: undefined,
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      hasNextPage: true,
      data: { pages: [10] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should stop fetching additional pages when the component is unmounted and AbortSignal is consumed', async () => {
    const key = queryKey()
    let fetches = 0

    const initialData = { pages: [1, 2, 3, 4], pageParams: [0, 1, 2, 3] }

    function List() {
      createInfiniteQuery(
        key,
        async ({ pageParam = 0, signal: _ }) => {
          fetches++
          await sleep(50)
          return Number(pageParam) * 10
        },
        {
          initialData,
          getNextPageParam: (_, allPages) => {
            return allPages.length === 4 ? undefined : allPages.length
          },
        },
      )

      return null
    }

    function Page() {
      const [show, setShow] = createSignal(true)

      createEffect(() => {
        setActTimeout(() => {
          setShow(false)
        }, 75)
      })

      return <>{show() ? <List /> : null}</>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(300)

    expect(fetches).toBe(2)
    expect(queryClient.getQueryState(key())).toMatchObject({
      data: initialData,
      status: 'success',
      error: null,
    })
  })

  it('should be able to override the cursor in the fetchNextPage callback', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        async ({ pageParam = 0 }) => {
          await sleep(10)
          return Number(pageParam)
        },
        {
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const { fetchNextPage } = state
        setActTimeout(() => {
          fetchNextPage({ pageParam: 5 })
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

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      hasNextPage: undefined,
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      hasNextPage: true,
      data: { pages: [0] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      hasNextPage: true,
      data: { pages: [0] },
      isFetching: true,
      isFetchingNextPage: true,
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      hasNextPage: true,
      data: { pages: [0, 5] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should be able to set new pages with the query client', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const [firstPage, setFirstPage] = createSignal(0)

      const state = createInfiniteQuery(
        key,
        async ({ pageParam = firstPage() }) => {
          await sleep(10)
          return Number(pageParam)
        },
        {
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const { refetch } = state
        setActTimeout(() => {
          queryClient.setQueryData(key(), { pages: [7, 8], pageParams: [7, 8] })
          setFirstPage(7)
        }, 20)

        setActTimeout(() => {
          refetch()
        }, 50)
      })

      return null
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await sleep(100)

    expect(states.length).toBe(5)
    expect(states[0]).toMatchObject({
      hasNextPage: undefined,
      data: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
    })
    // After first fetch
    expect(states[1]).toMatchObject({
      hasNextPage: true,
      data: { pages: [0] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    // Set state
    expect(states[2]).toMatchObject({
      hasNextPage: true,
      data: { pages: [7, 8] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    // Refetch
    expect(states[3]).toMatchObject({
      hasNextPage: true,
      data: { pages: [7, 8] },
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    // Refetch done
    expect(states[4]).toMatchObject({
      hasNextPage: true,
      data: { pages: [7, 8] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should only refetch the first page when initialData is provided', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        async ({ pageParam }): Promise<number> => {
          await sleep(10)
          return pageParam
        },
        {
          initialData: { pages: [1], pageParams: [1] },
          getNextPageParam: (lastPage) => lastPage + 1,
          notifyOnChangeProps: 'all',
        },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createEffect(() => {
        const { fetchNextPage } = state
        setActTimeout(() => {
          fetchNextPage()
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

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      data: { pages: [1] },
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [1] },
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      data: { pages: [1] },
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: true,
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      data: { pages: [1, 2] },
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should set hasNextPage to false if getNextPageParam returns undefined', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        ({ pageParam = 1 }) => Number(pageParam),
        {
          getNextPageParam: () => undefined,
        },
      )

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
      data: undefined,
      hasNextPage: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [1] },
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should compute hasNextPage correctly using initialData', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        ({ pageParam = 10 }): number => pageParam,
        {
          initialData: { pages: [10], pageParams: [undefined] },
          getNextPageParam: (lastPage) => (lastPage === 10 ? 11 : undefined),
        },
      )

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
      data: { pages: [10] },
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should compute hasNextPage correctly for falsy getFetchMore return value using initialData', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        ({ pageParam = 10 }): number => pageParam,
        {
          initialData: { pages: [10], pageParams: [undefined] },
          getNextPageParam: () => undefined,
        },
      )

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
      data: { pages: [10] },
      hasNextPage: false,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should not use selected data when computing hasNextPage', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<string>[] = []

    function Page() {
      const state = createInfiniteQuery(
        key,
        ({ pageParam = 1 }) => Number(pageParam),
        {
          getNextPageParam: (lastPage) => (lastPage === 1 ? 2 : false),
          select: (data) => ({
            pages: data.pages.map((x) => x.toString()),
            pageParams: data.pageParams,
          }),
        },
      )

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
      data: undefined,
      hasNextPage: undefined,
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: ['1'] },
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
    })
  })

  it('should build fresh cursors on refetch', async () => {
    const key = queryKey()

    const genItems = (size: number) =>
      [...new Array(size)].fill(null).map((_, d) => d)
    const items = genItems(15)
    const limit = 3

    const fetchItemsWithLimit = async (cursor = 0, ts: number) => {
      await sleep(10)
      return {
        nextId: cursor + limit,
        items: items.slice(cursor, cursor + limit),
        ts,
      }
    }

    function Page() {
      let fetchCountRef = 0
      const state = createInfiniteQuery<Result, Error>(
        key,
        ({ pageParam = 0 }) => fetchItemsWithLimit(pageParam, fetchCountRef++),
        {
          getNextPageParam: (lastPage) => lastPage.nextId,
        },
      )

      return (
        <div>
          <h1>Pagination</h1>
          <Switch
            fallback={
              <>
                <div>Data:</div>
                <For each={state.data?.pages ?? []}>
                  {(page, i) => (
                    <div>
                      <div>
                        Page {i()}: {page.ts}
                      </div>
                      <div>
                        <Index each={page.items}>
                          {(item) => <p>Item: {item()}</p>}
                        </Index>
                      </div>
                    </div>
                  )}
                </For>
                <div>
                  <button
                    onClick={() => state.fetchNextPage()}
                    disabled={
                      !state.hasNextPage || Boolean(state.isFetchingNextPage)
                    }
                  >
                    <Switch fallback={<>Nothing more to load</>}>
                      <Match when={state.isFetchingNextPage}>
                        Loading more...
                      </Match>
                      <Match when={state.hasNextPage}>Load More</Match>
                    </Switch>
                  </button>
                  <button onClick={() => state.refetch()}>Refetch</button>
                  <button
                    onClick={() => {
                      // Imagine that this mutation happens somewhere else
                      // makes an actual network request
                      // and calls invalidateQueries in an onSuccess
                      items.splice(4, 1)
                      queryClient.invalidateQueries(key())
                    }}
                  >
                    Remove item
                  </button>
                </div>
                <div>
                  {!state.isFetchingNextPage ? 'Background Updating...' : null}
                </div>
              </>
            }
          >
            <Match when={state.status === 'loading'}>Loading...</Match>
            <Match when={state.status === 'error'}>
              <span>Error: {state.error!.message}</span>
            </Match>
          </Switch>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    screen.getByText('Loading...')

    await waitFor(() => screen.getByText('Item: 2'))
    await waitFor(() => screen.getByText('Page 0: 0'))

    fireEvent.click(screen.getByText('Load More'))

    await waitFor(() => screen.getByText('Loading more...'))
    await waitFor(() => screen.getByText('Item: 5'))
    await waitFor(() => screen.getByText('Page 0: 0'))
    await waitFor(() => screen.getByText('Page 1: 1'))

    fireEvent.click(screen.getByText('Load More'))

    await waitFor(() => screen.getByText('Loading more...'))
    await waitFor(() => screen.getByText('Item: 8'))
    await waitFor(() => screen.getByText('Page 0: 0'))
    await waitFor(() => screen.getByText('Page 1: 1'))
    await waitFor(() => screen.getByText('Page 2: 2'))

    fireEvent.click(screen.getByText('Refetch'))

    await waitFor(() => screen.getByText('Background Updating...'))
    await waitFor(() => screen.getByText('Item: 8'))
    await waitFor(() => screen.getByText('Page 0: 3'))
    await waitFor(() => screen.getByText('Page 1: 4'))
    await waitFor(() => screen.getByText('Page 2: 5'))

    // ensure that Item: 4 is rendered before removing it
    expect(screen.queryAllByText('Item: 4')).toHaveLength(1)

    // remove Item: 4
    fireEvent.click(screen.getByText('Remove item'))

    await waitFor(() => screen.getByText('Background Updating...'))
    // ensure that an additional item is rendered (it means that cursors were properly rebuilt)
    await waitFor(() => screen.getByText('Item: 9'))
    await waitFor(() => screen.getByText('Page 0: 6'))
    await waitFor(() => screen.getByText('Page 1: 7'))
    await waitFor(() => screen.getByText('Page 2: 8'))

    // ensure that Item: 4 is no longer rendered
    expect(screen.queryAllByText('Item: 4')).toHaveLength(0)
  })

  it('should compute hasNextPage correctly for falsy getFetchMore return value on refetching', async () => {
    const key = queryKey()
    const MAX = 2

    function Page() {
      let fetchCountRef = 0
      const [isRemovedLastPage, setIsRemovedLastPage] =
        createSignal<boolean>(false)
      const state = createInfiniteQuery<Result, Error>(
        key,
        ({ pageParam = 0 }) =>
          fetchItems(
            pageParam,
            fetchCountRef++,
            pageParam === MAX || (pageParam === MAX - 1 && isRemovedLastPage()),
          ),
        {
          getNextPageParam: (lastPage) => lastPage.nextId,
        },
      )

      return (
        <div>
          <h1>Pagination</h1>
          <Switch
            fallback={
              <>
                <div>Data:</div>
                <For each={state.data!.pages}>
                  {(page, i) => (
                    <div>
                      <div>
                        Page {i()}: {page.ts}
                      </div>
                      <div>
                        <Index each={page.items}>
                          {(item) => <p>Item: {item()}</p>}
                        </Index>
                      </div>
                    </div>
                  )}
                </For>
                <div>
                  <button
                    onClick={() => state.fetchNextPage()}
                    disabled={
                      !state.hasNextPage || Boolean(state.isFetchingNextPage)
                    }
                  >
                    {state.isFetchingNextPage
                      ? 'Loading more...'
                      : state.hasNextPage
                      ? 'Load More'
                      : 'Nothing more to load'}
                  </button>
                  <button onClick={() => state.refetch()}>Refetch</button>
                  <button onClick={() => setIsRemovedLastPage(true)}>
                    Remove Last Page
                  </button>
                </div>
                <div>
                  {state.isFetching && !state.isFetchingNextPage
                    ? 'Background Updating...'
                    : null}
                </div>
              </>
            }
          >
            <Match when={state.status === 'loading'}>Loading...</Match>
            <Match when={state.status === 'error'}>
              <span>Error: {state.error!.message}</span>
            </Match>
          </Switch>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    screen.getByText('Loading...')

    await waitFor(() => {
      screen.getByText('Item: 9')
      screen.getByText('Page 0: 0')
    })

    fireEvent.click(screen.getByText('Load More'))

    await waitFor(() => screen.getByText('Loading more...'))

    await waitFor(() => {
      screen.getByText('Item: 19')
      screen.getByText('Page 0: 0')
      screen.getByText('Page 1: 1')
    })

    fireEvent.click(screen.getByText('Load More'))

    await waitFor(() => screen.getByText('Loading more...'))

    await waitFor(() => {
      screen.getByText('Item: 29')
      screen.getByText('Page 0: 0')
      screen.getByText('Page 1: 1')
      screen.getByText('Page 2: 2')
    })

    screen.getByText('Nothing more to load')

    fireEvent.click(screen.getByText('Remove Last Page'))

    await sleep(10)

    fireEvent.click(screen.getByText('Refetch'))

    await waitFor(() => screen.getByText('Background Updating...'))

    await waitFor(() => {
      screen.getByText('Page 0: 3')
      screen.getByText('Page 1: 4')
    })

    expect(screen.queryByText('Item: 29')).toBeNull()
    expect(screen.queryByText('Page 2: 5')).toBeNull()

    screen.getByText('Nothing more to load')
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
      const state = createInfiniteQuery(key, queryFn)
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
})
