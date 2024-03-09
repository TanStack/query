import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { InfiniteQueryObserver } from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { QueryClient } from '..'

describe('InfiniteQueryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
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
      select: (data) => ({
        pages: data.pages.map((x) => `${x}`),
        pageParams: data.pageParams,
      }),
      initialPageParam: 1,
      getNextPageParam: () => 2,
    })
    let observerResult
    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject({
      data: { pages: ['1'], pageParams: [1] },
    })
  })

  test('InfiniteQueryObserver should pass the meta option to the queryFn', async () => {
    const meta = {
      it: 'works',
    }

    const key = queryKey()
    const queryFn = vi.fn(() => 1)
    const observer = new InfiniteQueryObserver(queryClient, {
      meta,
      queryKey: key,
      queryFn,
      select: (data) => ({
        pages: data.pages.map((x) => `${x}`),
        pageParams: data.pageParams,
      }),
      initialPageParam: 1,
      getNextPageParam: () => 2,
    })
    let observerResult
    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject({
      data: { pages: ['1'], pageParams: [1] },
    })
    expect(queryFn).toBeCalledWith(expect.objectContaining({ meta }))
  })

  test('getNextPagParam and getPreviousPageParam should receive current pageParams', async () => {
    const key = queryKey()
    let single: Array<string> = []
    let all: Array<string> = []
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn: ({ pageParam }) => String(pageParam),
      initialPageParam: 1,
      getNextPageParam: (_, __, lastPageParam, allPageParams) => {
        single.push('next' + lastPageParam)
        all.push('next' + allPageParams.join(','))
        return lastPageParam + 1
      },
      getPreviousPageParam: (_, __, firstPageParam, allPageParams) => {
        single.push('prev' + firstPageParam)
        all.push('prev' + allPageParams.join(','))
        return firstPageParam - 1
      },
    })

    await observer.fetchNextPage()
    await observer.fetchPreviousPage()

    expect(single).toEqual(['next1', 'prev1', 'prev1', 'next1', 'prev0'])
    expect(all).toEqual(['next1', 'prev1', 'prev1', 'next0,1', 'prev0,1'])

    single = []
    all = []

    await observer.refetch()

    expect(single).toEqual(['next0', 'next1', 'prev0'])
    expect(all).toEqual(['next0', 'next0,1', 'prev0,1'])
  })

  test('should stop refetching if undefined is returned from getNextPageParam', async () => {
    const key = queryKey()
    let next: number | undefined = 2
    const queryFn = vi.fn<any, any>(({ pageParam }) => String(pageParam))
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      initialPageParam: 1,
      getNextPageParam: () => next,
    })

    await observer.fetchNextPage()
    await observer.fetchNextPage()

    expect(observer.getCurrentResult().data?.pages).toEqual(['1', '2'])
    expect(queryFn).toBeCalledTimes(2)
    expect(observer.getCurrentResult().hasNextPage).toBe(true)

    next = undefined

    await observer.refetch()

    expect(observer.getCurrentResult().data?.pages).toEqual(['1'])
    expect(queryFn).toBeCalledTimes(3)
    expect(observer.getCurrentResult().hasNextPage).toBe(false)
  })

  test('should stop refetching if null is returned from getNextPageParam', async () => {
    const key = queryKey()
    let next: number | null = 2
    const queryFn = vi.fn<any, any>(({ pageParam }) => String(pageParam))
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      initialPageParam: 1,
      getNextPageParam: () => next,
    })

    await observer.fetchNextPage()
    await observer.fetchNextPage()

    expect(observer.getCurrentResult().data?.pages).toEqual(['1', '2'])
    expect(queryFn).toBeCalledTimes(2)
    expect(observer.getCurrentResult().hasNextPage).toBe(true)

    next = null

    await observer.refetch()

    expect(observer.getCurrentResult().data?.pages).toEqual(['1'])
    expect(queryFn).toBeCalledTimes(3)
    expect(observer.getCurrentResult().hasNextPage).toBe(false)
  })
})
