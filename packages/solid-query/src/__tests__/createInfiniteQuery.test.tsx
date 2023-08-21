import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'

import {
  For,
  Index,
  Match,
  Switch,
  createEffect,
  createRenderEffect,
  createSignal,
  on,
} from 'solid-js'
import { vi } from 'vitest'
import {
  QueryCache,
  QueryClientProvider,
  createInfiniteQuery,
  keepPreviousData,
} from '..'
import {
  Blink,
  createQueryClient,
  queryKey,
  setActTimeout,
  sleep,
} from './utils'

import type {
  CreateInfiniteQueryResult,
  InfiniteData,
  QueryFunctionContext,
} from '..'
import type { Mock } from 'vitest'

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
    const states: CreateInfiniteQueryResult<InfiniteData<number>>[] = []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 0,
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
      hasNextPage: false,
      hasPreviousPage: false,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isPending: true,
      isLoading: true,
      isInitialLoading: true,
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
      data: { pages: [0], pageParams: [0] },
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      fetchNextPage: expect.any(Function),
      fetchPreviousPage: expect.any(Function),
      hasNextPage: true,
      hasPreviousPage: false,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isPending: false,
      isLoading: false,
      isInitialLoading: false,
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

  it('should not throw when fetchNextPage returns an error', async () => {
    const key = queryKey()
    let noThrow: boolean

    function Page() {
      const start = 1
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          if (pageParam === 2) {
            throw new Error('error')
          }
          return Number(pageParam)
        },

        retry: 1,
        retryDelay: 10,
        initialPageParam: start,
        getNextPageParam: (lastPage) => lastPage + 1,
      }))

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

  it('should keep the previous data when placeholderData is set', async () => {
    const key = queryKey()
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<string>>>[] =
      []

    function Page() {
      const [order, setOrder] = createSignal('desc')

      const state = createInfiniteQuery(() => ({
        queryKey: [key, order()],
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return `${pageParam}-${order()}`
        },

        getNextPageParam: () => 1,
        initialPageParam: 0,
        placeholderData: keepPreviousData,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({
          data: state.data ? JSON.parse(JSON.stringify(state.data)) : undefined,
          hasNextPage: state.hasNextPage,
          hasPreviousPage: state.hasPreviousPage,
          isFetching: state.isFetching,
          isFetchingNextPage: state.isFetchingNextPage,
          isFetchingPreviousPage: state.isFetchingPreviousPage,
          isSuccess: state.isSuccess,
          isPlaceholderData: state.isPlaceholderData,
        })
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
      isPlaceholderData: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: ['0-desc'] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
    expect(states[2]).toMatchObject({
      data: { pages: ['0-desc'] },
      isFetching: true,
      isFetchingNextPage: true,
      isSuccess: true,
      isPlaceholderData: false,
    })
    expect(states[3]).toMatchObject({
      data: { pages: ['0-desc', '1-desc'] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
    // Set state
    expect(states[4]).toMatchObject({
      data: { pages: ['0-desc', '1-desc'] },
      isFetching: true,
      isFetchingNextPage: false,
      isSuccess: true,
      isPlaceholderData: true,
    })
    expect(states[5]).toMatchObject({
      data: { pages: ['0-asc'] },
      isFetching: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isPlaceholderData: false,
    })
  })

  it('should be able to select a part of the data', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<InfiniteData<string>>[] = []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: () => ({ count: 1 }),
        select: (data) => ({
          pages: data.pages.map((x) => `count: ${x.count}`),
          pageParams: data.pageParams,
        }),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
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
    const states: CreateInfiniteQueryResult<
      InfiniteData<{ count: number; id: number }>
    >[] = []
    let selectCalled = 0

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: () => ({ count: 1 }),
        select: (data: InfiniteData<{ count: number }>) => {
          selectCalled++
          return {
            pages: data.pages.map((x) => ({ ...x, id: Math.random() })),
            pageParams: data.pageParams,
          }
        },
        getNextPageParam: () => undefined,
        initialPageParam: 0,
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
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<number>>>[] =
      []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },

        select: (data) => ({
          pages: [...data.pages].reverse(),
          pageParams: [...data.pageParams].reverse(),
        }),
        notifyOnChangeProps: 'all',
        getNextPageParam: () => 1,
        initialPageParam: 0,
      }))

      createRenderEffect(
        on(
          () => ({ ...state }),
          () => {
            states.push({
              data: state.data
                ? JSON.parse(JSON.stringify(state.data))
                : undefined,
              isSuccess: state.isSuccess,
            })
          },
        ),
      )

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
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
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<number>>>[] =
      []

    function Page() {
      const start = 10
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },
        getNextPageParam: (lastPage) => lastPage + 1,
        getPreviousPageParam: (firstPage) => firstPage - 1,
        initialPageParam: start,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({
          data: state.data ? JSON.parse(JSON.stringify(state.data)) : undefined,
          hasNextPage: state.hasNextPage,
          hasPreviousPage: state.hasPreviousPage,
          isFetching: state.isFetching,
          isFetchingNextPage: state.isFetchingNextPage,
          isFetchingPreviousPage: state.isFetchingPreviousPage,
          isSuccess: state.isSuccess,
        })
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
      hasNextPage: false,
      hasPreviousPage: false,
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      hasNextPage: true,
      hasPreviousPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      data: { pages: [10] },
      hasNextPage: true,
      hasPreviousPage: true,
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: true,
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      data: { pages: [9, 10] },
      hasNextPage: true,
      hasPreviousPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isSuccess: true,
    })
  })

  it('should be able to refetch when providing page params automatically', async () => {
    const key = queryKey()
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<number>>>[] =
      []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },

        getPreviousPageParam: (firstPage) => firstPage - 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 10,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({
          data: state.data ? JSON.parse(JSON.stringify(state.data)) : undefined,
          isFetching: state.isFetching,
          isFetchingNextPage: state.isFetchingNextPage,
          isRefetching: state.isRefetching,
          isFetchingPreviousPage: state.isFetchingPreviousPage,
        })
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
      isRefetching: false,
    })
    // Initial fetch done
    expect(states[1]).toMatchObject({
      data: { pages: [10] },
      isFetching: false,
      isFetchingNextPage: false,
      isRefetching: false,
    })
    // Fetch next page
    expect(states[2]).toMatchObject({
      data: { pages: [10] },
      isFetching: true,
      isFetchingNextPage: true,
      isRefetching: false,
    })
    // Fetch next page done
    expect(states[3]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isRefetching: false,
    })
    // Fetch previous page
    expect(states[4]).toMatchObject({
      data: { pages: [10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: true,
      isRefetching: false,
    })
    // Fetch previous page done
    expect(states[5]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isRefetching: false,
    })
    // Refetch
    expect(states[6]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: true,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isRefetching: true,
    })
    // Refetch done
    expect(states[7]).toMatchObject({
      data: { pages: [9, 10, 11] },
      isFetching: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      isRefetching: false,
    })
  })

  it('should silently cancel any ongoing fetch when fetching more', async () => {
    const key = queryKey()
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<number>>>[] =
      []

    function Page() {
      const start = 10
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(50)
          return Number(pageParam)
        },

        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({
          hasNextPage: state.hasNextPage,
          data: state.data ? JSON.parse(JSON.stringify(state.data)) : undefined,
          isFetching: state.isFetching,
          isFetchingNextPage: state.isFetchingNextPage,
          isSuccess: state.isSuccess,
        })
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
      hasNextPage: false,
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
    const onAborts: Mock<any, any>[] = []
    const abortListeners: Mock<any, any>[] = []
    const fetchPage = vi.fn<
      [QueryFunctionContext<typeof key, number>],
      Promise<number>
    >(async ({ pageParam, signal }) => {
      const onAbort = vi.fn()
      const abortListener = vi.fn()
      onAborts.push(onAbort)
      abortListeners.push(abortListener)
      signal.onabort = onAbort
      signal.addEventListener('abort', abortListener)

      await sleep(50)
      return Number(pageParam)
    })

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: fetchPage,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      }))

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
    expect(firstCtx.pageParam).toEqual(start)
    expect(firstCtx.queryKey).toEqual(key)
    expect(firstCtx.signal).toBeInstanceOf(AbortSignal)
    expect(firstCtx.signal.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()

    callIndex = 1
    const secondCtx = fetchPage.mock.calls[callIndex]![0]
    expect(secondCtx.pageParam).toBe(11)
    expect(secondCtx.queryKey).toEqual(key)
    expect(secondCtx.signal).toBeInstanceOf(AbortSignal)
    expect(secondCtx.signal.aborted).toBe(true)
    expect(onAborts[callIndex]).toHaveBeenCalledTimes(1)
    expect(abortListeners[callIndex]).toHaveBeenCalledTimes(1)

    callIndex = 2
    const thirdCtx = fetchPage.mock.calls[callIndex]![0]
    expect(thirdCtx.pageParam).toBe(11)
    expect(thirdCtx.queryKey).toEqual(key)
    expect(thirdCtx.signal).toBeInstanceOf(AbortSignal)
    expect(thirdCtx.signal.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()
  })

  it('should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used ', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: Mock<any, any>[] = []
    const abortListeners: Mock<any, any>[] = []
    const fetchPage = vi.fn<
      [QueryFunctionContext<typeof key, number>],
      Promise<number>
    >(async ({ pageParam, signal }) => {
      const onAbort = vi.fn()
      const abortListener = vi.fn()
      onAborts.push(onAbort)
      abortListeners.push(abortListener)
      signal.onabort = onAbort
      signal.addEventListener('abort', abortListener)

      await sleep(50)
      return Number(pageParam)
    })

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: fetchPage,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      }))

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
    expect(firstCtx.pageParam).toEqual(start)
    expect(firstCtx.queryKey).toEqual(key)
    expect(firstCtx.signal).toBeInstanceOf(AbortSignal)
    expect(firstCtx.signal.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()

    callIndex = 1
    const secondCtx = fetchPage.mock.calls[callIndex]![0]
    expect(secondCtx.pageParam).toBe(11)
    expect(secondCtx.queryKey).toEqual(key)
    expect(secondCtx.signal).toBeInstanceOf(AbortSignal)
    expect(secondCtx.signal.aborted).toBe(false)
    expect(onAborts[callIndex]).not.toHaveBeenCalled()
    expect(abortListeners[callIndex]).not.toHaveBeenCalled()
  })

  it('should keep fetching first page when not loaded yet and triggering fetch more', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<InfiniteData<number>>[] = []

    function Page() {
      const start = 10
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(50)
          return Number(pageParam)
        },

        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
        notifyOnChangeProps: 'all',
      }))

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
      hasNextPage: false,
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
      createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam, signal: _ }) => {
          fetches++
          await sleep(50)
          return Number(pageParam) * 10
        },

        initialData,
        getNextPageParam: (_, allPages) => {
          return allPages.length === 4 ? undefined : allPages.length
        },
        initialPageParam: 0,
      }))

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
    expect(queryClient.getQueryState(key)).toMatchObject({
      data: initialData,
      status: 'success',
      error: null,
    })
  })

  it('should be able to set new pages with the query client', async () => {
    const key = queryKey()
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<number>>>[] =
      []

    function Page() {
      const [firstPage, setFirstPage] = createSignal(0)

      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },

        getNextPageParam: (lastPage) => lastPage + 1,
        notifyOnChangeProps: 'all',
        initialPageParam: firstPage(),
      }))

      createRenderEffect(() => {
        states.push({
          hasNextPage: state.hasNextPage,
          data: state.data ? JSON.parse(JSON.stringify(state.data)) : undefined,
          isFetching: state.isFetching,
          isFetchingNextPage: state.isFetchingNextPage,
          isSuccess: state.isSuccess,
        })
      })

      createEffect(() => {
        const { refetch } = state
        setActTimeout(() => {
          queryClient.setQueryData(key, { pages: [7, 8], pageParams: [7, 8] })
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
      hasNextPage: false,
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
    const states: Partial<CreateInfiniteQueryResult<InfiniteData<number>>>[] =
      []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: async ({ pageParam }): Promise<number> => {
          await sleep(10)
          return pageParam
        },

        initialData: { pages: [1], pageParams: [1] },
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 0,
        notifyOnChangeProps: 'all',
      }))

      createRenderEffect(() => {
        states.push({
          data: JSON.parse(JSON.stringify(state.data)),
          hasNextPage: state.hasNextPage,
          isFetching: state.isFetching,
          isFetchingNextPage: state.isFetchingNextPage,
          isSuccess: state.isSuccess,
        })
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
    const states: CreateInfiniteQueryResult<InfiniteData<number>>[] = []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
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
      data: undefined,
      hasNextPage: false,
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
    const states: CreateInfiniteQueryResult<InfiniteData<number>>[] = []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }): number => pageParam,
        initialPageParam: 10,
        initialData: { pages: [10], pageParams: [10] },
        getNextPageParam: (lastPage) => (lastPage === 10 ? 11 : undefined),
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
    const states: CreateInfiniteQueryResult<InfiniteData<number>>[] = []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }): number => pageParam,
        initialPageParam: 10,
        initialData: { pages: [10], pageParams: [10] },
        getNextPageParam: () => undefined,
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
    const states: CreateInfiniteQueryResult<InfiniteData<string>>[] = []

    function Page() {
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage === 1 ? 2 : undefined),
        select: (data) => ({
          pages: data.pages.map((x) => x.toString()),
          pageParams: data.pageParams,
        }),
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
      data: undefined,
      hasNextPage: false,
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
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          fetchItemsWithLimit(pageParam, fetchCountRef++),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextId,
      }))

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
                      queryClient.invalidateQueries({ queryKey: key })
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
            <Match when={state.status === 'pending'}>Loading...</Match>
            <Match when={state.status === 'error'}>
              <span>Error: {state.error?.message}</span>
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
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          fetchItems(
            pageParam,
            fetchCountRef++,
            pageParam === MAX || (pageParam === MAX - 1 && isRemovedLastPage()),
          ),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextId,
      }))

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
            <Match when={state.status === 'pending'}>Loading...</Match>
            <Match when={state.status === 'error'}>
              <span>Error: {state.error?.message}</span>
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
      const state = createInfiniteQuery(() => ({
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }))
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

  it('should use provided custom queryClient', async () => {
    const key = queryKey()
    const queryFn = () => {
      return Promise.resolve('custom client')
    }

    function Page() {
      const state = createInfiniteQuery(
        () => ({
          queryKey: key,
          queryFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
        () => queryClient,
      )
      return (
        <div>
          <h1>Status: {state.data?.pages[0]}</h1>
        </div>
      )
    }

    render(() => <Page />)

    await waitFor(() => screen.getByText('Status: custom client'))
  })
})
