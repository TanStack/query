import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKey } from '@tanstack/query-test-utils'
import { MutationObserver, QueryClient, QueryObserver, noop } from '..'

const removalOperations: Record<
  'clear' | 'remove',
  (clear: () => void, remove: () => void) => void
> = {
  clear: (clear) => clear(),
  remove: (_clear, remove) => remove(),
}

describe('garbage collection after cache removal', () => {
  let client: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient()
  })

  afterEach(() => {
    client.clear()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it.each(['clear', 'remove'] as const)(
    'cancels a mutation timer on %s',
    (operation) => {
      const cache = client.getMutationCache()
      const mutation = cache.build(client, { gcTime: 1000 })
      expect(vi.getTimerCount()).toBe(1)

      removalOperations[operation](
        () => client.clear(),
        () => cache.remove(mutation),
      )

      expect(cache.getAll()).toStrictEqual([])
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it.each(['clear', 'remove'] as const)(
    'does not schedule a removed mutation when its observer resets after %s',
    async (operation) => {
      const cache = client.getMutationCache()
      const observer = new MutationObserver(client, {
        gcTime: 1000,
        mutationFn: () => Promise.resolve('done'),
      })
      const unsubscribe = observer.subscribe(noop)
      await observer.mutate()
      const mutation = cache.getAll()[0]!

      removalOperations[operation](
        () => client.clear(),
        () => cache.remove(mutation),
      )
      observer.reset()

      expect(cache.getAll()).toStrictEqual([])
      expect(vi.getTimerCount()).toBe(0)
      unsubscribe()
    },
  )

  it('continues a removed pending mutation including retries and callbacks', async () => {
    const onSuccess = vi.fn<(data: string) => void>()
    const mutationFn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('retry'))
      .mockResolvedValueOnce('done')
    const observer = new MutationObserver(client, {
      gcTime: 1000,
      retry: 1,
      retryDelay: 20,
      mutationFn,
      onSuccess,
    })
    const unsubscribe = observer.subscribe(noop)
    const result = observer.mutate(undefined)
    await vi.advanceTimersByTimeAsync(0)
    client.clear()
    observer.reset()
    await vi.advanceTimersByTimeAsync(20)

    await expect(result).resolves.toBe('done')
    expect(mutationFn).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(client.getMutationCache().getAll()).toStrictEqual([])
    expect(vi.getTimerCount()).toBe(0)
    unsubscribe()
  })

  it.each(['clear', 'remove'] as const)(
    'does not reschedule a cancelled query after %s',
    async (operation) => {
      const cache = client.getQueryCache()
      const query = cache.build(client, {
        queryKey: createKey(),
        gcTime: 1000,
        queryFn: () => new Promise<string>(noop),
      })
      const result = query.fetch().catch(noop)
      expect(vi.getTimerCount()).toBe(1)

      removalOperations[operation](
        () => client.clear(),
        () => cache.remove(query),
      )
      await result

      expect(cache.getAll()).toStrictEqual([])
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it.each(['clear', 'remove'] as const)(
    'does not reschedule a removed active query after abort and unsubscribe on %s',
    async (operation) => {
      const cache = client.getQueryCache()
      const key = createKey()
      const observer = new QueryObserver(client, {
        queryKey: key,
        gcTime: 1000,
        queryFn: ({ signal }) => {
          signal.addEventListener('abort', noop)
          return new Promise<string>(noop)
        },
      })
      const unsubscribe = observer.subscribe(noop)
      const query = cache.find({ queryKey: key })!

      removalOperations[operation](
        () => client.clear(),
        () => cache.remove(query),
      )
      await vi.advanceTimersByTimeAsync(0)
      unsubscribe()

      expect(cache.getAll()).toStrictEqual([])
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('does not schedule an old query on unsubscribe when a replacement has the same hash', async () => {
    const key = createKey()
    const cache = client.getQueryCache()
    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
      gcTime: 1000,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(noop)
    const old = cache.find({ queryKey: key })!
    cache.remove(old)
    const replacement = cache.build(client, { queryKey: key, gcTime: 1000 })
    await vi.advanceTimersByTimeAsync(0)
    unsubscribe()

    expect(cache.get(old.queryHash)).toBe(replacement)
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(cache.get(old.queryHash)).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not schedule a cancelled query when a replacement has the same hash', async () => {
    const cache = client.getQueryCache()
    const key = createKey()
    const old = cache.build(client, {
      queryKey: key,
      queryFn: () => new Promise<string>(noop),
      gcTime: 1000,
    })
    const result = old.fetch().catch(noop)
    cache.remove(old)
    const replacement = cache.build(client, { queryKey: key, gcTime: 1000 })
    await result

    expect(cache.get(old.queryHash)).toBe(replacement)
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(cache.get(old.queryHash)).toBeUndefined()
  })

  it('still collects an observed query after it is reset and unsubscribed', async () => {
    const key = createKey()
    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
      gcTime: 1000,
    })
    const unsubscribe = observer.subscribe(noop)
    await observer.refetch()
    const query = client.getQueryCache().find({ queryKey: key })!
    query.reset()
    await observer.refetch()
    unsubscribe()

    await vi.advanceTimersByTimeAsync(1000)
    expect(client.getQueryCache().find({ queryKey: key })).toBeUndefined()
  })

  it('still collects a removed query re-added and used by an observer', async () => {
    const key = createKey()
    const cache = client.getQueryCache()
    const query = cache.build(client, {
      queryKey: key,
      queryFn: () => Promise.resolve('data'),
      gcTime: 1000,
    })
    cache.remove(query)
    cache.add(query)
    const observer = new QueryObserver(client, {
      ...query.options,
      queryKey: key,
    })
    const unsubscribe = observer.subscribe(noop)
    await observer.refetch()
    unsubscribe()

    await vi.advanceTimersByTimeAsync(1000)
    expect(cache.find({ queryKey: key })).toBeUndefined()
  })

  it('still collects a removed mutation re-added and used by an observer', async () => {
    const cache = client.getMutationCache()
    const mutation = cache.build(client, { gcTime: 1000 })
    cache.remove(mutation)
    cache.add(mutation)
    const observer = new MutationObserver(client, { gcTime: 1000 })
    mutation.addObserver(observer)
    mutation.removeObserver(observer)

    await vi.advanceTimersByTimeAsync(1000)
    expect(cache.getAll()).toStrictEqual([])
  })
})
