import { waitFor } from '@testing-library/react'
import {
  QueryClient,
  InfiniteQueryObserver,
  InfiniteQueryObserverResult,
} from '@tanstack/query-core'
import { createQueryClient, queryKey } from '../../../../tests/utils'

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
        error: 'Missing queryFn',
      })
    })

    unsubscribe()
  })

  test('InfiniteQueryBehavior should not refetch the first page if another page refetched', async () => {
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
        data: { pages: [1] },
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
      data: { pages: [1, 2] },
    })

    queryFnSpy.mockClear()

    // Refetch the second page
    await queryClient.refetchQueries({
      refetchPage: (_page, index) => index === 1,
    })

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: key,
      pageParam: 2,
      meta: undefined,
      signal: abortSignal,
    })

    expect(observerResult).toMatchObject({
      data: { pages: [1, 2] },
    })

    unsubscribe()
  })
})
