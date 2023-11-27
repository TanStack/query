import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { QueryCache, keepPreviousData, useInfiniteQuery } from '..'
import {
  createQueryClient,
  queryKey,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import type {
  InfiniteData,
  QueryFunctionContext,
  UseInfiniteQueryResult,
} from '..'
import type { Mock } from 'vitest'

interface Result {
  items: Array<number>
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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 0,
      })
      states.push(state)
      return null
    }

    renderWithClient(queryClient, <Page />)

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
      isLoading: true,
      isPending: true,
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
      isLoading: false,
      isPending: false,
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
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          if (pageParam === 2) {
            throw new Error('error')
          }
          return Number(pageParam)
        },
        retry: 1,
        retryDelay: 10,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      })

      const { fetchNextPage } = state

      React.useEffect(() => {
        setActTimeout(() => {
          fetchNextPage()
            .then(() => {
              noThrow = true
            })
            .catch(() => undefined)
        }, 20)
      }, [fetchNextPage])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await waitFor(() => expect(noThrow).toBe(true))
  })

  it('should keep the previous data when placeholderData is set', async () => {
    const key = queryKey()
    const states: Array<UseInfiniteQueryResult<InfiniteData<string>>> = []

    function Page() {
      const [order, setOrder] = React.useState('desc')

      const state = useInfiniteQuery({
        queryKey: [key, order],
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return `${pageParam}-${order}`
        },
        getNextPageParam: () => 1,
        initialPageParam: 0,
        placeholderData: keepPreviousData,
        notifyOnChangeProps: 'all',
      })

      states.push(state)

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <button onClick={() => setOrder('asc')}>order</button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 0-desc'))
    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => rendered.getByText('data: 0-desc,1-desc'))
    fireEvent.click(rendered.getByRole('button', { name: /order/i }))

    await waitFor(() => rendered.getByText('data: 0-asc'))
    await waitFor(() => rendered.getByText('isFetching: false'))
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
    const states: Array<UseInfiniteQueryResult<InfiniteData<string>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: () => ({ count: 1 }),
        select: (data) => ({
          pages: data.pages.map((x) => `count: ${x.count}`),
          pageParams: data.pageParams,
        }),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      })
      states.push(state)

      return <div>{state.data?.pages.join(',')}</div>
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('count: 1')
    })

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
    const states: Array<
      UseInfiniteQueryResult<InfiniteData<{ count: number; id: number }>>
    > = []
    let selectCalled = 0

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: () => ({ count: 1 }),
        select: React.useCallback((data: InfiniteData<{ count: number }>) => {
          selectCalled++
          return {
            pages: data.pages.map((x) => ({ ...x, id: Math.random() })),
            pageParams: data.pageParams,
          }
        }, []),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      })
      states.push(state)

      return (
        <div>
          {state.data?.pages.map((page) => (
            <div key={page.id}>count: {page.count}</div>
          ))}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('count: 1')
    })

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
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
      })

      states.push(state)

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <div>data: {state.data?.pages.join(',') ?? 'null'}</div>
          <div>isFetching: {state.isFetching}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 0'))
    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => rendered.getByText('data: 1,0'))

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const start = 10
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },
        initialPageParam: start,
        getNextPageParam: (lastPage) => lastPage + 1,
        getPreviousPageParam: (firstPage) => firstPage - 1,
        notifyOnChangeProps: 'all',
      })

      states.push(state)

      return (
        <div>
          <div>data: {state.data?.pages.join(',') ?? null}</div>
          <button onClick={() => state.fetchPreviousPage()}>
            fetch previous page
          </button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => {
      rendered.getByText('data: 10')
    })

    fireEvent.click(
      rendered.getByRole('button', { name: /fetch previous page/i }),
    )

    await waitFor(() => {
      rendered.getByText('data: 9,10')
    })

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },
        initialPageParam: 10,
        getPreviousPageParam: (firstPage) => firstPage - 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        notifyOnChangeProps: 'all',
      })

      states.push(state)

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

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 10'))
    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => rendered.getByText('data: 10,11'))
    fireEvent.click(
      rendered.getByRole('button', { name: /fetchPreviousPage/i }),
    )
    await waitFor(() => rendered.getByText('data: 9,10,11'))
    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))

    await waitFor(() => rendered.getByText('isFetching: false'))
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

    function Page() {
      const start = 10
      const { data, fetchNextPage, refetch, status, fetchStatus } =
        useInfiniteQuery({
          queryKey: key,
          queryFn: async ({ pageParam }) => {
            await sleep(50)
            return Number(pageParam)
          },
          initialPageParam: start,
          getNextPageParam: (lastPage) => lastPage + 1,
        })

      return (
        <div>
          <button onClick={() => fetchNextPage()}>fetchNextPage</button>
          <button onClick={() => refetch()}>refetch</button>
          <div>data: {JSON.stringify(data)}</div>
          <div>
            status: {status}, {fetchStatus}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('status: success, idle'))
    await waitFor(() =>
      rendered.getByText('data: {"pages":[10],"pageParams":[10]}'),
    )

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await waitFor(() => rendered.getByText('status: success, fetching'))
    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))

    await waitFor(() => rendered.getByText('status: success, idle'))
    await waitFor(() =>
      rendered.getByText('data: {"pages":[10,11],"pageParams":[10,11]}'),
    )
  })

  it('should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: Array<Mock<any, any>> = []
    const abortListeners: Array<Mock<any, any>> = []
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
      const { fetchNextPage } = useInfiniteQuery({
        queryKey: key,
        queryFn: fetchPage,
        initialPageParam: start,
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      React.useEffect(() => {
        setActTimeout(() => {
          fetchNextPage()
        }, 100)
        setActTimeout(() => {
          fetchNextPage()
        }, 110)
      }, [fetchNextPage])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const onAborts: Array<Mock<any, any>> = []
    const abortListeners: Array<Mock<any, any>> = []
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
      const { fetchNextPage } = useInfiniteQuery({
        queryKey: key,
        queryFn: fetchPage,
        initialPageParam: start,
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      React.useEffect(() => {
        setActTimeout(() => {
          fetchNextPage()
        }, 100)
        setActTimeout(() => {
          fetchNextPage({ cancelRefetch: false })
        }, 110)
      }, [fetchNextPage])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const start = 10
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(50)
          return Number(pageParam)
        },
        initialPageParam: start,
        getNextPageParam: (lastPage) => lastPage + 1,
        notifyOnChangeProps: 'all',
      })

      states.push(state)

      const { fetchNextPage } = state

      React.useEffect(() => {
        setActTimeout(() => {
          fetchNextPage()
        }, 10)
      }, [fetchNextPage])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
      useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam, signal: _ }) => {
          fetches++
          await sleep(50)
          return Number(pageParam) * 10
        },
        initialData,
        initialPageParam: 0,
        getNextPageParam: (_, allPages) => {
          return allPages.length === 4 ? undefined : allPages.length
        },
      })

      return null
    }

    function Page() {
      const [show, setShow] = React.useState(true)

      React.useEffect(() => {
        setActTimeout(() => {
          setShow(false)
        }, 75)
      }, [])

      return show ? <List /> : null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const [firstPage, setFirstPage] = React.useState(0)

      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam)
        },
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: firstPage,
        notifyOnChangeProps: 'all',
      })

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        setActTimeout(() => {
          queryClient.setQueryData(key, { pages: [7, 8], pageParams: [7, 8] })
          setFirstPage(7)
        }, 20)

        setActTimeout(() => {
          refetch()
        }, 50)
      }, [refetch])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: async ({ pageParam }): Promise<number> => {
          await sleep(10)
          return pageParam
        },
        initialData: { pages: [1], pageParams: [1] },
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 0,
        notifyOnChangeProps: 'all',
      })

      states.push(state)

      const { fetchNextPage } = state

      React.useEffect(() => {
        setActTimeout(() => {
          fetchNextPage()
        }, 20)
      }, [fetchNextPage])

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        getNextPageParam: () => undefined,
        initialPageParam: 1,
      })

      states.push(state)

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }): number => pageParam,
        initialData: { pages: [10], pageParams: [10] },
        getNextPageParam: (lastPage) => (lastPage === 10 ? 11 : undefined),
        initialPageParam: 10,
      })

      states.push(state)

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }): number => pageParam,
        initialPageParam: 10,
        initialData: { pages: [10], pageParams: [10] },
        getNextPageParam: () => undefined,
      })

      states.push(state)

      return null
    }

    renderWithClient(queryClient, <Page />)

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
    const states: Array<UseInfiniteQueryResult<InfiniteData<string>>> = []

    function Page() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        getNextPageParam: (lastPage) => (lastPage === 1 ? 2 : undefined),
        select: (data) => ({
          pages: data.pages.map((x) => x.toString()),
          pageParams: data.pageParams,
        }),
        initialPageParam: 1,
      })

      states.push(state)

      return null
    }

    renderWithClient(queryClient, <Page />)

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
      const fetchCountRef = React.useRef(0)
      const {
        status,
        data,
        error,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
      } = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          fetchItemsWithLimit(pageParam, fetchCountRef.current++),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextId,
      })

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'pending' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data.pages.map((page, i) => (
                <div key={i}>
                  <div>
                    Page {i}: {page.ts}
                  </div>
                  <div key={i}>
                    {page.items.map((item) => (
                      <p key={item}>Item: {item}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <button
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                >
                  {isFetchingNextPage
                    ? 'Loading more...'
                    : hasNextPage
                      ? 'Load More'
                      : 'Nothing more to load'}
                </button>
                <button onClick={() => refetch()}>Refetch</button>
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
              <div>{!isFetchingNextPage ? 'Background Updating...' : null}</div>
            </>
          )}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('Loading...')

    await waitFor(() => rendered.getByText('Item: 2'))
    await waitFor(() => rendered.getByText('Page 0: 0'))

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))
    await waitFor(() => rendered.getByText('Item: 5'))
    await waitFor(() => rendered.getByText('Page 0: 0'))
    await waitFor(() => rendered.getByText('Page 1: 1'))

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))
    await waitFor(() => rendered.getByText('Item: 8'))
    await waitFor(() => rendered.getByText('Page 0: 0'))
    await waitFor(() => rendered.getByText('Page 1: 1'))
    await waitFor(() => rendered.getByText('Page 2: 2'))

    fireEvent.click(rendered.getByText('Refetch'))

    await waitFor(() => rendered.getByText('Background Updating...'))
    await waitFor(() => rendered.getByText('Item: 8'))
    await waitFor(() => rendered.getByText('Page 0: 3'))
    await waitFor(() => rendered.getByText('Page 1: 4'))
    await waitFor(() => rendered.getByText('Page 2: 5'))

    // ensure that Item: 4 is rendered before removing it
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(1)

    // remove Item: 4
    fireEvent.click(rendered.getByText('Remove item'))

    await waitFor(() => rendered.getByText('Background Updating...'))
    // ensure that an additional item is rendered (it means that cursors were properly rebuilt)
    await waitFor(() => rendered.getByText('Item: 9'))
    await waitFor(() => rendered.getByText('Page 0: 6'))
    await waitFor(() => rendered.getByText('Page 1: 7'))
    await waitFor(() => rendered.getByText('Page 2: 8'))

    // ensure that Item: 4 is no longer rendered
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(0)
  })

  it('should compute hasNextPage correctly for falsy getFetchMore return value on refetching', async () => {
    const key = queryKey()
    const MAX = 2

    function Page() {
      const fetchCountRef = React.useRef(0)
      const [isRemovedLastPage, setIsRemovedLastPage] =
        React.useState<boolean>(false)
      const {
        status,
        data,
        error,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
      } = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          fetchItems(
            pageParam,
            fetchCountRef.current++,
            pageParam === MAX || (pageParam === MAX - 1 && isRemovedLastPage),
          ),
        getNextPageParam: (lastPage) => lastPage.nextId,
        initialPageParam: 0,
      })

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'pending' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data.pages.map((page, i) => (
                <div key={i}>
                  <div>
                    Page {i}: {page.ts}
                  </div>
                  <div key={i}>
                    {page.items.map((item) => (
                      <p key={item}>Item: {item}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <button
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                >
                  {isFetchingNextPage
                    ? 'Loading more...'
                    : hasNextPage
                      ? 'Load More'
                      : 'Nothing more to load'}
                </button>
                <button onClick={() => refetch()}>Refetch</button>
                <button onClick={() => setIsRemovedLastPage(true)}>
                  Remove Last Page
                </button>
              </div>
              <div>
                {isFetching && !isFetchingNextPage
                  ? 'Background Updating...'
                  : null}
              </div>
            </>
          )}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    rendered.getByText('Loading...')

    await waitFor(() => {
      rendered.getByText('Item: 9')
      rendered.getByText('Page 0: 0')
    })

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))

    await waitFor(() => {
      rendered.getByText('Item: 19')
      rendered.getByText('Page 0: 0')
      rendered.getByText('Page 1: 1')
    })

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))

    await waitFor(() => {
      rendered.getByText('Item: 29')
      rendered.getByText('Page 0: 0')
      rendered.getByText('Page 1: 1')
      rendered.getByText('Page 2: 2')
    })

    rendered.getByText('Nothing more to load')

    fireEvent.click(rendered.getByText('Remove Last Page'))

    await sleep(10)

    fireEvent.click(rendered.getByText('Refetch'))

    await waitFor(() => rendered.getByText('Background Updating...'))

    await waitFor(() => {
      rendered.getByText('Page 0: 3')
      rendered.getByText('Page 1: 4')
    })

    expect(rendered.queryByText('Item: 29')).toBeNull()
    expect(rendered.queryByText('Page 2: 5')).toBeNull()

    rendered.getByText('Nothing more to load')
  })

  it('should cancel the query function when there are no more subscriptions', async () => {
    const key = queryKey()
    let cancelFn: Mock = vi.fn()

    const queryFn = ({ signal }: { signal?: AbortSignal }) => {
      const promise = new Promise<string>((resolve, reject) => {
        cancelFn = vi.fn(() => reject('Cancelled'))
        signal?.addEventListener('abort', cancelFn)
        sleep(1000).then(() => resolve('OK'))
      })

      return promise
    }

    function Inner() {
      const state = useInfiniteQuery({
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      })
      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    function Page() {
      const [isVisible, setIsVisible] = React.useState(true)

      return (
        <>
          <button onClick={() => setIsVisible(false)}>hide</button>
          {isVisible && <Inner />}
          <div>{isVisible ? 'visible' : 'hidden'}</div>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('visible'))

    fireEvent.click(rendered.getByRole('button', { name: 'hide' }))

    await waitFor(() => rendered.getByText('hidden'))

    expect(cancelFn).toHaveBeenCalled()
  })

  it('should use provided custom queryClient', async () => {
    const key = queryKey()
    const queryFn = async () => {
      return Promise.resolve('custom client')
    }

    function Page() {
      const { data } = useInfiniteQuery(
        {
          queryKey: key,
          queryFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        },
        queryClient,
      )

      return <div>data: {data?.pages[0]}</div>
    }

    const rendered = render(<Page></Page>)

    await waitFor(() => rendered.getByText('data: custom client'))
  })
})
