import { sleep, queryKey, mockConsoleError } from '../../react/tests/utils'
import { QueryCache, QueryClient } from '../..'

describe('queryCache', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
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
      expect(subscriber).toHaveBeenCalledWith({ query, type: 'queryAdded' })
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

    test('should include the queryCache and query when notifying listeners', async () => {
      const key = queryKey()
      const callback = jest.fn()
      queryCache.subscribe(callback)
      queryClient.prefetchQuery(key, () => 'data')
      const query = queryCache.find(key)
      await sleep(100)
      expect(callback).toHaveBeenCalledWith({ query, type: 'queryAdded' })
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
  })

  describe('findAll', () => {
    test('should filter correctly', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
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
      expect(queryCache.findAll([key1])).toEqual([query1])
      expect(queryCache.findAll()).toEqual([query1, query2, query3, query4])
      expect(queryCache.findAll({})).toEqual([query1, query2, query3, query4])
      expect(queryCache.findAll(key1, { active: false })).toEqual([query1])
      expect(queryCache.findAll(key1, { active: true })).toEqual([])
      expect(queryCache.findAll(key1, { stale: true })).toEqual([])
      expect(queryCache.findAll(key1, { stale: false })).toEqual([query1])
      expect(queryCache.findAll(key1, { stale: false, active: true })).toEqual(
        []
      )
      expect(
        queryCache.findAll(key1, { stale: false, active: false })
      ).toEqual([query1])
      expect(
        queryCache.findAll(key1, {
          stale: false,
          active: false,
          exact: true,
        })
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
      expect(
        queryCache.findAll([{ a: 'a', b: 'b' }], { exact: true })
      ).toEqual([query3])
      expect(queryCache.findAll([{ a: 'a', b: 'b' }])).toEqual([query3])
      expect(queryCache.findAll([{ a: 'a', b: 'b', c: 'c' }])).toEqual([])
      expect(queryCache.findAll([{ a: 'a' }], { stale: false })).toEqual([
        query3,
      ])
      expect(queryCache.findAll([{ a: 'a' }], { stale: true })).toEqual([])
      expect(queryCache.findAll([{ a: 'a' }], { active: true })).toEqual([])
      expect(queryCache.findAll([{ a: 'a' }], { inactive: true })).toEqual([
        query3,
      ])
      expect(
        queryCache.findAll({ predicate: query => query === query3 })
      ).toEqual([query3])
      expect(queryCache.findAll('posts')).toEqual([query4])
    })
  })

  describe('QueryCacheConfig.onError', () => {
    test('should be called when a query errors', async () => {
      const consoleMock = mockConsoleError()
      const key = queryKey()
      const onError = jest.fn()
      const testCache = new QueryCache({ onError })
      const testClient = new QueryClient({ queryCache: testCache })
      await testClient.prefetchQuery(key, () => Promise.reject('error'))
      consoleMock.mockRestore()
      const query = testCache.find(key)
      expect(onError).toHaveBeenCalledWith('error', query)
    })
  })
})
