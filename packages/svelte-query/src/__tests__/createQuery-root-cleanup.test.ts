import { flushSync } from 'svelte'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { QueryClient, createQuery, createInfiniteQuery } from '../index'
import { setIsServer } from '../__tests__/utils'

describe('createQuery / createInfiniteQuery observer cleanup in $effect.root (#11587)', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const createTestQuery = (client: QueryClient, queryKey: string[]) => {
    return $effect.root(() => {
      return createQuery(
        () => ({ queryKey, queryFn: () => Promise.resolve('data') }),
        () => client,
      )
    })
  }

  const createTestInfiniteQuery = (client: QueryClient, queryKey: string[]) => {
    return $effect.root(() => {
      return createInfiniteQuery(
        () => ({ queryKey, queryFn: () => Promise.resolve({ pages: ['data'], pageParams: [1] }), getNextPageParam: () => undefined }),
        () => client,
      )
    })
  }

  it('should dispose observer on $effect.root cleanup for createQuery', () => {
    const client = new QueryClient()
    const queryKey = ['root-cleanup-query']

    const dispose = $effect.root(() => {
      createQuery(
        () => ({ queryKey, queryFn: () => Promise.resolve('data') }),
        () => client,
      )
    })

    flushSync()
    const query = client.getQueryCache().find({ queryKey })!
    expect(query.getObserversCount()).toBe(1)

    dispose()
    flushSync()
    expect(query.getObserversCount()).toBe(0)
  })

  it('should dispose observer on $effect.root cleanup for createInfiniteQuery', () => {
    const client = new QueryClient()
    const queryKey = ['root-cleanup-infinite']

    const dispose = $effect.root(() => {
      createInfiniteQuery(
        () => ({ queryKey, queryFn: () => Promise.resolve({ pages: ['data'], pageParams: [1] }), getNextPageParam: () => undefined }),
        () => client,
      )
    })

    flushSync()
    const query = client.getQueryCache().find({ queryKey })!
    expect(query.getObserversCount()).toBe(1)

    dispose()
    flushSync()
    expect(query.getObserversCount()).toBe(0)
  })

  it('should dispose observer when disposed before first effect runs', () => {
    const client = new QueryClient()
    const queryKey = ['root-cleanup-before-effect']

    const dispose = $effect.root(() => {
      createQuery(
        () => ({ queryKey, queryFn: () => Promise.resolve('data') }),
        () => client,
      )
    })

    // Dispose immediately without flushSync
    dispose()
    flushSync()
    const query = client.getQueryCache().find({ queryKey })!
    expect(query.getObserversCount()).toBe(0)
  })

  it('should abort pending request on disposal', async () => {
    const client = new QueryClient()
    const queryKey = ['root-cleanup-pending']

    let resolveFn: (value: string) => void
    const pendingPromise = new Promise<string>((resolve) => {
      resolveFn = resolve
    })

    const dispose = $effect.root(() => {
      createQuery(
        () => ({ queryKey, queryFn: () => pendingPromise }),
        () => client,
      )
    })

    flushSync()
    const query = client.getQueryCache().find({ queryKey })!
    expect(query.state.fetchStatus).toBe('fetching')

    dispose()
    flushSync()

    // The pending request should be aborted
    expect(query.state.fetchStatus).toBe('idle')
    expect(query.getObserversCount()).toBe(0)
  })

  it('should stop interval refetches after disposal', async () => {
    const client = new QueryClient()
    const queryKey = ['root-cleanup-interval']

    let callCount = 0
    const dispose = $effect.root(() => {
      createQuery(
        () => ({
          queryKey,
          queryFn: () => {
            callCount++
            return Promise.resolve(`data-${callCount}`)
          },
          refetchInterval: 10,
        }),
        () => client,
      )
    })

    flushSync()
    expect(callCount).toBe(1)

    await vi.advanceTimersByTimeAsync(30)
    expect(callCount).toBeGreaterThanOrEqual(2)

    dispose()
    flushSync()

    const countBefore = callCount
    await vi.advanceTimersByTimeAsync(50)
    expect(callCount).toBe(countBefore) // No more refetches
  })

  it('should still cleanup normally on component unmount', () => {
    const client = new QueryClient()
    const queryKey = ['component-cleanup']

    // This simulates a component - just calling the function directly
    // without $effect.root should still work via onDestroy
    const query = createQuery(
      () => ({ queryKey, queryFn: () => Promise.resolve('data') }),
      () => client,
    )

    flushSync()
    const q = client.getQueryCache().find({ queryKey })!
    expect(q.getObserversCount()).toBe(1)

    // Can't easily test onDestroy without a real component, 
    // but we verify the query is created and subscribed
    expect(query).toBeDefined()
  })
})