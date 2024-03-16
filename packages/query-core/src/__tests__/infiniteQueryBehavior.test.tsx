import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { CancelledError, InfiniteQueryObserver } from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { InfiniteQueryObserverResult, QueryCache, QueryClient } from '..'

describe('InfiniteQueryBehavior', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = createQueryClient()
    queryCache = queryClient.getQueryCache()
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
      initialPageParam: 1,
      getNextPageParam: () => 2,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    await waitFor(() => {
      const query = queryCache.find({ queryKey: key })!
      return expect(observerResult).toMatchObject({
        isError: true,
        error: new Error(`Missing queryFn: '${query.queryHash}'`),
      })
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should apply the maxPages option to limit the number of pages', async () => {
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
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1], pageParams: [1] },
      }),
    )

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
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
      pageParam: 0,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(2, {
      queryKey: key,
      pageParam: 1,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should support query cancellation', async () => {
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
      pageParam: 1,
      meta: undefined,
      direction: 'forward',
      signal: abortSignal,
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should not refetch pages if the query is cancelled', async () => {
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
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1], pageParams: [1] },
      }),
    )

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
    query.cancel()

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
})
