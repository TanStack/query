import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MutationObserver, QueryClient, QueryObserver } from '..'

describe('garbage collection after cache removal', () => {
  let client: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient({
      defaultOptions: {
        queries: { gcTime: 1000 },
        mutations: { gcTime: 1000 },
      },
    })
  })

  afterEach(() => {
    client.clear()
    vi.useRealTimers()
  })

  it('clears an existing mutation timer on clear', () => {
    const cache = client.getMutationCache()
    cache.build(client, {})
    expect(vi.getTimerCount()).toBe(1)

    cache.clear()

    expect(cache.getAll()).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears an existing mutation timer on remove', () => {
    const cache = client.getMutationCache()
    const mutation = cache.build(client, {})
    expect(vi.getTimerCount()).toBe(1)

    cache.remove(mutation)

    expect(cache.getAll()).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not schedule mutation GC when an observer resets after clear', async () => {
    const observer = new MutationObserver(client, {
      mutationFn: () => Promise.resolve('done'),
    })
    await observer.mutate()
    expect(vi.getTimerCount()).toBe(0)

    client.clear()
    observer.reset()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps only the replacement query timer when a removed fetch settles', async () => {
    const queryKey = ['replacement']
    const pending = client.query({
      queryKey,
      queryFn: ({ signal }) =>
        new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason))
        }),
    })

    client.clear()
    client.setQueryData(queryKey, 'replacement')
    await expect(pending).rejects.toThrow('CancelledError')

    expect(client.getQueryData(queryKey)).toBe('replacement')
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('does not schedule query GC when an observer unsubscribes after clear', async () => {
    const queryKey = ['observed']
    await client.query({ queryKey, queryFn: () => Promise.resolve('data') })
    const observer = new QueryObserver(client, {
      queryKey,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe(() => {})
    expect(vi.getTimerCount()).toBe(0)

    client.clear()
    unsubscribe()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps garbage collecting an unobserved query that is reset', async () => {
    const queryKey = ['reset']
    await client.query({ queryKey, queryFn: () => Promise.resolve('data') })
    expect(vi.getTimerCount()).toBe(1)

    await client.resetQueries({ queryKey })

    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('clears a timer scheduled by an abort listener during removal', async () => {
    const observer = new QueryObserver(client, {
      queryKey: ['aborted'],
      queryFn: ({ signal }) =>
        new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => {
            unsubscribe()
            reject(signal.reason)
          })
        }),
    })
    const unsubscribe = observer.subscribe(() => {})
    const query = observer.getCurrentQuery()
    expect(vi.getTimerCount()).toBe(0)

    client.clear()
    const timersAfterClear = vi.getTimerCount()
    await query.cancel()

    expect(timersAfterClear).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
