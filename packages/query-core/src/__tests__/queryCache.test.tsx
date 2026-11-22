import { createKey, sleep } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryCache, QueryClient, QueryObserver, hashKey, noop } from '..'
import type { DefaultError, Query, QueryCacheNotifyEvent } from '..'

describe('queryCache', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  describe('subscribe', () => {
    it('should pass the correct query', () => {
      const key = createKey()
      const subscriber = vi.fn<(event: QueryCacheNotifyEvent) => void>()
      const unsubscribe = queryCache.subscribe(subscriber)
      queryClient.setQueryData(key, 'foo')
      const query = queryCache.find({ queryKey: key })
      expect(subscriber).toHaveBeenNthCalledWith(1, { query, type: 'added' })

      unsubscribe()
    })

    it('should notify listeners when new query is added', async () => {
      const key = createKey()
      const callback = vi.fn<(event: QueryCacheNotifyEvent) => void>()
      queryCache.subscribe(callback)
      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => 'data'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = queryCache.find({ queryKey: key })
      expect(callback).toHaveBeenNthCalledWith(1, { query, type: 'added' })
    })

    it('should notify query cache when a query becomes stale', async () => {
      const key = createKey()
      const events: Array<string> = []
      const queries: Array<unknown> = []
      const unsubscribe = queryCache.subscribe((event) => {
        events.push(event.type)
        queries.push(event.query)
      })

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        staleTime: 10,
      })

      const unsubScribeObserver = observer.subscribe(vi.fn())
      await vi.advanceTimersByTimeAsync(11)
      expect(events).toHaveLength(8)

      expect(events).toStrictEqual([
        'added', // 1. Query added -> loading
        'observerResultsUpdated', // 2. Observer result updated -> loading
        'observerAdded', // 3. Observer added
        'observerResultsUpdated', // 4. Observer result updated -> fetching
        'updated', // 5. Query updated -> fetching
        'observerResultsUpdated', // 6. Observer result updated -> success
        'updated', // 7. Query updated -> success
        'observerResultsUpdated', // 8. Observer result updated -> stale
      ])

      const cachedQuery = queryCache.find({ queryKey: key })
      queries.forEach((query) => {
        expect(query).toBe(cachedQuery)
      })

      unsubscribe()
      unsubScribeObserver()
    })

    it('should include the queryCache and query when notifying listeners', async () => {
      const key = createKey()
      const callback = vi.fn<(event: QueryCacheNotifyEvent) => void>()
      queryCache.subscribe(callback)
      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => 'data'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = queryCache.find({ queryKey: key })
      expect(callback).toHaveBeenNthCalledWith(1, { query, type: 'added' })
    })

    it('should notify subscribers when new query with initialData is added', async () => {
      const key = createKey()
      const callback = vi.fn<(event: QueryCacheNotifyEvent) => void>()
      queryCache.subscribe(callback)
      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => 'data'),
          initialData: 'initial',
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = queryCache.find({ queryKey: key })
      expect(callback).toHaveBeenNthCalledWith(1, { query, type: 'added' })
    })

    it('should be able to limit cache size', async () => {
      const testCache = new QueryCache()

      const unsubscribe = testCache.subscribe((event) => {
        if (event.type === 'added') {
          if (testCache.getAll().length > 2) {
            testCache
              .findAll({
                type: 'inactive',
                predicate: (q) => q !== event.query,
              })
              .forEach((query) => {
                testCache.remove(query)
              })
          }
        }
      })

      const testClient = new QueryClient({ queryCache: testCache })

      const key1 = createKey()
      const key2 = createKey()
      const key3 = createKey()
      void testClient
        .query({
          queryKey: key1,
          queryFn: () => sleep(100).then(() => 'data1'),
        })
        .catch(noop)
      expect(testCache.findAll()).toHaveLength(1)
      void testClient
        .query({
          queryKey: key2,
          queryFn: () => sleep(100).then(() => 'data2'),
        })
        .catch(noop)
      expect(testCache.findAll()).toHaveLength(2)
      void testClient
        .query({
          queryKey: key3,
          queryFn: () => sleep(100).then(() => 'data3'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      expect(testCache.findAll()).toHaveLength(1)
      expect(testCache.findAll()[0]!.state.data).toBe('data3')

      unsubscribe()
    })
  })

  describe('find', () => {
    it('should filter correctly with find', async () => {
      const key = createKey()
      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => 'data1'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = queryCache.find({ queryKey: key })!
      expect(query.state.data).toBe('data1')
    })

    it('should filter correctly with find when exact is set to false', async () => {
      const key = createKey()
      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => 'data1'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = queryCache.find({ queryKey: key, exact: false })!
      expect(query.state.data).toBe('data1')
    })

    it('should use the QueryCache equality function for partial query key matching', () => {
      const equalityFn = (a: unknown, b: unknown) =>
        typeof a === 'string' && typeof b === 'string'
          ? a.toLowerCase() === b.toLowerCase()
          : a === b
      const testCache = new QueryCache({ queryKey: { equalityFn } })
      const testClient = new QueryClient({ queryCache: testCache })
      const query = testClient.getQueryCache().build(testClient, {
        queryKey: ['todos', { status: 'done' }],
      })

      expect(
        testCache.find({
          queryKey: ['TODOS', { status: 'DONE' }],
          exact: false,
        }),
      ).toBe(query)
      expect(
        testCache.findAll({ queryKey: ['TODOS', { status: 'DONE' }] }),
      ).toEqual([query])

      testClient.clear()
    })
  })

  describe('findAll', () => {
    it('should filter correctly', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const keyFetching = createKey()
      void queryClient
        .query({
          queryKey: key1,
          queryFn: () => sleep(100).then(() => 'data1'),
        })
        .catch(noop)
      void queryClient
        .query({
          queryKey: key2,
          queryFn: () => sleep(100).then(() => 'data2'),
        })
        .catch(noop)
      void queryClient
        .query({
          queryKey: [{ a: 'a', b: 'b' }],
          queryFn: () => sleep(100).then(() => 'data3'),
        })
        .catch(noop)
      void queryClient
        .query({
          queryKey: ['posts', 1],
          queryFn: () => sleep(100).then(() => 'data4'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      queryClient.invalidateQueries({ queryKey: key2 })
      const query1 = queryCache.find({ queryKey: key1 })!
      const query2 = queryCache.find({ queryKey: key2 })!
      const query3 = queryCache.find({ queryKey: [{ a: 'a', b: 'b' }] })!
      const query4 = queryCache.find({ queryKey: ['posts', 1] })!

      expect(queryCache.findAll({ queryKey: key1 })).toStrictEqual([query1])
      // wrapping in an extra array doesn't yield the same results anymore since v4 because keys need to be an array
      expect(queryCache.findAll({ queryKey: [key1] })).toStrictEqual([])
      expect(queryCache.findAll()).toStrictEqual([
        query1,
        query2,
        query3,
        query4,
      ])
      expect(queryCache.findAll({})).toStrictEqual([
        query1,
        query2,
        query3,
        query4,
      ])
      expect(
        queryCache.findAll({ queryKey: key1, type: 'inactive' }),
      ).toStrictEqual([query1])
      expect(
        queryCache.findAll({ queryKey: key1, type: 'active' }),
      ).toStrictEqual([])
      expect(queryCache.findAll({ queryKey: key1, stale: true })).toStrictEqual(
        [],
      )
      expect(
        queryCache.findAll({ queryKey: key1, stale: false }),
      ).toStrictEqual([query1])
      expect(
        queryCache.findAll({ queryKey: key1, stale: false, type: 'active' }),
      ).toStrictEqual([])
      expect(
        queryCache.findAll({
          queryKey: key1,
          stale: false,
          type: 'inactive',
        }),
      ).toStrictEqual([query1])
      expect(
        queryCache.findAll({
          queryKey: key1,
          stale: false,
          type: 'inactive',
          exact: true,
        }),
      ).toStrictEqual([query1])

      expect(queryCache.findAll({ queryKey: key2 })).toStrictEqual([query2])
      expect(
        queryCache.findAll({ queryKey: key2, stale: undefined }),
      ).toStrictEqual([query2])
      expect(queryCache.findAll({ queryKey: key2, stale: true })).toStrictEqual(
        [query2],
      )
      expect(
        queryCache.findAll({ queryKey: key2, stale: false }),
      ).toStrictEqual([])
      expect(queryCache.findAll({ queryKey: [{ b: 'b' }] })).toStrictEqual([
        query3,
      ])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a' }], exact: false }),
      ).toStrictEqual([query3])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a' }], exact: true }),
      ).toStrictEqual([])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a', b: 'b' }], exact: true }),
      ).toStrictEqual([query3])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a', b: 'b' }] }),
      ).toStrictEqual([query3])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a', b: 'b', c: 'c' }] }),
      ).toStrictEqual([])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a' }], stale: false }),
      ).toStrictEqual([query3])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a' }], stale: true }),
      ).toStrictEqual([])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a' }], type: 'active' }),
      ).toStrictEqual([])
      expect(
        queryCache.findAll({ queryKey: [{ a: 'a' }], type: 'inactive' }),
      ).toStrictEqual([query3])
      expect(
        queryCache.findAll({ predicate: (query) => query === query3 }),
      ).toStrictEqual([query3])
      expect(queryCache.findAll({ queryKey: ['posts'] })).toStrictEqual([
        query4,
      ])

      expect(queryCache.findAll({ fetchStatus: 'idle' })).toStrictEqual([
        query1,
        query2,
        query3,
        query4,
      ])
      expect(
        queryCache.findAll({ queryKey: key2, fetchStatus: undefined }),
      ).toStrictEqual([query2])

      void queryClient
        .query({
          queryKey: keyFetching,
          queryFn: () => sleep(20).then(() => 'dataFetching'),
        })
        .catch(noop)
      expect(queryCache.findAll({ fetchStatus: 'fetching' })).toStrictEqual([
        queryCache.find({ queryKey: keyFetching }),
      ])
      await vi.advanceTimersByTimeAsync(20)
      expect(queryCache.findAll({ fetchStatus: 'fetching' })).toStrictEqual([])
    })

    it('should return all the queries when no filters are defined', async () => {
      const key1 = createKey()
      const key2 = createKey()
      await queryClient
        .query({
          queryKey: key1,
          queryFn: () => 'data1',
        })
        .catch(noop)
      await queryClient
        .query({
          queryKey: key2,
          queryFn: () => 'data2',
        })
        .catch(noop)
      expect(queryCache.findAll()).toHaveLength(2)
    })

    it('should return all the queries when key contains object with an undefined property (#3741)', async () => {
      const baseKey = createKey()

      const client = new QueryClient({
        queryCache: new QueryCache({
          queryKey: {
            equalityFn: (a, b) => b === undefined || Object.is(a, b),
          },
        }),
      })

      const keyForId = (id?: number) => [{ ...baseKey, a: id }]

      await client.query({ queryKey: keyForId(1), queryFn: () => 'data1' })
      await client.query({
        queryKey: keyForId(),
        queryFn: () => 'data-nothing',
      })
      expect(
        client.getQueryCache().findAll({ queryKey: keyForId() }),
      ).toHaveLength(2)
    })

    it('should invalidate matching dates (#10982)', async () => {
      const client = new QueryClient({
        queryCache: new QueryCache({
          queryKey: {
            equalityFn: (a, b) => {
              if (a instanceof Date && b instanceof Date) {
                return a.toISOString() === b.toISOString()
              }
              return a === b
            },
          },
        }),
      })

      await client.query({
        queryKey: ['report', { from: new Date('2020-01-01') }],
        queryFn: () => 'data1',
      })
      await client.query({
        queryKey: ['report', { from: new Date('2021-06-25') }],
        queryFn: () => 'data2',
      })

      expect(
        client.getQueryCache().findAll({
          queryKey: ['report', { from: new Date('2020-01-01') }],
        }),
      ).toHaveLength(1)
    })
  })

  describe('QueryCacheConfig error callbacks', () => {
    it('should call onError and onSettled when a query errors', async () => {
      const key = createKey()
      const onSuccess =
        vi.fn<
          (data: unknown, query: Query<unknown, unknown, unknown>) => void
        >()
      const onSettled =
        vi.fn<
          (
            data: unknown | undefined,
            error: DefaultError | null,
            query: Query<unknown, unknown, unknown>,
          ) => void
        >()
      const onError =
        vi.fn<
          (error: DefaultError, query: Query<unknown, unknown, unknown>) => void
        >()
      const testCache = new QueryCache({ onSuccess, onError, onSettled })
      const testClient = new QueryClient({ queryCache: testCache })
      void testClient
        .query({
          queryKey: key,
          queryFn: () =>
            sleep(100).then(() => Promise.reject<unknown>('error')),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = testCache.find({ queryKey: key })
      expect(onError).toHaveBeenCalledWith('error', query)
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith(undefined, 'error', query)
    })
  })

  describe('QueryCacheConfig success callbacks', () => {
    it('should call onSuccess and onSettled when a query is successful', async () => {
      const key = createKey()
      const onSuccess =
        vi.fn<
          (data: unknown, query: Query<unknown, unknown, unknown>) => void
        >()
      const onSettled =
        vi.fn<
          (
            data: unknown | undefined,
            error: DefaultError | null,
            query: Query<unknown, unknown, unknown>,
          ) => void
        >()
      const onError =
        vi.fn<
          (error: DefaultError, query: Query<unknown, unknown, unknown>) => void
        >()
      const testCache = new QueryCache({ onSuccess, onError, onSettled })
      const testClient = new QueryClient({ queryCache: testCache })
      void testClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => ({ data: 5 })),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)
      const query = testCache.find({ queryKey: key })
      expect(onSuccess).toHaveBeenCalledWith({ data: 5 }, query)
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onError).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith({ data: 5 }, null, query)
    })
  })

  describe('build', () => {
    it('should compute queryHash from queryKey when queryHash is not provided', () => {
      const key = createKey()

      const query = queryCache.build(queryClient, {
        queryKey: key,
      })

      expect(query.queryHash).toBe(hashKey(key))
    })

    it('should use the QueryCache query key hash function', () => {
      const key = createKey()
      const hashFn = vi.fn(() => 'custom-hash')
      const testCache = new QueryCache({ queryKey: { hashFn } })
      const testClient = new QueryClient({ queryCache: testCache })

      const query = testCache.build(testClient, { queryKey: key })

      expect(query.queryHash).toBe('custom-hash')
      expect(testCache.find({ queryKey: key })).toBe(query)
      expect(hashFn).toHaveBeenCalledWith(key)
    })

    it('should prefer the QueryCache query key hash function over the query option', () => {
      const key = createKey()
      const cacheHashFn = vi.fn(() => 'cache-hash')
      const queryHashFn = vi.fn(() => 'query-hash')
      const testCache = new QueryCache({
        queryKey: { hashFn: cacheHashFn },
      })
      const testClient = new QueryClient({ queryCache: testCache })

      const query = testCache.build(testClient, {
        queryKey: key,
        queryKeyHashFn: queryHashFn,
      })

      expect(query.queryHash).toBe('cache-hash')
      expect(cacheHashFn).toHaveBeenCalledWith(key)
      expect(queryHashFn).not.toHaveBeenCalled()
    })

    it('should use provided queryHash instead of computing it', () => {
      const key = createKey()
      const customHash = 'custom-hash'

      const query = queryCache.build(queryClient, {
        queryKey: key,
        queryHash: customHash,
      })

      expect(query.queryHash).toBe(customHash)
      expect(query.queryHash).not.toBe(hashKey(key))
    })
  })

  describe('QueryCache.remove', () => {
    it('should be a no-op if the query is no longer the cached instance', () => {
      const key = createKey()

      const staleQuery = queryCache.build(queryClient, { queryKey: key })
      queryCache.remove(staleQuery)

      const currentQuery = queryCache.build(queryClient, { queryKey: key })

      expect(currentQuery).not.toBe(staleQuery)
      const subscriber = vi.fn<(event: QueryCacheNotifyEvent) => void>()
      const unsubscribe = queryCache.subscribe(subscriber)

      queryCache.remove(staleQuery)

      expect(queryCache.get(hashKey(key))).toBe(currentQuery)
      expect(subscriber).not.toHaveBeenCalled()

      unsubscribe()
    })
  })

  describe('QueryCache.add', () => {
    it('should not try to add a query already added to the cache', async () => {
      const key = createKey()

      void queryClient
        .query({
          queryKey: key,
          queryFn: () => sleep(100).then(() => 'data1'),
        })
        .catch(noop)
      await vi.advanceTimersByTimeAsync(100)

      const query = queryCache.findAll()[0]!
      const queryClone = Object.assign({}, query)

      queryCache.add(queryClone)

      expect(queryCache.getAll()).toHaveLength(1)
    })
  })
})
