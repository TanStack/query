import { sleep, queryKey, createQueryClient } from './utils'
import type { QueryClient } from '..'
import { QueryCache, QueryObserver } from '..'
import type { Query } from '.././query'
import { waitFor } from '@testing-library/react'

describe('queryCache', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = createQueryClient()
    queryCache = queryClient.getQueryCache()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('subscribe', () => {
    test('should pass the correct query', async () => {
      const key = queryKey()
      const subscriber = jest.fn()
      const unsubscribe = queryCache.subscribe(subscriber)
      queryClient.setQueryData(key, 'foo')
      const query = queryCache.find(key)
      await sleep(1)
      expect(subscriber).toHaveBeenCalledWith({ query, type: 'added' })
      unsubscribe()
    })

    test('should notify listeners when new query is added', async () => {
      const key = queryKey()
      const callback = jest.fn()
      queryCache.subscribe(callback)
      queryClient.prefetchQuery(key, () => 'data')
      await sleep(100)
      expect(callback).toHaveBeenCalled()
    })

    test('should notify query cache when a query becomes stale', async () => {
      const key = queryKey()
      const events: Array<string> = []
      const unsubscribe = queryCache.subscribe((event) => {
        events.push(event.type)
      })

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        staleTime: 10,
      })

      const unsubScribeObserver = observer.subscribe(jest.fn)

      await waitFor(() => {
        expect(events.length).toBe(8)
      })

      expect(events).toEqual([
        'added', // 1. Query added -> loading
        'observerResultsUpdated', // 2. Observer result updated -> loading
        'observerAdded', // 3. Observer added
        'observerResultsUpdated', // 4. Observer result updated -> fetching
        'updated', // 5. Query updated -> fetching
        'observerResultsUpdated', // 6. Observer result updated -> success
        'updated', // 7. Query updated -> success
        'observerResultsUpdated', // 8. Observer result updated -> stale
      ])

      unsubscribe()
      unsubScribeObserver()
    })

    test('should include the queryCache and query when notifying listeners', async () => {
      const key = queryKey()
      const callback = jest.fn()
      queryCache.subscribe(callback)
      queryClient.prefetchQuery(key, () => 'data')
      const query = queryCache.find(key)
      await sleep(100)
      expect(callback).toHaveBeenCalledWith({ query, type: 'added' })
    })

    test('should notify subscribers when new query with initialData is added', async () => {
      const key = queryKey()
      const callback = jest.fn()
      queryCache.subscribe(callback)
      queryClient.prefetchQuery(key, () => 'data', {
        initialData: 'initial',
      })
      await sleep(100)
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('find', () => {
    test('find should filter correctly', async () => {
      const key = queryKey()
      await queryClient.prefetchQuery(key, () => 'data1')
      const query = queryCache.find(key)!
      expect(query).toBeDefined()
    })

    test('find should filter correctly with exact set to false', async () => {
      const key = queryKey()
      await queryClient.prefetchQuery(key, () => 'data1')
      const query = queryCache.find(key, { exact: false })!
      expect(query).toBeDefined()
    })
  })

  describe('findAll', () => {
    test('should filter correctly', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const keyFetching = queryKey()
      await queryClient.prefetchQuery(key1, () => 'data1')
      await queryClient.prefetchQuery(key2, () => 'data2')
      await queryClient.prefetchQuery([{ a: 'a', b: 'b' }], () => 'data3')
      await queryClient.prefetchQuery(['posts', 1], () => 'data4')
      queryClient.invalidateQueries(key2)
      const query1 = queryCache.find(key1)!
      const query2 = queryCache.find(key2)!
      const query3 = queryCache.find([{ a: 'a', b: 'b' }])!
      const query4 = queryCache.find(['posts', 1])!

      expect(queryCache.findAll(key1)).toEqual([query1])
      // wrapping in an extra array doesn't yield the same results anymore since v4 because keys need to be an array
      expect(queryCache.findAll([key1])).toEqual([])
      expect(queryCache.findAll()).toEqual([query1, query2, query3, query4])
      expect(queryCache.findAll({})).toEqual([query1, query2, query3, query4])
      expect(queryCache.findAll(key1, { type: 'inactive' })).toEqual([query1])
      expect(queryCache.findAll(key1, { type: 'active' })).toEqual([])
      expect(queryCache.findAll(key1, { stale: true })).toEqual([])
      expect(queryCache.findAll(key1, { stale: false })).toEqual([query1])
      expect(
        queryCache.findAll(key1, { stale: false, type: 'active' }),
      ).toEqual([])
      expect(
        queryCache.findAll(key1, { stale: false, type: 'inactive' }),
      ).toEqual([query1])
      expect(
        queryCache.findAll(key1, {
          stale: false,
          type: 'inactive',
          exact: true,
        }),
      ).toEqual([query1])

      expect(queryCache.findAll(key2)).toEqual([query2])
      expect(queryCache.findAll(key2, { stale: undefined })).toEqual([query2])
      expect(queryCache.findAll(key2, { stale: true })).toEqual([query2])
      expect(queryCache.findAll(key2, { stale: false })).toEqual([])
      expect(queryCache.findAll([{ b: 'b' }])).toEqual([query3])
      expect(queryCache.findAll([{ a: 'a' }], { exact: false })).toEqual([
        query3,
      ])
      expect(queryCache.findAll([{ a: 'a' }], { exact: true })).toEqual([])
      expect(queryCache.findAll([{ a: 'a', b: 'b' }], { exact: true })).toEqual(
        [query3],
      )
      expect(queryCache.findAll([{ a: 'a', b: 'b' }])).toEqual([query3])
      expect(queryCache.findAll([{ a: 'a', b: 'b', c: 'c' }])).toEqual([])
      expect(queryCache.findAll([{ a: 'a' }], { stale: false })).toEqual([
        query3,
      ])
      expect(queryCache.findAll([{ a: 'a' }], { stale: true })).toEqual([])
      expect(queryCache.findAll([{ a: 'a' }], { type: 'active' })).toEqual([])
      expect(queryCache.findAll([{ a: 'a' }], { type: 'inactive' })).toEqual([
        query3,
      ])
      expect(
        queryCache.findAll({ predicate: (query) => query === query3 }),
      ).toEqual([query3])
      expect(queryCache.findAll(['posts'])).toEqual([query4])

      expect(queryCache.findAll({ fetchStatus: 'idle' })).toEqual([
        query1,
        query2,
        query3,
        query4,
      ])
      expect(queryCache.findAll(key2, { fetchStatus: undefined })).toEqual([
        query2,
      ])

      const promise = queryClient.prefetchQuery(keyFetching, async () => {
        await sleep(20)
        return 'dataFetching'
      })
      expect(queryCache.findAll({ fetchStatus: 'fetching' })).toEqual([
        queryCache.find(keyFetching),
      ])
      await promise
      expect(queryCache.findAll({ fetchStatus: 'fetching' })).toEqual([])
    })

    test('should return all the queries when no filters are defined', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      await queryClient.prefetchQuery(key1, () => 'data1')
      await queryClient.prefetchQuery(key2, () => 'data2')
      expect(queryCache.findAll().length).toBe(2)
    })
  })

  describe('QueryCacheConfig error callbacks', () => {
    test('should call onError and onSettled when a query errors', async () => {
      const key = queryKey()
      const onSuccess = jest.fn()
      const onSettled = jest.fn()
      const onError = jest.fn()
      const testCache = new QueryCache({ onSuccess, onError, onSettled })
      const testClient = createQueryClient({ queryCache: testCache })
      await testClient.prefetchQuery(key, () =>
        Promise.reject<unknown>('error'),
      )
      const query = testCache.find(key)
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith('error', query)
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith(undefined, 'error', query)
    })
  })

  describe('QueryCacheConfig success callbacks', () => {
    test('should call onSuccess and onSettled when a query is successful', async () => {
      const key = queryKey()
      const onSuccess = jest.fn()
      const onSettled = jest.fn()
      const onError = jest.fn()
      const testCache = new QueryCache({ onSuccess, onError, onSettled })
      const testClient = createQueryClient({ queryCache: testCache })
      await testClient.prefetchQuery(key, () => Promise.resolve({ data: 5 }))
      const query = testCache.find(key)
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledWith({ data: 5 }, query)
      expect(onError).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith({ data: 5 }, null, query)
    })
  })

  describe('QueryCache.add', () => {
    test('should not try to add a query already added to the cache', async () => {
      const key = queryKey()
      const hash = `["${key}"]`

      await queryClient.prefetchQuery(key, () => 'data1')

      // Directly add the query from the cache
      // to simulate a race condition
      const query = queryCache['queriesMap'][hash] as Query
      const queryClone = Object.assign({}, query)

      // No error should be thrown when trying to add the query
      queryCache.add(queryClone)
      expect(queryCache['queries'].length).toEqual(1)

      // Clean-up to avoid an error when queryClient.clear()
      delete queryCache['queriesMap'][hash]
    })

    describe('QueryCache.remove', () => {
      test('should not try to remove a query already removed from the cache', async () => {
        const key = queryKey()
        const hash = `["${key}"]`

        await queryClient.prefetchQuery(key, () => 'data1')

        // Directly remove the query from the cache
        // to simulate a race condition
        const query = queryCache['queriesMap'][hash] as Query
        const queryClone = Object.assign({}, query)
        delete queryCache['queriesMap'][hash]

        // No error should be thrown when trying to remove the query
        expect(() => queryCache.remove(queryClone)).not.toThrow()
      })
    })
  })
})
