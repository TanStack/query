import { describe, expect, it, vi } from 'vitest'
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryObserver,
  setQueryData,
} from '..'
import {
  isError,
  isFetchNextPageError,
  isFetchPreviousPageError,
  isFetched,
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  isLoading,
  isLoadingError,
  isPaused,
  isPending,
  isRefetchError,
  isRefetching,
  isSuccess,
} from '../queryResult'

describe('query result helpers', () => {
  it('subscribes to status when a consumer only reads isPending', () => {
    const client = new QueryClient()
    const queryKey = ['tracked']
    const observer = new QueryObserver(client, {
      queryKey,
      queryFn: () => 'unused',
      enabled: false,
    })
    const tracked = vi.fn<(key: string) => void>()
    const initial = observer.trackResult(observer.getCurrentResult(), tracked)
    expect(isPending(initial)).toBe(true)
    expect(tracked.mock.calls).toStrictEqual([['status']])
    const notify = vi.fn<() => void>()
    const unsubscribe = observer.subscribe(notify)
    try {
      setQueryData(client, queryKey, 'first')
      setQueryData(client, queryKey, 'second')
      expect(notify).toHaveBeenCalledTimes(1)
      const result = observer.getCurrentResult()
      expect(isSuccess(result)).toBe(true)
      expect(isFetched(result)).toBe(true)
      expect(result.dataUpdateCount).toBe(2)
      for (const field of [
        'isPending',
        'isSuccess',
        'isError',
        'isFetched',
        'isFetching',
        'isRefetching',
      ])
        expect(result).not.toHaveProperty(field)
    } finally {
      unsubscribe()
    }
  })

  it('distinguishes a directional page request and error from a background refetch', async () => {
    const request = Promise.withResolvers<number>()
    const observer = new InfiniteQueryObserver(new QueryClient(), {
      queryKey: ['pages'],
      initialPageParam: 1,
      initialData: { pages: [1], pageParams: [1] },
      staleTime: Infinity,
      retry: false,
      queryFn: () => request.promise,
      getNextPageParam: (page) => page + 1,
    })
    const unsubscribe = observer.subscribe(() => {})
    try {
      const next = observer.fetchNextPage()
      const fetching = observer.getCurrentResult()
      expect(isFetching(fetching)).toBe(true)
      expect(isFetchingNextPage(fetching)).toBe(true)
      expect(isFetchingPreviousPage(fetching)).toBe(false)
      expect(isRefetching(fetching)).toBe(false)
      request.reject(new Error('page unavailable'))
      const failed = await next
      expect(failed.fetchDirection).toBe('forward')
      expect(isError(failed)).toBe(true)
      expect(isFetchNextPageError(failed)).toBe(true)
      expect(isFetchPreviousPageError(failed)).toBe(false)
      expect(isLoadingError(failed)).toBe(false)
      expect(isRefetchError(failed)).toBe(false)
      expect(isLoading(failed)).toBe(false)
      expect(isPaused(failed)).toBe(false)
    } finally {
      unsubscribe()
    }
  })

  it('keeps the direction of a failed first page when there is no data', async () => {
    const observer = new InfiniteQueryObserver(new QueryClient(), {
      queryKey: ['empty-pages'],
      enabled: false,
      initialPageParam: 0,
      retry: false,
      queryFn: () => Promise.reject(new Error('first request failed')),
      getNextPageParam: () => undefined,
    })
    const unsubscribe = observer.subscribe(() => {})
    try {
      const failed = await observer.fetchPreviousPage()
      expect(failed.data).toBeUndefined()
      expect(isLoadingError(failed)).toBe(true)
      expect(isRefetchError(failed)).toBe(false)
      expect(isFetchPreviousPageError(failed)).toBe(true)
      expect(isFetchNextPageError(failed)).toBe(false)
    } finally {
      unsubscribe()
    }
  })
})
