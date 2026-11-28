import { describe, expect, it, vi } from 'vitest'
import {
  MutationCache,
  MutationObserver,
  QueryClient,
  dehydrate,
  getMutationCache,
  hydrate,
} from '..'
import {
  clearQueryClient,
  getQueryData,
  isMutating,
  mutationCacheKey,
  resumePausedMutations,
  setQueryData,
} from '../queryClient'

describe('getMutationCache', () => {
  it('keeps query-only hydration, resume and clear free of mutation caches', async () => {
    const server = new QueryClient()
    const client = new QueryClient()
    setQueryData(server, ['books'], ['Dune'])
    hydrate(client, dehydrate(server))

    expect(getQueryData(client, ['books'])).toStrictEqual(['Dune'])
    expect(isMutating(client)).toBe(0)
    await expect(resumePausedMutations(client)).resolves.toStrictEqual([])
    clearQueryClient(client)
    expect(getQueryData(client, ['books'])).toBeUndefined()
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
    clearQueryClient(first)
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
    clearQueryClient(client)
    expect(cache.getAll()).toStrictEqual([])
  })
})
