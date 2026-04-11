import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick, ref } from 'vue-demi'
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

    usePrefetchQuery(
      {
        queryKey: ['prefetch-query'],
        queryFn,
      },
      queryClient,
    )

    expect(prefetchQuerySpy).toHaveBeenCalledTimes(1)
    expect(prefetchQuerySpy).toHaveBeenCalledWith({
      queryKey: ['prefetch-query'],
      queryFn,
    })
  })

  test('should not prefetch query if query state exists', () => {
    const queryClient = new QueryClient()
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const queryFn = vi.fn(() => Promise.resolve('prefetched'))
    queryClient.setQueryData(['prefetch-query-existing'], 'existing')

    usePrefetchQuery(
      {
        queryKey: ['prefetch-query-existing'],
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

    usePrefetchQuery(
      {
        queryKey: ['prefetch-query-ref', nestedRef],
        queryFn: () => Promise.resolve('prefetched'),
      },
      queryClient,
    )

    expect(prefetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['prefetch-query-ref', 'value'],
      }),
    )
  })

  test('should prefetch again when query key changes reactively', async () => {
    const queryClient = new QueryClient()
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const keyRef = ref('first')

    usePrefetchQuery(
      () => ({
        queryKey: ['prefetch-query-reactive', keyRef.value],
        queryFn: () => Promise.resolve(keyRef.value),
      }),
      queryClient,
    )

    expect(prefetchQuerySpy).toHaveBeenCalledTimes(1)
    expect(prefetchQuerySpy).toHaveBeenLastCalledWith({
      queryKey: ['prefetch-query-reactive', 'first'],
      queryFn: expect.any(Function),
    })

    keyRef.value = 'second'
    await nextTick()

    expect(prefetchQuerySpy).toHaveBeenCalledTimes(2)
    expect(prefetchQuerySpy).toHaveBeenLastCalledWith({
      queryKey: ['prefetch-query-reactive', 'second'],
      queryFn: expect.any(Function),
    })
  })

  test('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      usePrefetchQuery(
        {
          queryKey: ['outside-scope-prefetch-query'],
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
