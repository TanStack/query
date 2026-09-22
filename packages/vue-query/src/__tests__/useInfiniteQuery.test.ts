import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'

vi.mock('../useQueryClient')

describe('useInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should properly execute infinite query', async () => {
    const key = queryKey()
    const { data, fetchNextPage, status } = useInfiniteQuery({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(0).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: () => 12,
    })

    expect(data.value).toStrictEqual(undefined)
    expect(status.value).toStrictEqual('pending')

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0],
      pages: ['data on page 0'],
    })
    expect(status.value).toStrictEqual('success')

    fetchNextPage()

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0, 12],
      pages: ['data on page 0', 'data on page 12'],
    })
    expect(status.value).toStrictEqual('success')
  })
  it('should properly execute infinite query using infiniteQueryOptions', async () => {
    const key = queryKey()
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(0).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: () => 12,
    })

    const { data, fetchNextPage, status } = useInfiniteQuery(options)

    expect(data.value).toStrictEqual(undefined)
    expect(status.value).toStrictEqual('pending')

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0],
      pages: ['data on page 0'],
    })
    expect(status.value).toStrictEqual('success')

    fetchNextPage()

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0, 12],
      pages: ['data on page 0', 'data on page 12'],
    })
    expect(status.value).toStrictEqual('success')
  })

  it('should react to maxPages changing via a whole-options getter', async () => {
    const key = queryKey()
    const maxPages = ref(1)
    const { data, fetchNextPage } = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
        lastPageParam + 1,
      maxPages: maxPages.value,
    }))

    await vi.advanceTimersByTimeAsync(10)
    fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value?.pages).toStrictEqual(['data on page 1'])

    maxPages.value = 2
    await vi.advanceTimersByTimeAsync(0)
    fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value?.pages).toStrictEqual([
      'data on page 1',
      'data on page 2',
    ])
  })

  it('should reflect hasNextPage becoming false once the last page is reached', async () => {
    const key = queryKey()
    const { hasNextPage, fetchNextPage, isFetching } = useInfiniteQuery({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
        lastPageParam < 12 ? lastPageParam + 12 : undefined,
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(hasNextPage.value).toBe(true)

    fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    expect(hasNextPage.value).toBe(false)
    expect(isFetching.value).toBe(false)
  })
})
