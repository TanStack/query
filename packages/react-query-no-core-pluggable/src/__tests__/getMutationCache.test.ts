import { describe, expect, it, vi } from 'vitest'
import {
  MutationCache,
  MutationObserver,
  QueryClient,
  dehydrate,
  getMutationCache,
  hydrate,
} from '..'
import { mutationCacheKey } from '../runtime/queryClient'

describe('getMutationCache', () => {
  it('keeps query-only hydration, resume and clear free of mutation caches', async () => {
    const server = new QueryClient()
    const client = new QueryClient()
    server.setQueryData(['books'], ['Dune'])
    hydrate(client, dehydrate(server))

    expect(client.getQueryData(['books'])).toStrictEqual(['Dune'])
    expect(client.isMutating()).toBe(0)
    await expect(client.resumePausedMutations()).resolves.toStrictEqual([])
    client.clear()
    expect(client.getQueryData(['books'])).toBeUndefined()
    expect(server[mutationCacheKey]).toBeUndefined()
    expect(client[mutationCacheKey]).toBeUndefined()
  })

  it('creates a stable cache per client and reuses it across mutations and clear', async () => {
    const first = new QueryClient()
    const second = new QueryClient()
    const cache = getMutationCache(first)
    const otherCache = getMutationCache(second)
    expect(cache).not.toBe(otherCache)
    const mutation = new MutationObserver(first, {
      mutationFn: (title: string) => Promise.resolve(title),
    })

    await mutation.mutate('Dune')
    expect(cache.getAll().map((entry) => entry.state.data)).toStrictEqual([
      'Dune',
    ])
    expect(otherCache.getAll()).toStrictEqual([])
    first.clear()
    expect(cache.getAll()).toStrictEqual([])
    expect(getMutationCache(first)).toBe(cache)
  })

  it('uses an injected cache for the first mutation and its callbacks', async () => {
    const onSuccess = vi.fn<() => void>()
    const cache = new MutationCache({ onSuccess })
    const client = new QueryClient({ mutationCache: cache })
    const mutation = new MutationObserver(client, {
      mutationKey: ['save'],
      mutationFn: () => Promise.resolve('saved'),
    })

    await mutation.mutate()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(getMutationCache(client)).toBe(cache)
    expect(cache.find({ mutationKey: ['save'] })?.state.data).toBe('saved')
    client.clear()
    expect(cache.getAll()).toStrictEqual([])
  })
})
