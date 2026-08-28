// Legacy useInfiniteQuery suite ported to the 2.0 read layer: `data` is an
// async read (first load suspends into <Loading>, page fetches and refetches
// hold committed pages), metadata reads never suspend, and the pager surface
// (fetchNextPage / hasNextPage / direction flags) derives from cache state.
// State-array notification sequences from the v5 observer model are replaced
// with DOM and getter assertions; see port-notes/useInfiniteQuery.md.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'

import { For, Loading, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
} from '..'
import { Blink, renderWithClient, setActTimeout } from './utils'
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

describe('useInfiniteQuery', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    let state!: UseInfiniteQueryResult<InfiniteData<number>>

    function Page() {
      state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 0,
      }))
      return <span>pages: {state.data.pages.join(',')}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    // First fetch in flight: the data read suspends into the boundary while
    // every metadata getter stays readable without suspending.
    expect(rendered.getByText('loading')).toBeInTheDocument()
    expect(state.status).toBe('pending')
    expect(state.fetchStatus).toBe('fetching')
    expect(state.isPending).toBe(true)
    expect(state.isLoading).toBe(true)
    expect(state.isFetching).toBe(true)
    expect(state.isSuccess).toBe(false)
    expect(state.isError).toBe(false)
    expect(state.error).toBeNull()
    expect(state.isFetched).toBe(false)
    expect(state.isFetchedAfterMount).toBe(false)
    expect(state.isPaused).toBe(false)
    expect(state.isEnabled).toBe(true)
    expect(state.isStale).toBe(true)
    expect(state.isPlaceholderData).toBe(false)
    expect(state.hasNextPage).toBe(false)
    expect(state.hasPreviousPage).toBe(false)
    expect(state.isFetchingNextPage).toBe(false)
    expect(state.isFetchingPreviousPage).toBe(false)
    expect(state.isFetchNextPageError).toBe(false)
    expect(state.isFetchPreviousPageError).toBe(false)
    expect(state.isRefetching).toBe(false)
    expect(state.isRefetchError).toBe(false)
    expect(state.isLoadingError).toBe(false)
    expect(state.dataUpdatedAt).toBe(0)
    expect(state.errorUpdatedAt).toBe(0)
    expect(state.failureCount).toBe(0)
    expect(state.failureReason).toBeNull()
    expect(state.errorUpdateCount).toBe(0)
    expect(state.fetchNextPage).toEqual(expect.any(Function))
    expect(state.fetchPreviousPage).toEqual(expect.any(Function))
    expect(state.refetch).toEqual(expect.any(Function))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('pages: 0')).toBeInTheDocument()

    // Settled: guard-free data plus success metadata.
    expect(state.data).toEqual({ pages: [0], pageParams: [0] })
    expect(state.status).toBe('success')
    expect(state.fetchStatus).toBe('idle')
    expect(state.isPending).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.isFetching).toBe(false)
    expect(state.isSuccess).toBe(true)
    expect(state.isError).toBe(false)
    expect(state.isFetched).toBe(true)
    expect(state.isFetchedAfterMount).toBe(true)
    expect(state.hasNextPage).toBe(true)
    expect(state.hasPreviousPage).toBe(false)
    expect(state.isFetchingNextPage).toBe(false)
    expect(state.isFetchingPreviousPage).toBe(false)
    expect(state.isRefetching).toBe(false)
    expect(state.dataUpdatedAt).toEqual(expect.any(Number))
    expect(state.dataUpdatedAt).toBeGreaterThan(0)
  })

  it('should not throw when fetchNextPage returns an error', async () => {
    const key = queryKey()
    let noThrow = false

    function Page() {
      const start = 1
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => {
            if (pageParam === 2) throw new Error('error')
            return pageParam
          }),
        retry: 1,
        retryDelay: 10,
        initialPageParam: start,
        getNextPageParam: (lastPage) => lastPage + 1,
      }))

      setActTimeout(() => {
        state
          .fetchNextPage()
          .then(() => {
            noThrow = true
          })
          .catch(() => undefined)
      }, 20)

      return null
    }

    renderWithClient(queryClient, () => (
      <Loading>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(50)

    expect(noThrow).toBe(true)
  })

  it('should keep the previous data when placeholderData is set', async () => {
    // In the 2.0 adapter the async data node natively holds the committed
    // value while the new key's fetch is in flight — `keepPreviousData` is
    // accepted but the hold is the platform behavior, not a placeholder.
    const key = queryKey()

    function Page() {
      const [order, setOrder] = createSignal('desc')

      const state = useInfiniteQuery(() => ({
        queryKey: [key, order()],
        // Fetch inputs come from the queryKey, not closure reads: the
        // key-switch fetch resolves during a transition hold, where an
        // untracked `order()` read returns the committed (old) value.
        queryFn: ({ pageParam, queryKey: [, keyOrder] }) =>
          sleep(10).then(() => `${pageParam}-${keyOrder}`),
        getNextPageParam: () => 1,
        initialPageParam: 0,
        placeholderData: keepPreviousData,
      }))

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <button onClick={() => setOrder('asc')}>order</button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 0-desc')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 0-desc,1-desc')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /order/i }))
    await vi.advanceTimersByTimeAsync(5)
    // New key's first fetch in flight: previous pages stay visible, no
    // fallback, and the background fetch is observable.
    expect(rendered.getByText('data: 0-desc,1-desc')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('isFetching: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('data: 0-asc')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
  })

  it('should be able to select a part of the data', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ count: 1 })),
        select: (data) => ({
          pages: data.pages.map((x) => `count: ${x.count}`),
          pageParams: data.pageParams,
        }),
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      }))

      return <span>{state.data.pages.join(',')}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
  })

  it('should be able to select a new result and not cause infinite renders', async () => {
    const key = queryKey()
    let selectCalled = 0

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ count: 1 })),
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

      return <span>count: {state.data.pages[0]!.count}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

    // Unstable select identity must not spin the graph: give it time to
    // (wrongly) loop and confirm the call count stays bounded.
    await vi.advanceTimersByTimeAsync(100)
    expect(selectCalled).toBeGreaterThanOrEqual(1)
    expect(selectCalled).toBeLessThanOrEqual(3)
  })

  it('should be able to reverse the data', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        select: (data) => ({
          pages: [...data.pages].reverse(),
          pageParams: [...data.pageParams].reverse(),
        }),
        getNextPageParam: () => 1,
        initialPageParam: 0,
      }))

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <div>data: {state.data.pages.join(',')}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1,0')).toBeInTheDocument()
  })

  it('should be able to fetch a previous page', async () => {
    const key = queryKey()

    function Page() {
      const start = 10
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        getPreviousPageParam: (firstPage) => firstPage - 1,
        initialPageParam: start,
      }))

      return (
        <div>
          <button onClick={() => state.fetchPreviousPage()}>
            fetchPreviousPage
          </button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>
            hasNext: {String(state.hasNextPage)}, hasPrev:{' '}
            {String(state.hasPreviousPage)}
          </div>
          <div>
            fetchingPrev: {String(state.isFetchingPreviousPage)}, fetchingNext:{' '}
            {String(state.isFetchingNextPage)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(
      rendered.getByText('hasNext: true, hasPrev: true'),
    ).toBeInTheDocument()

    fireEvent.click(
      rendered.getByRole('button', { name: /fetchPreviousPage/i }),
    )
    await vi.advanceTimersByTimeAsync(0)
    // Previous-page fetch in flight: committed page holds, direction is
    // observable and scoped to the backward flag only.
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(
      rendered.getByText('fetchingPrev: true, fetchingNext: false'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 9,10')).toBeInTheDocument()
    expect(
      rendered.getByText('fetchingPrev: false, fetchingNext: false'),
    ).toBeInTheDocument()
  })

  it('should be able to refetch when providing page params automatically', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        getPreviousPageParam: (firstPage) => firstPage - 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 10,
      }))

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <button onClick={() => state.fetchPreviousPage()}>
            fetchPreviousPage
          </button>
          <button onClick={() => state.refetch()}>refetch</button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>
            fetchingNext: {String(state.isFetchingNextPage)}, fetchingPrev:{' '}
            {String(state.isFetchingPreviousPage)}, refetching:{' '}
            {String(state.isRefetching)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText(
        'fetchingNext: true, fetchingPrev: false, refetching: false',
      ),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10,11')).toBeInTheDocument()

    fireEvent.click(
      rendered.getByRole('button', { name: /fetchPreviousPage/i }),
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText(
        'fetchingNext: false, fetchingPrev: true, refetching: false',
      ),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 9,10,11')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /^refetch/i }))
    await vi.advanceTimersByTimeAsync(0)
    // A full refetch reports as a refetch, not a page fetch, and holds the
    // committed pages while all page params are replayed.
    expect(
      rendered.getByText(
        'fetchingNext: false, fetchingPrev: false, refetching: true',
      ),
    ).toBeInTheDocument()
    expect(rendered.getByText('data: 9,10,11')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(30)
    expect(rendered.getByText('data: 9,10,11')).toBeInTheDocument()
    expect(
      rendered.getByText(
        'fetchingNext: false, fetchingPrev: false, refetching: false',
      ),
    ).toBeInTheDocument()
  })

  it('should return the correct states when refetch fails', async () => {
    const key = queryKey()
    let isRefetch = false

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => {
            if (isRefetch) throw new Error()
            return pageParam
          }),
        getPreviousPageParam: (firstPage) => firstPage - 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 10,
        retry: false,
      }))

      return (
        <div>
          <button
            onClick={() => {
              isRefetch = true
              state.refetch()
            }}
          >
            refetch
          </button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>status: {state.status}</div>
          <div>
            refetchError: {String(state.isRefetchError)}, nextError:{' '}
            {String(state.isFetchNextPageError)}, prevError:{' '}
            {String(state.isFetchPreviousPageError)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
    await vi.advanceTimersByTimeAsync(10)
    // Committed pages keep serving; the failure is a refetch error, not a
    // page-fetch error, and does not crash into a boundary.
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('status: error')).toBeInTheDocument()
    expect(
      rendered.getByText(
        'refetchError: true, nextError: false, prevError: false',
      ),
    ).toBeInTheDocument()
  })

  it('should return the correct states when fetchNextPage fails', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => {
            if (pageParam !== 10) throw new Error()
            return pageParam
          }),
        getPreviousPageParam: (firstPage) => firstPage - 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 10,
        retry: false,
      }))

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>status: {state.status}</div>
          <div>
            refetchError: {String(state.isRefetchError)}, nextError:{' '}
            {String(state.isFetchNextPageError)}, prevError:{' '}
            {String(state.isFetchPreviousPageError)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('status: error')).toBeInTheDocument()
    expect(
      rendered.getByText(
        'refetchError: false, nextError: true, prevError: false',
      ),
    ).toBeInTheDocument()
  })

  it('should return the correct states when fetchPreviousPage fails', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => {
            if (pageParam !== 10) throw new Error()
            return pageParam
          }),
        getPreviousPageParam: (firstPage) => firstPage - 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 10,
        retry: false,
      }))

      return (
        <div>
          <button onClick={() => state.fetchPreviousPage()}>
            fetchPreviousPage
          </button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>status: {state.status}</div>
          <div>
            refetchError: {String(state.isRefetchError)}, nextError:{' '}
            {String(state.isFetchNextPageError)}, prevError:{' '}
            {String(state.isFetchPreviousPageError)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()

    fireEvent.click(
      rendered.getByRole('button', { name: /fetchPreviousPage/i }),
    )
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('status: error')).toBeInTheDocument()
    expect(
      rendered.getByText(
        'refetchError: false, nextError: false, prevError: true',
      ),
    ).toBeInTheDocument()
  })

  it('should silently cancel any ongoing fetch when fetching more', async () => {
    const key = queryKey()
    let state!: UseInfiniteQueryResult<InfiniteData<number>>

    function Page() {
      const start = 10
      state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(50).then(() => pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      }))

      return (
        <div>
          <div>data: {state.data.pages.join(',')}</div>
          <div>
            fetchingNext: {String(state.isFetchingNextPage)}, refetching:{' '}
            {String(state.isRefetching)}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()

    void state.refetch()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('fetchingNext: false, refetching: true'),
    ).toBeInTheDocument()

    // fetchNextPage cancels the in-flight refetch and takes over. The
    // committed UI is frozen by the in-progress hold (updates during a hold
    // commit atomically at settle), so the direction handoff is asserted
    // through untracked getter reads, which see current cache state.
    void state.fetchNextPage()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.isFetchingNextPage).toBe(true)
    expect(state.isRefetching).toBe(false)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText('data: 10,11')).toBeInTheDocument()
    expect(
      rendered.getByText('fetchingNext: false, refetching: false'),
    ).toBeInTheDocument()
  })

  it('should silently cancel an ongoing fetchNextPage request when another fetchNextPage is invoked', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: Array<Mock<(...args: Array<any>) => any>> = []
    const abortListeners: Array<Mock<(...args: Array<any>) => any>> = []
    const fetchPage = vi.fn<
      (context: QueryFunctionContext<typeof key, number>) => Promise<number>
    >(async ({ pageParam, signal }) => {
      const onAbort = vi.fn()
      const abortListener = vi.fn()
      onAborts.push(onAbort)
      abortListeners.push(abortListener)
      signal.onabort = onAbort
      signal.addEventListener('abort', abortListener)

      await sleep(50)
      return pageParam
    })

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: fetchPage,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      }))

      setActTimeout(() => {
        state.fetchNextPage()
      }, 100)
      setActTimeout(() => {
        state.fetchNextPage()
      }, 110)

      return null
    }

    renderWithClient(queryClient, () => (
      <Loading>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(160)

    const expectedCallCount = 3
    expect(fetchPage).toHaveBeenCalledTimes(expectedCallCount)
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

  it('should not cancel an ongoing fetchNextPage request when another fetchNextPage is invoked if `cancelRefetch: false` is used', async () => {
    const key = queryKey()
    const start = 10
    const onAborts: Array<Mock<(...args: Array<any>) => any>> = []
    const abortListeners: Array<Mock<(...args: Array<any>) => any>> = []
    const fetchPage = vi.fn<
      (context: QueryFunctionContext<typeof key, number>) => Promise<number>
    >(async ({ pageParam, signal }) => {
      const onAbort = vi.fn()
      const abortListener = vi.fn()
      onAborts.push(onAbort)
      abortListeners.push(abortListener)
      signal.onabort = onAbort
      signal.addEventListener('abort', abortListener)

      await sleep(50)
      return pageParam
    })

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: fetchPage,
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      }))

      setActTimeout(() => {
        state.fetchNextPage()
      }, 100)
      setActTimeout(() => {
        state.fetchNextPage({ cancelRefetch: false })
      }, 110)

      return null
    }

    renderWithClient(queryClient, () => (
      <Loading>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(160)

    const expectedCallCount = 2
    expect(fetchPage).toHaveBeenCalledTimes(expectedCallCount)
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
    let state!: UseInfiniteQueryResult<InfiniteData<number>>

    function Page() {
      const start = 10
      state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(50).then(() => pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: start,
      }))

      return <div>data: {state.data.pages.join(',')}</div>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    // fetchNextPage while the first load is still in flight keeps fetching
    // the first page — no extra page is appended.
    void state.fetchNextPage()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(30)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(state.data).toEqual({ pages: [10], pageParams: [10] })
    expect(state.hasNextPage).toBe(true)
  })

  it('should stop fetching additional pages when the component is unmounted and AbortSignal is consumed', async () => {
    const key = queryKey()
    let fetches = 0

    const initialData = { pages: [1, 2, 3, 4], pageParams: [0, 1, 2, 3] }

    function List() {
      useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(50).then(() => {
            fetches++
            return pageParam * 10
          }),
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

      setActTimeout(() => {
        setShow(false)
      }, 75)

      return <>{show() ? <List /> : null}</>
    }

    renderWithClient(queryClient, () => (
      <Loading>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(125)

    expect(fetches).toBe(2)
    expect(queryClient.getQueryState(key)).toMatchObject({
      data: initialData,
      status: 'success',
      error: null,
    })
  })

  it('should be able to set new pages with the query client', async () => {
    const key = queryKey()
    let state!: UseInfiniteQueryResult<InfiniteData<number>>

    function Page() {
      const [firstPage, setFirstPage] = createSignal(0)

      state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: firstPage(),
      }))

      setActTimeout(() => {
        queryClient.setQueryData(key, { pages: [7, 8], pageParams: [7, 8] })
        setFirstPage(7)
      }, 20)

      return (
        <div>
          <div>data: {state.data.pages.join(',')}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 0')).toBeInTheDocument()

    // setQueryData replaces the pages reactively without a fetch.
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 7,8')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()

    // A refetch replays both stored page params and lands the same pages.
    void state.refetch()
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('isFetching: true')).toBeInTheDocument()
    expect(rendered.getByText('data: 7,8')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('data: 7,8')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
  })

  it('should only refetch the first page when initialData is provided', async () => {
    const key = queryKey()
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      sleep(10).then(() => pageParam),
    )

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn,
        initialData: { pages: [1], pageParams: [1] },
        getNextPageParam: (lastPage) => lastPage + 1,
        initialPageParam: 0,
      }))

      return (
        <div>
          <button onClick={() => state.fetchNextPage()}>fetchNextPage</button>
          <div>data: {state.data.pages.join(',')}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    // initialData renders immediately while the mount refetch runs.
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
    // The mount refetch replays only the single stored page param.
    expect(queryFn).toHaveBeenCalledTimes(1)

    fireEvent.click(rendered.getByRole('button', { name: /fetchNextPage/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should set hasNextPage to false if getNextPageParam returns undefined', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }))

      return (
        <div>
          <div>data: {state.data.pages.join(',')}</div>
          <div>hasNextPage: {String(state.hasNextPage)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('hasNextPage: false')).toBeInTheDocument()
  })

  it('should compute hasNextPage correctly using initialData', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        initialPageParam: 10,
        initialData: { pages: [10], pageParams: [10] },
        getNextPageParam: (lastPage) => (lastPage === 10 ? 11 : undefined),
      }))

      return (
        <div>
          <div>data: {state.data.pages.join(',')}</div>
          <div>hasNextPage: {String(state.hasNextPage)}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    // hasNextPage is computable from initialData before the mount refetch
    // settles.
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('hasNextPage: true')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('hasNextPage: true')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
  })

  it('should compute hasNextPage correctly for falsy getFetchMore return value using initialData', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        initialPageParam: 10,
        initialData: { pages: [10], pageParams: [10] },
        getNextPageParam: () => undefined,
      }))

      return (
        <div>
          <div>data: {state.data.pages.join(',')}</div>
          <div>hasNextPage: {String(state.hasNextPage)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('hasNextPage: false')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 10')).toBeInTheDocument()
    expect(rendered.getByText('hasNextPage: false')).toBeInTheDocument()
  })

  it('should not use selected data when computing hasNextPage', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) => sleep(10).then(() => pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage === 1 ? 2 : undefined),
        select: (data) => ({
          pages: data.pages.map((x) => x.toString()),
          pageParams: data.pageParams,
        }),
      }))

      return (
        <div>
          <div>data: {state.data.pages.join(',')}</div>
          <div>hasNextPage: {String(state.hasNextPage)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('hasNextPage: true')).toBeInTheDocument()
  })

  it('should build fresh cursors on refetch', async () => {
    const key = queryKey()

    const genItems = (size: number) =>
      [...new Array(size)].fill(null).map((_, d) => d)
    const items = genItems(15)
    const limit = 3

    const fetchItemsWithLimit = (cursor = 0, ts: number) =>
      sleep(10).then(() => ({
        nextId: cursor + limit,
        items: items.slice(cursor, cursor + limit),
        ts,
      }))

    function Page() {
      let fetchCountRef = 0
      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          fetchItemsWithLimit(pageParam, fetchCountRef++),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextId,
      }))

      return (
        <div>
          <h1>Pagination</h1>
          <div>Data:</div>
          <For each={state.data.pages}>
            {(page, i) => (
              <div>
                <div>
                  Page {i()}: {page.ts}
                </div>
                <div>
                  <For each={page.items}>{(item) => <p>Item: {item}</p>}</For>
                </div>
              </div>
            )}
          </For>
          <div>
            <button
              onClick={() => state.fetchNextPage()}
              disabled={!state.hasNextPage || state.isFetchingNextPage}
            >
              {state.isFetchingNextPage
                ? 'Loading more...'
                : state.hasNextPage
                  ? 'Load More'
                  : 'Nothing more to load'}
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
          <div>{state.isRefetching ? 'Background Updating...' : null}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>Loading...</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Item: 2')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('Load More'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Loading more...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Item: 5')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 0')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('Load More'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Loading more...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Item: 8')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 0')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 1')).toBeInTheDocument()
    expect(rendered.getByText('Page 2: 2')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('Refetch'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Background Updating...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(30)
    expect(rendered.getByText('Item: 8')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 3')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 4')).toBeInTheDocument()
    expect(rendered.getByText('Page 2: 5')).toBeInTheDocument()

    // ensure that Item: 4 is rendered before removing it
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(1)

    // remove Item: 4
    fireEvent.click(rendered.getByText('Remove item'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Background Updating...')).toBeInTheDocument()
    // ensure that an additional item is rendered (it means that cursors were properly rebuilt)
    await vi.advanceTimersByTimeAsync(30)
    expect(rendered.getByText('Item: 9')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 6')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 7')).toBeInTheDocument()
    expect(rendered.getByText('Page 2: 8')).toBeInTheDocument()

    // ensure that Item: 4 is no longer rendered
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(0)
  })

  it('should compute hasNextPage correctly for falsy getFetchMore return value on refetching', async () => {
    const key = queryKey()
    const MAX = 2

    function Page() {
      let fetchCountRef = 0
      const [isRemovedLastPage, setIsRemovedLastPage] =
        createSignal<boolean>(false)

      const state = useInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }): Promise<Result> => {
          const noNext =
            pageParam === MAX || (pageParam === MAX - 1 && isRemovedLastPage())
          return sleep(10).then(() => ({
            items: [...new Array(10)]
              .fill(null)
              .map((_, d) => pageParam * pageSize + d),
            nextId: noNext ? undefined : pageParam + 1,
            prevId: pageParam - 1,
            ts: fetchCountRef++,
          }))
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextId,
      }))

      return (
        <div>
          <h1>Pagination</h1>
          <div>Data:</div>
          <For each={state.data.pages}>
            {(page, i) => (
              <div>
                <div>
                  Page {i()}: {page.ts}
                </div>
                <div>
                  <For each={page.items}>{(item) => <p>Item: {item}</p>}</For>
                </div>
              </div>
            )}
          </For>
          <div>
            <button
              onClick={() => state.fetchNextPage()}
              disabled={!state.hasNextPage || state.isFetchingNextPage}
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
          <div>{state.isRefetching ? 'Background Updating...' : null}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>Loading...</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Item: 9')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('Load More'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Loading more...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Item: 19')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 0')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('Load More'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Loading more...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Item: 29')).toBeInTheDocument()
    expect(rendered.getByText('Page 0: 0')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 1')).toBeInTheDocument()
    expect(rendered.getByText('Page 2: 2')).toBeInTheDocument()
    expect(rendered.getByText('Nothing more to load')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('Remove Last Page'))
    // Commit the signal write before the refetch dispatches: otherwise the
    // write joins the refetch's transition hold and the queryFn reads the
    // stale value for the whole refetch.
    await vi.advanceTimersByTimeAsync(0)
    fireEvent.click(rendered.getByText('Refetch'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('Background Updating...')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('Page 0: 3')).toBeInTheDocument()
    expect(rendered.getByText('Page 1: 4')).toBeInTheDocument()
    expect(rendered.getByText('Nothing more to load')).toBeInTheDocument()
    expect(rendered.queryByText('Item: 29')).toBeNull()
    expect(rendered.queryByText('Page 2: 5')).toBeNull()
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
      const state = useInfiniteQuery(() => ({
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

    const rendered = renderWithClient(queryClient, () => (
      <Loading>
        <Blink duration={5}>
          <Page />
        </Blink>
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('off')).toBeInTheDocument()

    expect(cancelFn).toHaveBeenCalled()
  })

  it('should use provided custom queryClient', async () => {
    const key = queryKey()

    function Page() {
      const state = useInfiniteQuery(
        () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'custom client'),
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        }),
        () => queryClient,
      )
      return (
        <div>
          <h1>Status: {state.data.pages[0]}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <Loading>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Status: custom client')).toBeInTheDocument()
  })

  it('should work with infiniteQueryOptions', async () => {
    const key = queryKey()

    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 220),
      getNextPageParam: () => undefined,
      initialPageParam: 0,
    })

    function Page() {
      const state = useInfiniteQuery(
        () => options,
        () => queryClient,
      )
      return (
        <div>
          <h1>Status: {state.data.pages[0]}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <Loading>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Status: 220')).toBeInTheDocument()
  })
})
