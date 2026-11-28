import { createKey } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import * as clientOperations from '../queryClient'
import { QueryClient, setQueryData } from '../queryClient'
import { usePrefetchInfiniteQuery } from '../usePrefetchInfiniteQuery'

describe('usePrefetchInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should prefetch infinite query if query state does not exist', () => {
    const queryClient = new QueryClient()
    const infiniteQuerySpy = vi.spyOn(clientOperations, 'infiniteQuery')
    const queryFn = () =>
      Promise.resolve({ data: 'prefetched', currentPage: 1 })
    const getNextPageParam = () => undefined

    const key = createKey()

    usePrefetchInfiniteQuery(
      {
        queryKey: key,
        queryFn,
        initialPageParam: 1,
        getNextPageParam,
      },
      queryClient,
    )

    expect(infiniteQuerySpy).toHaveBeenCalledTimes(1)
    expect(infiniteQuerySpy).toHaveBeenCalledWith(queryClient, {
      queryKey: key,
      queryFn,
      initialPageParam: 1,
      getNextPageParam,
    })
  })

  it('should not prefetch infinite query if query state exists', () => {
    const queryClient = new QueryClient()
    const infiniteQuerySpy = vi.spyOn(clientOperations, 'infiniteQuery')
    const queryFn = () =>
      Promise.resolve({ data: 'prefetched', currentPage: 1 })

    const key = createKey()
    setQueryData(queryClient, key, {
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

    expect(infiniteQuerySpy).not.toHaveBeenCalled()
  })

  it('should unwrap refs in infinite query options', () => {
    const queryClient = new QueryClient()
    const infiniteQuerySpy = vi.spyOn(clientOperations, 'infiniteQuery')
    const nestedRef = ref('value')
    const key = createKey()
    const queryFn = () =>
      Promise.resolve({ data: 'prefetched', currentPage: 1 })
    const getNextPageParam = () => undefined

    usePrefetchInfiniteQuery(
      {
        queryKey: [...key, nestedRef],
        queryFn,
        initialPageParam: 1,
        getNextPageParam,
      },
      queryClient,
    )

    expect(infiniteQuerySpy).toHaveBeenCalledWith(queryClient, {
      queryKey: [...key, 'value'],
      queryFn,
      initialPageParam: 1,
      getNextPageParam,
    })
  })

  it('should prefetch infinite query again when query key changes reactively', async () => {
    const queryClient = new QueryClient()
    const infiniteQuerySpy = vi.spyOn(clientOperations, 'infiniteQuery')
    const keyRef = ref('first')
    const key = createKey()
    const queryFn = () =>
      Promise.resolve({ data: keyRef.value, currentPage: 1 })
    const getNextPageParam = () => undefined

    usePrefetchInfiniteQuery(
      () => ({
        queryKey: [...key, keyRef.value],
        queryFn,
        initialPageParam: 1,
        getNextPageParam,
      }),
      queryClient,
    )

    expect(infiniteQuerySpy).toHaveBeenCalledTimes(1)
    expect(infiniteQuerySpy).toHaveBeenNthCalledWith(1, queryClient, {
      queryKey: [...key, 'first'],
      queryFn,
      initialPageParam: 1,
      getNextPageParam,
    })

    keyRef.value = 'second'
    await nextTick()
    expect(infiniteQuerySpy).toHaveBeenCalledTimes(2)
    expect(infiniteQuerySpy).toHaveBeenNthCalledWith(2, queryClient, {
      queryKey: [...key, 'second'],
      queryFn,
      initialPageParam: 1,
      getNextPageParam,
    })
  })

  it('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const consoleWarnMock = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    usePrefetchInfiniteQuery(
      {
        queryKey: createKey(),
        queryFn: () => Promise.resolve({ data: 'prefetched', currentPage: 1 }),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      new QueryClient(),
    )

    expect(consoleWarnMock).toHaveBeenCalledWith(
      'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
    )
  })
})
