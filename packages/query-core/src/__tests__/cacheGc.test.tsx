import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MutationObserver,
  QueryClient,
  QueryObserver,
  clearQueryClient,
  query as fetchQueryData,
  getMutationCache,
  getQueryCache,
  getQueryData,
  setQueryData,
} from '..'
import { Mutation } from '../mutation'

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
    clearQueryClient(client)
    vi.useRealTimers()
  })

  it('clears an existing mutation timer on clear', () => {
    const cache = getMutationCache(client)
    Mutation.build(client, {})
    expect(vi.getTimerCount()).toBe(1)

    cache.clear()

    expect(cache.getAll()).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears an existing mutation timer on remove', () => {
    const cache = getMutationCache(client)
    const mutation = Mutation.build(client, {})
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

    clearQueryClient(client)
    observer.reset()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps only the replacement query timer when a removed fetch settles', async () => {
    const queryKey = ['replacement']
    const pending = fetchQueryData(client, {
      queryKey,
      queryFn: ({ signal }) =>
        new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason))
        }),
    })

    clearQueryClient(client)
    setQueryData(client, queryKey, 'replacement')
    await expect(pending).rejects.toThrow('CancelledError')

    expect(getQueryData(client, queryKey)).toBe('replacement')
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(getQueryCache(client).getAll()).toHaveLength(0)
  })

  it('does not schedule query GC when an observer unsubscribes after clear', async () => {
    const queryKey = ['observed']
    const queryFn = () => Promise.resolve('data')
    await fetchQueryData(client, { queryKey, queryFn })
    const observer = new QueryObserver(client, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe(() => {})
    expect(vi.getTimerCount()).toBe(0)

    clearQueryClient(client)
    unsubscribe()

    expect(vi.getTimerCount()).toBe(0)
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

    clearQueryClient(client)
    const timersAfterClear = vi.getTimerCount()
    await query.cancel()

    expect(timersAfterClear).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
