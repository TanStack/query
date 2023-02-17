import { waitFor } from '@testing-library/react'
import type {
  QueryClient,
  InfiniteQueryObserverResult,
} from '@tanstack/query-core'
import { InfiniteQueryObserver, CancelledError } from '@tanstack/query-core'
import { createQueryClient, queryKey, sleep } from './utils'

describe('InfiniteQueryBehavior', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('InfiniteQueryBehavior should throw an error if the queryFn is not defined', async () => {
    const key = queryKey()

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      retry: false,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    await waitFor(() => {
      return expect(observerResult).toMatchObject({
        isError: true,
        error: new Error('Missing queryFn'),
      })
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should apply the maxPages option to limit the number of pages', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    const queryFnSpy = jest
      .fn()
      .mockImplementation(({ pageParam = 1, signal }) => {
        abortSignal = signal
        return pageParam
      })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
      maxPages: 2,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1], pageParams: [undefined] },
      }),
    )

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: undefined,
      meta: undefined,
      signal: abortSignal,
    })

    queryFnSpy.mockClear()

    // Fetch the second page
    await observer.fetchNextPage()

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 2,
      meta: undefined,
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1, 2], pageParams: [undefined, 2] },
    })

    queryFnSpy.mockClear()

    // Fetch the page before the first page
    await observer.fetchPreviousPage()

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 0,
      meta: undefined,
      signal: abortSignal,
    })

    // Only first two pages should be in the data
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [0, 1], pageParams: [0, undefined] },
    })

    queryFnSpy.mockClear()

    // Fetch the page before
    await observer.fetchPreviousPage()

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: -1,
      meta: undefined,
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
      pageParam: 1,
      meta: undefined,
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [0, 1] },
    })

    queryFnSpy.mockClear()

    // Refetch the infinite query
    await observer.refetch()

    // Only 2 pages should be refetched
    expect(queryFnSpy).toHaveBeenCalledTimes(2)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 0,
      meta: undefined,
      signal: abortSignal,
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(2, {
      queryKey: key,
      pageParam: 1,
      meta: undefined,
      signal: abortSignal,
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should apply pageParam', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    const queryFnSpy = jest.fn().mockImplementation(({ pageParam, signal }) => {
      abortSignal = signal
      return pageParam ?? 1
    })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1], pageParams: [undefined] },
      }),
    )

    queryFnSpy.mockClear()

    // Fetch the next page using pageParam
    await observer.fetchNextPage({ pageParam: 2 })

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 2,
      meta: undefined,
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1, 2], pageParams: [undefined, 2] },
    })

    queryFnSpy.mockClear()

    // Fetch the previous page using pageParam
    await observer.fetchPreviousPage({ pageParam: 0 })

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 0,
      meta: undefined,
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [0, 1, 2], pageParams: [0, undefined, 2] },
    })

    queryFnSpy.mockClear()

    // Refetch pages: old manual page params should be used
    await observer.refetch()

    expect(queryFnSpy).toHaveBeenCalledTimes(3)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 0,
      meta: undefined,
      signal: abortSignal,
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(2, {
      queryKey: key,
      pageParam: undefined,
      meta: undefined,
      signal: abortSignal,
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(3, {
      queryKey: key,
      pageParam: 2,
      meta: undefined,
      signal: abortSignal,
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should support query cancellation', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    const queryFnSpy = jest
      .fn()
      .mockImplementation(({ pageParam = 1, signal }) => {
        abortSignal = signal
        sleep(10)
        return pageParam
      })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    const query = observer.getCurrentQuery()
    query.cancel()

    // Wait for the first page to be cancelled
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        isError: true,
        error: new CancelledError(),
        data: undefined,
      }),
    )

    expect(queryFnSpy).toHaveBeenCalledTimes(1)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: undefined,
      meta: undefined,
      signal: abortSignal,
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should not refetch pages if the query is cancelled', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    let queryFnSpy = jest
      .fn()
      .mockImplementation(({ pageParam = 1, signal }) => {
        abortSignal = signal
        return pageParam
      })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: (lastPage) => lastPage + 1,
      getPreviousPageParam: (firstPage) => firstPage - 1,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1], pageParams: [undefined] },
      }),
    )

    queryFnSpy.mockClear()

    // Fetch the second page
    await observer.fetchNextPage()

    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1, 2], pageParams: [undefined, 2] },
    })

    expect(queryFnSpy).toHaveBeenCalledTimes(1)

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 2,
      meta: undefined,
      signal: abortSignal,
    })

    queryFnSpy = jest.fn().mockImplementation(({ pageParam = 1, signal }) => {
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
    query.cancel()

    expect(observerResult).toMatchObject({
      isFetching: false,
      isError: true,
      error: new CancelledError(),
      data: { pages: [1, 2], pageParams: [undefined, 2] },
    })

    // Pages should not have been fetched
    expect(queryFnSpy).toHaveBeenCalledTimes(0)

    unsubscribe()
  })

  test('InfiniteQueryBehavior should return the current pages if no page param can be determined', async () => {
    const key = queryKey()
    let abortSignal: AbortSignal | null = null

    const queryFnSpy = jest
      .fn()
      .mockImplementation(({ pageParam = 1, signal }) => {
        abortSignal = signal
        return pageParam
      })

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1], pageParams: [undefined] },
      }),
    )

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: undefined,
      meta: undefined,
      signal: abortSignal,
    })

    queryFnSpy.mockClear()

    // Try to fetch a page without page param and getNextPageParam defined
    await observer.fetchNextPage()

    // Current pages should be returned
    expect(observerResult).toMatchObject({
      isFetching: false,
      data: { pages: [1], pageParams: [undefined] },
    })

    // queryFnSpy should not be called
    expect(queryFnSpy).toBeCalledTimes(0)

    unsubscribe()
  })
})
