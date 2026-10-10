import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { CancelledError, InfiniteQueryObserver, QueryClient } from '..'
import { infiniteQueryBehavior } from '../infiniteQueryBehavior'
import type { InfiniteData, InfiniteQueryObserverResult, QueryCache } from '..'

describe('InfiniteQueryBehavior', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should throw an error if the queryFn is not defined', async () => {
    const key = queryKey()

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      retry: false,
      initialPageParam: 1,
      getNextPageParam: () => 2,
    })

    let observerResult:
      InfiniteQueryObserverResult<unknown, unknown> | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })
    await vi.advanceTimersByTimeAsync(0)
    const query = queryCache.find({ queryKey: key })!
    expect(observerResult).toMatchObject({
      isError: true,
      error: new Error(`Missing queryFn: '${query.queryHash}'`),
    })

    unsubscribe()
  })

  it('should apply the maxPages option to limit the number of pages', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    const queryFnSpy = vi.fn().mockImplementation(({ pageParam, signal }) => {
      abortSignal = signal
      return pageParam
    })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
      maxPages: 2,
      initialPageParam: 1,
    })

    let observerResult:
      InfiniteQueryObserverResult<unknown, unknown> | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await vi.advanceTimersByTimeAsync(0)
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1], pageParams: [1] },
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 1,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    queryFnSpy.mockClear()

    // Fetch the second page
    await observer.fetchNextPage()
    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 2,
      direction: 'forward',
      meta: undefined,
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1, 2], pageParams: [1, 2] },
    })

    queryFnSpy.mockClear()

    // Fetch the page before the first page
    await observer.fetchPreviousPage()
    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 0,
      direction: 'backward',
      meta: undefined,
      signal: abortSignal,
    })

    // Only first two pages should be in the data
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [0, 1], pageParams: [0, 1] },
    })

    queryFnSpy.mockClear()

    // Fetch the page before
    await observer.fetchPreviousPage()
    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: -1,
      meta: undefined,
      direction: 'backward',
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [-1, 0], pageParams: [-1, 0] },
    })

    queryFnSpy.mockClear()

    // Fetch the page after
    await observer.fetchNextPage()
    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 1,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [0, 1] },
    })

    queryFnSpy.mockClear()

    // Refetch the infinite query
    await observer.refetch()

    // Only 2 pages should refetch
    expect(queryFnSpy).toHaveBeenCalledTimes(2)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 0,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(2, {
      queryKey: key,
      client: queryClient,
      pageParam: 1,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    unsubscribe()
  })

  it('should apply manual page params and reuse them on refetch', async () => {
    const key = queryKey()

    const queryFn = vi.fn().mockImplementation(({ pageParam }) => {
      return pageParam
    })

    const observer = new InfiniteQueryObserver<
      number,
      Error,
      InfiniteData<number>,
      typeof key,
      number,
      'manual'
    >(queryClient, {
      queryKey: key,
      queryFn,
      mode: 'manual',
      initialPageParam: 0,
    })

    let observerResult:
      | InfiniteQueryObserverResult<
          InfiniteData<number>,
          Error,
          number,
          'manual'
        >
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await vi.waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [0], pageParams: [0] },
      }),
    )

    queryFn.mockClear()

    // Fetch the next page using pageParam
    await observer.fetchNextPage({ pageParam: 1 })

    expect(queryFn).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 1,
      meta: undefined,
      client: queryClient,
      direction: 'forward',
      signal: expect.anything(),
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [0, 1], pageParams: [0, 1] },
    })

    queryFn.mockClear()

    // Fetch the previous page using pageParam
    await observer.fetchPreviousPage({ pageParam: -1 })

    expect(queryFn).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: -1,
      meta: undefined,
      client: queryClient,
      direction: 'backward',
      signal: expect.anything(),
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [-1, 0, 1], pageParams: [-1, 0, 1] },
    })

    queryFn.mockClear()

    // Refetch pages: old manual page params should be used
    await observer.refetch()

    expect(queryFn).toHaveBeenCalledTimes(3)

    expect(queryFn).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: -1,
      meta: undefined,
      client: queryClient,
      direction: 'forward',
      signal: expect.anything(),
    })

    expect(queryFn).toHaveBeenNthCalledWith(2, {
      queryKey: key,
      pageParam: 0,
      meta: undefined,
      client: queryClient,
      direction: 'forward',
      signal: expect.anything(),
    })

    expect(queryFn).toHaveBeenNthCalledWith(3, {
      queryKey: key,
      pageParam: 1,
      meta: undefined,
      client: queryClient,
      direction: 'forward',
      signal: expect.anything(),
    })

    unsubscribe()
  })

  it('should ignore page overrides in declarative mode', async () => {
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => pageParam,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
    })

    await observer.refetch()
    // @ts-expect-error page overrides require manual mode
    await observer.fetchNextPage({ pageParam: 100 })
    // @ts-expect-error page overrides require manual mode
    await observer.fetchPreviousPage({ pageParam: -100 })

    expect(observer.getCurrentResult().data).toEqual({
      pages: [-1, 0, 1],
      pageParams: [-1, 0, 1],
    })
  })

  it.each(['forward', 'backward'] as const)(
    'should use a manual page param on the first %s fetch',
    async (direction) => {
      const queryFn = vi.fn(({ pageParam }: { pageParam: number }) => pageParam)
      const observer = new InfiniteQueryObserver(queryClient, {
        queryKey: queryKey(),
        queryFn,
        initialPageParam: 0,
        mode: 'manual',
        enabled: false,
      })

      const result =
        direction === 'forward'
          ? await observer.fetchNextPage({ pageParam: 5 })
          : await observer.fetchPreviousPage({ pageParam: 5 })

      expect(result.data).toEqual({ pages: [5], pageParams: [5] })
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ pageParam: 5, direction }),
      )
    },
  )

  it('should preserve null and undefined manual page params on refetch', async () => {
    const getInitialPageParam = (): number | null | undefined => 0
    const queryFn = vi.fn(
      ({ pageParam }: { pageParam: number | null | undefined }) => ({
        pageParam,
      }),
    )
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      queryFn,
      initialPageParam: getInitialPageParam(),
      mode: 'manual',
    })

    await observer.refetch()
    await observer.fetchNextPage({ pageParam: null })
    await observer.fetchNextPage({ pageParam: undefined })
    await observer.fetchPreviousPage({ pageParam: -1 })
    queryFn.mockClear()
    const result = await observer.refetch()

    expect(result.data).toEqual({
      pages: [-1, 0, null, undefined].map((pageParam) => ({ pageParam })),
      pageParams: [-1, 0, null, undefined],
    })
    expect(queryFn.mock.calls.map(([context]) => context.pageParam)).toEqual([
      -1,
      0,
      null,
      undefined,
    ])
    expect(result.hasNextPage).toBe(false)
    expect(result.hasPreviousPage).toBe(false)
  })

  it('should limit manual pages and refetch only the retained pages', async () => {
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      queryFn: ({ pageParam }) => pageParam,
      initialPageParam: 0,
      mode: 'manual',
      maxPages: 2,
    })

    await observer.refetch()
    await observer.fetchNextPage({ pageParam: 10 })
    await observer.fetchNextPage({ pageParam: 20 })
    expect(observer.getCurrentResult().data).toEqual({
      pages: [10, 20],
      pageParams: [10, 20],
    })
    await observer.fetchPreviousPage({ pageParam: 5 })
    const result = await observer.refetch()
    expect(result.data).toEqual({ pages: [5, 10], pageParams: [5, 10] })
  })

  it('should retry a manual refetch with the cached page params', async () => {
    const params: Array<number> = []
    let fail = false
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKey(),
      mode: 'manual',
      initialPageParam: 0,
      retry: 1,
      retryDelay: 0,
      queryFn: ({ pageParam }) => {
        params.push(pageParam)
        if (fail && pageParam === 10) {
          fail = false
          throw new Error('retry this page')
        }
        return pageParam
      },
    })
    await observer.refetch()
    await observer.fetchNextPage({ pageParam: 10 })
    await observer.fetchNextPage({ pageParam: 20 })
    fail = true
    params.length = 0
    const refetched = observer.refetch()
    await vi.advanceTimersByTimeAsync(1)
    const result = await refetched
    expect(params).toEqual([0, 10, 10, 20])
    expect(result.data).toEqual({ pages: [0, 10, 20], pageParams: [0, 10, 20] })
  })

  it('should support query cancellation', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    const queryFnSpy = vi.fn().mockImplementation(({ pageParam, signal }) => {
      abortSignal = signal
      sleep(10)
      return pageParam
    })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
      initialPageParam: 1,
    })

    let observerResult:
      InfiniteQueryObserverResult<unknown, unknown> | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    const query = observer.getCurrentQuery()
    query.cancel()

    // Wait for the first page to be cancelled
    await vi.advanceTimersByTimeAsync(0)
    expect(observerResult).toMatchObject({
      isFetching: false,
      isError: true,
      error: new CancelledError(),
      data: undefined,
    })

    expect(queryFnSpy).toHaveBeenCalledTimes(1)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 1,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    unsubscribe()
  })

  it('should not refetch pages if the query is cancelled', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    let queryFnSpy = vi.fn().mockImplementation(({ pageParam, signal }) => {
      abortSignal = signal
      return pageParam
    })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
      initialPageParam: 1,
    })

    let observerResult:
      InfiniteQueryObserverResult<unknown, unknown> | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await vi.advanceTimersByTimeAsync(0)
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1], pageParams: [1] },
    })

    queryFnSpy.mockClear()

    // Fetch the second page
    await observer.fetchNextPage()
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1, 2], pageParams: [1, 2] },
    })

    expect(queryFnSpy).toHaveBeenCalledTimes(1)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      client: queryClient,
      pageParam: 2,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    queryFnSpy = vi.fn().mockImplementation(({ pageParam = 1, signal }) => {
      abortSignal = signal
      sleep(10)
      return pageParam
    })

    // Refetch the query
    observer.refetch()
    expect(observerResult).toMatchObject({
      isFetching: true,
      isError: false,
    })

    // Cancel the query
    const query = observer.getCurrentQuery()
    await query.cancel()
    vi.advanceTimersByTime(10)
    expect(observerResult).toMatchObject({
      isFetching: false,
      isError: true,
      error: new CancelledError(),
      data: { pages: [1, 2], pageParams: [1, 2] },
    })

    // Pages should not have been fetched
    expect(queryFnSpy).toHaveBeenCalledTimes(0)

    unsubscribe()
  })

  it('should surface the abort reason when cancellation happens between refetched pages', async () => {
    const key = queryKey()
    const abortController = new AbortController()
    const queryFn = vi.fn().mockImplementation(({ pageParam, signal }) => {
      void signal.aborted

      if (pageParam === 1) {
        abortController.abort()
      }

      return pageParam
    })

    const behavior = infiniteQueryBehavior<number, Error, number, number>()
    const context = {
      client: queryClient,
      queryKey: key,
      fetchOptions: undefined,
      options: {
        queryKey: key,
        queryFn,
        initialPageParam: 1,
        getNextPageParam: (lastPage: number) => lastPage + 1,
      },
      state: {
        data: {
          pages: [1, 2],
          pageParams: [1, 2],
        },
      },
      fetchFn: () => Promise.resolve(),
      signal: abortController.signal,
    }

    behavior.onFetch(context as any, {} as any)

    await expect(context.fetchFn()).rejects.toBe(abortController.signal.reason)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not enter an infinite loop when a page errors while retry is on #8046', async () => {
    let errorCount = 0
    const key = queryKey()

    interface TestResponse {
      data: Array<{ id: string }>
      nextToken?: number
    }

    const fakeData = [
      { data: [{ id: 'item-1' }], nextToken: 1 },
      { data: [{ id: 'item-2' }], nextToken: 2 },
      { data: [{ id: 'item-3' }], nextToken: 3 },
      { data: [{ id: 'item-4' }] },
    ]

    const fetchData = async ({ nextToken = 0 }: { nextToken?: number }) =>
      new Promise<TestResponse>((resolve, reject) => {
        setTimeout(() => {
          if (nextToken == 2 && errorCount < 3) {
            errorCount += 1
            reject({ statusCode: 429 })
            return
          }
          resolve(fakeData[nextToken] as TestResponse)
        }, 10)
      })

    const observer = new InfiniteQueryObserver<
      TestResponse,
      Error,
      InfiniteData<TestResponse>,
      typeof key,
      number
    >(queryClient, {
      retry: 5,
      staleTime: 0,
      retryDelay: 10,

      queryKey: key,
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextToken,
      queryFn: ({ pageParam }) => fetchData({ nextToken: pageParam }),
    })

    // Fetch Page 1
    const fetchPage1Promise = observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    const page1Data = await fetchPage1Promise
    expect(page1Data.data?.pageParams).toEqual([1])

    // Fetch Page 2, as per the queryFn, this will reject 2 times then resolves
    const fetchPage2Promise = observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(70)
    const page2Data = await fetchPage2Promise
    expect(page2Data.data?.pageParams).toEqual([1, 2])

    // Fetch Page 3
    const fetchPage3Promise = observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    const page3Data = await fetchPage3Promise
    expect(page3Data.data?.pageParams).toEqual([1, 2, 3])

    // Now the real deal; re-fetching this query **should not** stamp into an
    // infinite loop where the retryer every time restarts from page 1
    // once it reaches the page where it errors.
    // For this to work, we'd need to reset the error count so we actually retry
    errorCount = 0
    const reFetchPromise = observer.fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    const reFetchedData = await reFetchPromise
    expect(reFetchedData.data?.pageParams).toEqual([1, 2, 3])
  })

  it('should fetch even if initialPageParam is null', async () => {
    const key = queryKey()

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      getNextPageParam: () => null,
      initialPageParam: null,
    })

    let observerResult:
      InfiniteQueryObserverResult<unknown, unknown> | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: ['data'], pageParams: [null] },
    })

    unsubscribe()
  })

  it('should not fetch next page when getNextPageParam returns null', async () => {
    const key = queryKey()

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(0).then(() => pageParam),
      getNextPageParam: (lastPage) => (lastPage === 1 ? null : lastPage + 1),
      initialPageParam: 1,
    })

    let observerResult:
      | InfiniteQueryObserverResult<InfiniteData<number, unknown>, Error>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1], pageParams: [1] },
    })

    await observer.fetchNextPage()
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1], pageParams: [1] },
    })

    unsubscribe()
  })

  it('should use persister when provided', async () => {
    const key = queryKey()

    const persisterSpy = vi.fn().mockImplementation(async (fn) => {
      return await fn()
    })

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn: ({ pageParam }) => sleep(0).then(() => pageParam),
      getNextPageParam: (lastPage) => lastPage + 1,
      initialPageParam: 1,
      persister: persisterSpy,
    })

    const unsubscribe = observer.subscribe(() => {})
    await vi.advanceTimersByTimeAsync(0)
    expect(persisterSpy).toHaveBeenCalledTimes(1)

    unsubscribe()
  })
})
