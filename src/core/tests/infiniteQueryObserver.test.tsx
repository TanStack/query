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
})
