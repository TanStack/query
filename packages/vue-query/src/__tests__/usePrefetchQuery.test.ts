import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick, ref } from 'vue-demi'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import { usePrefetchQuery } from '../usePrefetchQuery'

describe('usePrefetchQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should prefetch query if query state does not exist', () => {
    const queryClient = new QueryClient()
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const queryFn = vi.fn(() => Promise.resolve('prefetched'))
    const key = queryKey()

    usePrefetchQuery(
      {
        queryKey: key,
        queryFn,
      },
      queryClient,
    )

    expect(prefetchQuerySpy).toHaveBeenCalledTimes(1)
    expect(prefetchQuerySpy).toHaveBeenCalledWith({
      queryKey: key,
      queryFn,
    })
  })

  test('should not prefetch query if query state exists', () => {
    const queryClient = new QueryClient()
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const queryFn = vi.fn(() => Promise.resolve('prefetched'))
    const key = queryKey()
    queryClient.setQueryData(key, 'existing')

    usePrefetchQuery(
      {
        queryKey: key,
        queryFn,
      },
      queryClient,
    )

    expect(prefetchQuerySpy).not.toHaveBeenCalled()
  })

  test('should unwrap refs in query options', () => {
    const queryClient = new QueryClient()
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const nestedRef = ref('value')
    const key = queryKey()

    usePrefetchQuery(
      {
        queryKey: [...key, nestedRef],
        queryFn: () => Promise.resolve('prefetched'),
      },
      queryClient,
    )

    expect(prefetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...key, 'value'],
      }),
    )
  })

  test('should prefetch again when query key changes reactively', async () => {
    const queryClient = new QueryClient()
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const keyRef = ref('first')
    const key = queryKey()

    usePrefetchQuery(
      () => ({
        queryKey: [...key, keyRef.value],
        queryFn: () => Promise.resolve(keyRef.value),
      }),
      queryClient,
    )

    expect(prefetchQuerySpy).toHaveBeenCalledTimes(1)
    expect(prefetchQuerySpy).toHaveBeenLastCalledWith({
      queryKey: [...key, 'first'],
      queryFn: expect.any(Function),
    })

    keyRef.value = 'second'
    await nextTick()

    expect(prefetchQuerySpy).toHaveBeenCalledTimes(2)
    expect(prefetchQuerySpy).toHaveBeenLastCalledWith({
      queryKey: [...key, 'second'],
      queryFn: expect.any(Function),
    })
  })

  test('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      usePrefetchQuery(
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve('prefetched'),
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
