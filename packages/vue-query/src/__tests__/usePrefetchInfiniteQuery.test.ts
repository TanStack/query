import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick, ref } from 'vue-demi'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import { usePrefetchInfiniteQuery } from '../usePrefetchInfiniteQuery'

describe('usePrefetchInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should prefetch infinite query if query state does not exist', () => {
    const queryClient = new QueryClient()
    const prefetchInfiniteQuerySpy = vi.spyOn(
      queryClient,
      'prefetchInfiniteQuery',
    )
    const queryFn = vi.fn(() =>
      Promise.resolve({ data: 'prefetched', currentPage: 1 }),
    )

    const key = queryKey()

    usePrefetchInfiniteQuery(
      {
        queryKey: key,
        queryFn,
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      queryClient,
    )

    expect(prefetchInfiniteQuerySpy).toHaveBeenCalledTimes(1)
    expect(prefetchInfiniteQuerySpy).toHaveBeenCalledWith({
      queryKey: key,
      queryFn,
      initialPageParam: 1,
      getNextPageParam: expect.any(Function),
    })
  })

  test('should not prefetch infinite query if query state exists', () => {
    const queryClient = new QueryClient()
    const prefetchInfiniteQuerySpy = vi.spyOn(
      queryClient,
      'prefetchInfiniteQuery',
    )
    const queryFn = vi.fn(() =>
      Promise.resolve({ data: 'prefetched', currentPage: 1 }),
    )

    const key = queryKey()
    queryClient.setQueryData(key, {
      pages: [{ data: 'existing', currentPage: 1 }],
      pageParams: [1],
    })

    usePrefetchInfiniteQuery(
      {
        queryKey: key,
        queryFn,
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      queryClient,
    )

    expect(prefetchInfiniteQuerySpy).not.toHaveBeenCalled()
  })

  test('should unwrap refs in infinite query options', () => {
    const queryClient = new QueryClient()
    const prefetchInfiniteQuerySpy = vi.spyOn(
      queryClient,
      'prefetchInfiniteQuery',
    )
    const nestedRef = ref('value')
    const key = queryKey()

    usePrefetchInfiniteQuery(
      {
        queryKey: [...key, nestedRef],
        queryFn: () => Promise.resolve({ data: 'prefetched', currentPage: 1 }),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      queryClient,
    )

    expect(prefetchInfiniteQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...key, 'value'],
      }),
    )
  })

  test('should prefetch infinite query again when query key changes reactively', async () => {
    const queryClient = new QueryClient()
    const prefetchInfiniteQuerySpy = vi.spyOn(
      queryClient,
      'prefetchInfiniteQuery',
    )
    const keyRef = ref('first')
    const key = queryKey()

    usePrefetchInfiniteQuery(
      () => ({
        queryKey: [...key, keyRef.value],
        queryFn: () => Promise.resolve({ data: keyRef.value, currentPage: 1 }),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }),
      queryClient,
    )

    expect(prefetchInfiniteQuerySpy).toHaveBeenCalledTimes(1)
    expect(prefetchInfiniteQuerySpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: [...key, 'first'],
      }),
    )

    keyRef.value = 'second'
    await nextTick()

    expect(prefetchInfiniteQuerySpy).toHaveBeenCalledTimes(2)
    expect(prefetchInfiniteQuerySpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: [...key, 'second'],
      }),
    )
  })

  test('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      usePrefetchInfiniteQuery(
        {
          queryKey: queryKey(),
          queryFn: () =>
            Promise.resolve({ data: 'prefetched', currentPage: 1 }),
          initialPageParam: 1,
          getNextPageParam: () => undefined,
        },
        new QueryClient(),
      )

      expect(warnSpy).toHaveBeenCalledWith(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    } finally {
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })
})
