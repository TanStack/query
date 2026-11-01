import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKey, sleep } from '@tanstack/query-test-utils'
import {
  InfiniteQueryObserver,
  QueryCache,
  QueryClient,
  QueryObserver,
} from '..'
import type { QueryFunction, QueryKey, QueryPersister } from '..'

describe('query execution', () => {
  let queryCache: QueryCache
  let clientA: QueryClient
  let clientB: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    clientA = new QueryClient({ queryCache })
    clientB = new QueryClient({ queryCache })
  })

  afterEach(() => {
    queryCache.clear()
    vi.useRealTimers()
  })

  it('uses the fetching client for a query created by another client', async () => {
    const queryKey = createKey()
    clientA.setQueryData(queryKey, 'seed')
    const query = queryCache.find({ queryKey })

    const data = await clientB.query({
      queryKey,
      queryFn: ({ client }) => (client === clientB ? 'B' : 'A'),
    })

    expect(data).toBe('B')
    expect(queryCache.find({ queryKey })).toBe(query)
  })

  it.each(['refetch', 'fetchOptimistic'] as const)(
    'uses the observer client for %s',
    async (method) => {
      const queryKey = createKey()
      clientA.setQueryData(queryKey, 'seed')
      const queryFn = vi.fn<QueryFunction<string>>(({ client }) =>
        client === clientB ? 'B' : 'A',
      )
      const options = { queryKey, queryFn, enabled: false }
      const observer = new QueryObserver(clientB, options)

      await (method === 'refetch'
        ? observer.refetch()
        : observer.fetchOptimistic(options))
      await vi.advanceTimersByTimeAsync(0)

      expect(clientB.getQueryData(queryKey)).toBe('B')
      expect(queryFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ client: clientB }),
      )
    },
  )

  it('does not merge the creating client defaults into replacement options', async () => {
    const queryKey = createKey()
    clientA.setQueryDefaults(queryKey, { meta: { source: 'A' } })
    clientA.setQueryData(queryKey, 'seed')

    const data = await clientB.query({
      queryKey,
      queryFn: ({ meta }) => meta?.source ?? 'none',
    })

    expect(data).toBe('none')
    expect(queryCache.find({ queryKey })?.meta).toBeUndefined()
  })

  it('uses the refetching client with the latest cached options', async () => {
    const queryKey = createKey()
    const queryFn = vi.fn<QueryFunction<string>>(({ client }) =>
      client === clientB ? 'B' : 'A',
    )
    await clientA.query({ queryKey, queryFn, meta: { source: 'cached' } })

    await clientB.refetchQueries({ queryKey })

    expect(clientB.getQueryData(queryKey)).toBe('B')
    expect(queryFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ client: clientB, meta: { source: 'cached' } }),
    )
  })

  it('keeps the execution configuration when options change and another client joins', async () => {
    const queryKey = createKey()
    const queryFnA = vi
      .fn<QueryFunction<string>>()
      .mockRejectedValueOnce(new Error('retry'))
      .mockResolvedValue('A')
    const queryFnB = vi.fn<QueryFunction<string>>(() => 'B')
    const persisterA = vi.fn<QueryPersister<string>>((queryFn, context) =>
      queryFn(context),
    )
    const persisterB = vi.fn<QueryPersister<string>>((queryFn, context) =>
      queryFn(context),
    )
    const observer = new QueryObserver(clientA, {
      queryKey,
      queryFn: queryFnA,
      persister: persisterA,
      meta: { source: 'A' },
      enabled: false,
      retry: 1,
      retryDelay: 10,
    })
    const first = observer.refetch({ throwOnError: true })
    await vi.advanceTimersByTimeAsync(0)

    observer.setOptions({
      queryKey,
      queryFn: queryFnB,
      persister: persisterB,
      meta: { source: 'B' },
      enabled: false,
    })
    const joined = clientB.query({ queryKey, queryFn: queryFnB })
    await vi.advanceTimersByTimeAsync(10)

    expect((await first).data).toBe('A')
    await expect(joined).resolves.toBe('A')
    expect(queryFnA).toHaveBeenCalledTimes(2)
    expect(persisterA).toHaveBeenCalledTimes(2)
    expect(queryFnB).not.toHaveBeenCalled()
    expect(persisterB).not.toHaveBeenCalled()
    for (const [context] of queryFnA.mock.calls) {
      expect(context).toMatchObject({ client: clientA, meta: { source: 'A' } })
    }
  })

  it('uses the replacing client after cancelling a cached-data refetch', async () => {
    const queryKey = createKey()
    clientA.setQueryData(queryKey, 'seed')
    const observerA = new QueryObserver(clientA, {
      queryKey,
      queryFn: () => sleep(100).then(() => 'A'),
      enabled: false,
    })
    const first = observerA.refetch({ throwOnError: true })
    const queryFnB = vi.fn<QueryFunction<string>>(({ client }) =>
      client === clientB ? 'B' : 'A',
    )
    const observerB = new QueryObserver(clientB, {
      queryKey,
      queryFn: queryFnB,
      enabled: false,
    })

    expect((await observerB.refetch()).data).toBe('B')
    expect((await first).data).toBe('B')
    expect(queryFnB).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(100)
    expect(clientB.getQueryData(queryKey)).toBe('B')
  })

  it('binds a previously missing query function without replacing the execution context', async () => {
    const queryKey = createKey()
    clientA.setQueryData(queryKey, 'seed')
    const options = {
      queryKey,
      enabled: false,
      retry: 1,
      retryDelay: 10,
      meta: { source: 'start' },
    }
    const observer = new QueryObserver<string>(clientB, options)
    const result = observer.refetch({ throwOnError: true })
    await vi.advanceTimersByTimeAsync(0)
    const queryFn = vi.fn<QueryFunction<string>>(() => 'B')
    observer.setOptions({
      ...options,
      queryFn,
      meta: { source: 'later' },
    })
    await vi.advanceTimersByTimeAsync(10)

    expect((await result).data).toBe('B')
    expect(queryFn).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ client: clientB, meta: { source: 'start' } }),
    )
  })

  it('keeps the client and configuration for all infinite query pages', async () => {
    const queryKey = createKey()
    clientA.setQueryData(queryKey, { pages: [1, 2], pageParams: [1, 2] })
    const queryFn = vi.fn<QueryFunction<number, QueryKey, number>>(
      ({ pageParam }) => sleep(10).then(() => pageParam),
    )
    const options = {
      queryKey,
      queryFn,
      initialPageParam: 1,
      getNextPageParam: (lastPage: number) => lastPage + 1,
      meta: { source: 'start' },
      enabled: false,
    }
    const observer = new InfiniteQueryObserver(clientB, options)
    const result = observer.refetch({ throwOnError: true })
    await vi.advanceTimersByTimeAsync(0)
    const replacement = vi.fn<QueryFunction<number, QueryKey, number>>(() => 99)
    observer.setOptions({
      ...options,
      queryFn: replacement,
      getNextPageParam: () => 99,
      meta: { source: 'later' },
    })
    await vi.advanceTimersByTimeAsync(20)

    expect((await result).data).toStrictEqual({
      pages: [1, 2],
      pageParams: [1, 2],
    })
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(replacement).not.toHaveBeenCalled()
    for (const [context] of queryFn.mock.calls) {
      expect(context).toMatchObject({
        client: clientB,
        meta: { source: 'start' },
      })
    }
  })
})
