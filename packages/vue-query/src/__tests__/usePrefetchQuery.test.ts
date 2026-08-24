import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('should prefetch query if query state does not exist', () => {
    const queryClient = new QueryClient()
    const querySpy = vi.spyOn(queryClient, 'query')
    const queryFn = () => Promise.resolve('prefetched')
    const key = queryKey()

    usePrefetchQuery(
      {
        queryKey: key,
        queryFn,
      },
      queryClient,
    )

    expect(querySpy).toHaveBeenCalledTimes(1)
    expect(querySpy).toHaveBeenCalledWith({
      queryKey: key,
      queryFn,
    })
  })

  it('should not prefetch query if query state exists', () => {
    const queryClient = new QueryClient()
    const querySpy = vi.spyOn(queryClient, 'query')
    const queryFn = () => Promise.resolve('prefetched')
    const key = queryKey()
    queryClient.setQueryData(key, 'existing')

    usePrefetchQuery(
      {
        queryKey: key,
        queryFn,
      },
      queryClient,
    )

    expect(querySpy).not.toHaveBeenCalled()
  })

  it('should unwrap refs in query options', () => {
    const queryClient = new QueryClient()
    const querySpy = vi.spyOn(queryClient, 'query')
    const nestedRef = ref('value')
    const key = queryKey()
    const queryFn = () => Promise.resolve('prefetched')

    usePrefetchQuery(
      {
        queryKey: [...key, nestedRef],
        queryFn,
      },
      queryClient,
    )

    expect(querySpy).toHaveBeenCalledWith({
      queryKey: [...key, 'value'],
      queryFn,
    })
  })

  it('should prefetch again when query key changes reactively', async () => {
    const queryClient = new QueryClient()
    const querySpy = vi.spyOn(queryClient, 'query')
    const keyRef = ref('first')
    const key = queryKey()
    const queryFn = () => Promise.resolve(keyRef.value)

    usePrefetchQuery(
      () => ({
        queryKey: [...key, keyRef.value],
        queryFn,
      }),
      queryClient,
    )

    expect(querySpy).toHaveBeenCalledTimes(1)
    expect(querySpy).toHaveBeenNthCalledWith(1, {
      queryKey: [...key, 'first'],
      queryFn,
    })

    keyRef.value = 'second'
    await nextTick()

    expect(querySpy).toHaveBeenCalledTimes(2)
    expect(querySpy).toHaveBeenNthCalledWith(2, {
      queryKey: [...key, 'second'],
      queryFn,
    })
  })

  it('should warn when used outside of setup function in development mode', () => {
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
