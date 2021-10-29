import { sleep, queryKey, mockConsoleError } from '../../react/tests/utils'
import {
  QueryClient,
  InfiniteQueryObserver,
  InfiniteQueryObserverResult,
} from '../..'
import { waitFor } from '@testing-library/react'

describe('InfiniteQueryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('InfiniteQueryObserver should be able to fetch an infinite query with selector', async () => {
    const key = queryKey()
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 1,
      select: data => ({
        pages: data.pages.map(x => `${x}`),
        pageParams: data.pageParams,
      }),
    })
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject({
      data: { pages: ['1'], pageParams: [undefined] },
    })
  })

  test('InfiniteQueryObserver should pass the meta option to the queryFn', async () => {
    const meta = {
      it: 'works',
    }

    const key = queryKey()
    const queryFn = jest.fn(() => 1)
    const observer = new InfiniteQueryObserver(queryClient, {
      meta,
      queryKey: key,
      queryFn,
      select: data => ({
        pages: data.pages.map(x => `${x}`),
        pageParams: data.pageParams,
      }),
    })
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject({
      data: { pages: ['1'], pageParams: [undefined] },
    })
    expect(queryFn).toBeCalledWith(expect.objectContaining({ meta }))
  })

  test('InfiniteQueryObserver result should contain an error if the queryFn is not defined', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      retry: false,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })

    await waitFor(() => {
      return expect(observerResult).toMatchObject({
        isError: true,
        error: 'Missing queryFn',
      })
    })

    unsubscribe()
    consoleMock.mockRestore()
  })

  test('InfiniteQueryObserver should not refetch the first page if refetch another page', async () => {
    const key = queryKey()

    const queryFnSpy = jest
      .fn()
      .mockImplementation(({ pageParam = 1 }) => pageParam)

    const observer = new InfiniteQueryObserver<number>(queryClient, {
      queryKey: key,
      queryFn: queryFnSpy,
      getNextPageParam: lastPage => lastPage + 1,
    })

    let observerResult:
      | InfiniteQueryObserverResult<unknown, unknown>
      | undefined

    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })

    // Wait for the first page to be fetched
    await waitFor(() =>
      expect(observerResult).toMatchObject({
        isFetching: false,
        data: { pages: [1] },
      })
    )

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: [key],
      pageParam: undefined,
      meta: undefined,
    })

    queryFnSpy.mockClear()

    // Fetch the second page
    await observer.fetchNextPage()

    expect(queryFnSpy).toHaveBeenNthCalledWith(1, {
      queryKey: [key],
      pageParam: 2,
      meta: undefined,
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
      queryKey: [key],
      pageParam: 2,
      meta: undefined,
    })

    expect(observerResult).toMatchObject({
      data: { pages: [1, 2] },
    })

    unsubscribe()
  })
})
