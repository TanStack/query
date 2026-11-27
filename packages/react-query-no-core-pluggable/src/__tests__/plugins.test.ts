import { describe, expect, it } from 'vitest'
import {
  MutationCache,
  MutationObserver,
  QueryClient,
  dehydrate,
  hydrate,
  infiniteQueryOptions,
  infiniteQueryPlugin,
  mutationPlugin,
} from '..'

const pages = infiniteQueryOptions({
  queryKey: ['pages'],
  initialPageParam: 1,
  queryFn: ({ pageParam }) => pageParam,
  getNextPageParam: (lastPage) => lastPage + 1,
})

describe('per-client plugins', () => {
  it('fetches, hydrates, and clears query data with the default client', async () => {
    const server = new QueryClient()
    const client = new QueryClient()

    await server.query({ queryKey: ['answer'], queryFn: () => 42 })
    const snapshot = dehydrate(server)
    expect(snapshot.mutations).toStrictEqual([])
    hydrate(client, snapshot)
    expect(client.getQueryData(['answer'])).toBe(42)
    expect(client.isMutating()).toBe(0)
    await client.resumePausedMutations()
    client.clear()
    expect(client.getQueryData(['answer'])).toBeUndefined()
  })

  it('identifies missing plugins at their entry points', async () => {
    const client = new QueryClient()

    expect(() => new MutationObserver(client, {})).toThrow('mutationPlugin')
    await expect(client.infiniteQuery(pages)).rejects.toThrow(
      'infiniteQueryPlugin',
    )
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('installs mutations on an individual client and honors a supplied cache', async () => {
    const cache = new MutationCache()
    const client = new QueryClient({
      plugins: [mutationPlugin],
      mutationCache: cache,
    })
    const other = new QueryClient({ plugins: [mutationPlugin] })

    const observer = new MutationObserver(client, {
      mutationFn: () => Promise.resolve(42),
    })
    await expect(observer.mutate()).resolves.toBe(42)
    expect(cache.getAll()).toHaveLength(1)
    expect(other.getMutationCache().getAll()).toHaveLength(0)
    const snapshot = dehydrate(client, { shouldDehydrateMutation: () => true })
    expect(() => hydrate(new QueryClient(), snapshot)).toThrow('mutationPlugin')
    hydrate(other, snapshot)
    expect(other.getMutationCache().getAll()[0]?.state.data).toBe(42)
    await expect(client.infiniteQuery(pages)).rejects.toThrow(
      'infiniteQueryPlugin',
    )
  })

  it('fetches and restores pages independently of mutation support', async () => {
    const server = new QueryClient({ plugins: [infiniteQueryPlugin] })
    const client = new QueryClient({ plugins: [infiniteQueryPlugin] })

    const data = await server.infiniteQuery({ ...pages, pages: 2 })
    expect(data).toStrictEqual({ pages: [1, 2], pageParams: [1, 2] })
    const snapshot = dehydrate(server)
    hydrate(client, snapshot)
    await expect(client.infiniteQuery(pages)).resolves.toStrictEqual(data)
    expect(() => client.getMutationCache()).toThrow('mutationPlugin')
  })
})
