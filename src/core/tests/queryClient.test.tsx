import { sleep, queryKey, mockConsoleError } from '../../react/tests/utils'
import {
  InfiniteQueryObserver,
  QueryCache,
  QueryClient,
  QueryFunction,
  QueryObserver,
  MutationObserver,
} from '../..'
import { focusManager, onlineManager } from '..'

describe('queryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('defaultOptions', () => {
    test('should merge defaultOptions', async () => {
      const key = queryKey()

      const queryFn = () => 'data'
      const testClient = new QueryClient({
        defaultOptions: { queries: { queryFn } },
      })

      expect(() => testClient.prefetchQuery(key)).not.toThrow()
    })

    test('should merge defaultOptions when query is added to cache', async () => {
      const key = queryKey()

      const testClient = new QueryClient({
        defaultOptions: {
          queries: { cacheTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve(undefined)
      await testClient.prefetchQuery(key, fetchData)
      const newQuery = testClient.getQueryCache().find(key)
      expect(newQuery?.options.cacheTime).toBe(Infinity)
    })

    test('should get defaultOptions', async () => {
      const queryFn = () => 'data'
      const defaultOptions = { queries: { queryFn } }
      const testClient = new QueryClient({
        defaultOptions,
      })
      expect(testClient.getDefaultOptions()).toMatchObject(defaultOptions)
    })
  })

  describe('setQueryDefaults', () => {
    test('should not trigger a fetch', async () => {
      const key = queryKey()
      queryClient.setQueryDefaults(key, { queryFn: () => 'data' })
      await sleep(1)
      const data = queryClient.getQueryData(key)
      expect(data).toBeUndefined()
    })

    test('should be able to override defaults', async () => {
      const key = queryKey()
      queryClient.setQueryDefaults(key, { queryFn: () => 'data' })
      const observer = new QueryObserver(queryClient, { queryKey: key })
      const { data } = await observer.refetch()
      expect(data).toBe('data')
    })

    test('should match the query key partially', async () => {
      const key = queryKey()
      queryClient.setQueryDefaults([key], { queryFn: () => 'data' })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key, 'a'],
      })
      const { data } = await observer.refetch()
      expect(data).toBe('data')
    })

    test('should not match if the query key is a subset', async () => {
      const consoleMock = mockConsoleError()
      const key = queryKey()
      queryClient.setQueryDefaults([key, 'a'], { queryFn: () => 'data' })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key],
        retry: false,
        enabled: false,
      })
      const { status } = await observer.refetch()
      expect(status).toBe('error')
      consoleMock.mockRestore()
    })

    test('should also set defaults for observers', async () => {
      const key = queryKey()
      queryClient.setQueryDefaults(key, {
        queryFn: () => 'data',
        enabled: false,
      })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key],
      })
      expect(observer.getCurrentResult().status).toBe('idle')
    })

    test('should update existing query defaults', async () => {
      const key = queryKey()
      const queryOptions1 = { queryFn: () => 'data' }
      const queryOptions2 = { retry: false }
      queryClient.setQueryDefaults(key, queryOptions1)
      queryClient.setQueryDefaults(key, queryOptions2)
      expect(queryClient.getQueryDefaults(key)).toMatchObject(queryOptions2)
    })
  })

  describe('setQueryData', () => {
    test('should not crash if query could not be found', () => {
      const key = queryKey()
      const user = { userId: 1 }
      expect(() => {
        queryClient.setQueryData([key, user], (prevUser?: typeof user) => ({
          ...prevUser!,
          name: 'Edvin',
        }))
      }).not.toThrow()
    })

    test('should not crash when variable is null', () => {
      const key = queryKey()
      queryClient.setQueryData([key, { userId: null }], 'Old Data')
      expect(() => {
        queryClient.setQueryData([key, { userId: null }], 'New Data')
      }).not.toThrow()
    })

    test('should use default options', () => {
      const key = queryKey()
      const testClient = new QueryClient({
        defaultOptions: { queries: { queryKeyHashFn: () => 'someKey' } },
      })
      const testCache = testClient.getQueryCache()
      testClient.setQueryData(key, 'data')
      expect(testClient.getQueryData(key)).toBe('data')
      expect(testCache.find(key)).toBe(testCache.get('someKey'))
    })

    test('should create a new query if query was not found', () => {
      const key = queryKey()
      queryClient.setQueryData(key, 'bar')
      expect(queryClient.getQueryData(key)).toBe('bar')
    })

    test('should create a new query if query was not found', () => {
      const key = queryKey()
      queryClient.setQueryData(key, 'qux')
      expect(queryClient.getQueryData(key)).toBe('qux')
    })

    test('should use the same query when using similar string or array query keys', () => {
      const key = queryKey()
      queryClient.setQueryData(key, '1')
      expect(queryClient.getQueryData(key)).toBe('1')
      expect(queryClient.getQueryData([key])).toBe('1')
      queryClient.setQueryData([key], '2')
      expect(queryClient.getQueryData(key)).toBe('2')
      expect(queryClient.getQueryData([key])).toBe('2')
      queryClient.setQueryData(key, '1')
      expect(queryClient.getQueryData(key)).toBe('1')
      expect(queryClient.getQueryData([key])).toBe('1')
    })

    test('should accept an update function', () => {
      const key = queryKey()

      const updater = jest.fn(oldData => `new data + ${oldData}`)

      queryClient.setQueryData(key, 'test data')
      queryClient.setQueryData(key, updater)

      expect(updater).toHaveBeenCalled()
      expect(queryCache.find(key)!.state.data).toEqual('new data + test data')
    })

    test('should use prev data if an isDataEqual function is defined and returns "true"', () => {
      const key = queryKey()

      queryClient.setDefaultOptions({
        queries: { isDataEqual: (_prev, data) => data === 'data' },
      })
      queryClient.setQueryData(key, 'prev data')
      queryClient.setQueryData(key, 'data')

      expect(queryCache.find(key)!.state.data).toEqual('prev data')
    })

    test('should set the new data without comparison if structuralSharing is set to false', () => {
      const key = queryKey()

      queryClient.setDefaultOptions({
        queries: {
          structuralSharing: false,
        },
      })

      const oldData = { value: true }
      const newData = { value: true }
      queryClient.setQueryData(key, oldData)
      queryClient.setQueryData(key, newData)

      expect(queryCache.find(key)!.state.data).toBe(newData)
    })
  })

  describe('setQueriesData', () => {
    test('should update all existing, matching queries', () => {
      queryClient.setQueryData(['key', 1], 1)
      queryClient.setQueryData(['key', 2], 2)

      const result = queryClient.setQueriesData<number>('key', old => old! + 5)

      expect(result).toEqual([
        [['key', 1], 6],
        [['key', 2], 7],
      ])
      expect(queryClient.getQueryData(['key', 1])).toBe(6)
      expect(queryClient.getQueryData(['key', 2])).toBe(7)
    })

    test('should accept queryFilters', () => {
      queryClient.setQueryData(['key', 1], 1)
      queryClient.setQueryData(['key', 2], 2)
      const query1 = queryCache.find(['key', 1])!

      const result = queryClient.setQueriesData<number>(
        { predicate: query => query === query1 },
        old => old! + 5
      )

      expect(result).toEqual([[['key', 1], 6]])
      expect(queryClient.getQueryData(['key', 1])).toBe(6)
      expect(queryClient.getQueryData(['key', 2])).toBe(2)
    })

    test('should not update non existing queries', () => {
      const result = queryClient.setQueriesData<string>('key', 'data')

      expect(result).toEqual([])
      expect(queryClient.getQueryData('key')).toBe(undefined)
    })
  })

  describe('getQueryData', () => {
    test('should return the query data if the query is found', () => {
      const key = queryKey()
      queryClient.setQueryData([key, 'id'], 'bar')
      expect(queryClient.getQueryData([key, 'id'])).toBe('bar')
    })

    test('should return undefined if the query is not found', () => {
      const key = queryKey()
      expect(queryClient.getQueryData(key)).toBeUndefined()
    })

    test('should match exact by default', () => {
      const key = queryKey()
      queryClient.setQueryData([key, 'id'], 'bar')
      expect(queryClient.getQueryData([key])).toBeUndefined()
    })
  })

  describe('getQueriesData', () => {
    test('should return the query data for all matched queries', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      queryClient.setQueryData([key1, 1], 1)
      queryClient.setQueryData([key1, 2], 2)
      queryClient.setQueryData([key2, 2], 2)
      expect(queryClient.getQueriesData([key1])).toEqual([
        [[key1, 1], 1],
        [[key1, 2], 2],
      ])
    })

    test('should return empty array if queries are not found', () => {
      const key = queryKey()
      expect(queryClient.getQueriesData(key)).toEqual([])
    })

    test('should accept query filters', () => {
      queryClient.setQueryData(['key', 1], 1)
      queryClient.setQueryData(['key', 2], 2)
      const query1 = queryCache.find(['key', 1])!

      const result = queryClient.getQueriesData({
        predicate: query => query === query1,
      })

      expect(result).toEqual([[['key', 1], 1]])
    })
  })

  describe('fetchQuery', () => {
    test('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', string]
      const key: StrictQueryKey = ['strict', queryKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve('data')

      await expect(
        queryClient.fetchQuery<StrictData, any, StrictData, StrictQueryKey>(
          key,
          fetchFn
        )
      ).resolves.toEqual('data')
    })

    // https://github.com/tannerlinsley/react-query/issues/652
    test('should not retry by default', async () => {
      const consoleMock = mockConsoleError()

      const key = queryKey()

      await expect(
        queryClient.fetchQuery(key, async () => {
          throw new Error('error')
        })
      ).rejects.toEqual(new Error('error'))

      consoleMock.mockRestore()
    })

    test('should return the cached data on cache hit', async () => {
      const key = queryKey()

      const fetchFn = () => Promise.resolve('data')
      const first = await queryClient.fetchQuery(key, fetchFn)
      const second = await queryClient.fetchQuery(key, fetchFn)

      expect(second).toBe(first)
    })

    test('should be able to fetch when cache time is set to 0 and then be removed', async () => {
      const key1 = queryKey()
      const result = await queryClient.fetchQuery(
        key1,
        async () => {
          await sleep(10)
          return 1
        },
        { cacheTime: 0 }
      )
      const result2 = queryClient.getQueryData(key1)
      expect(result).toEqual(1)
      expect(result2).toEqual(undefined)
    })

    test('should keep a query in cache if cache time is Infinity', async () => {
      const key1 = queryKey()
      const result = await queryClient.fetchQuery(
        key1,
        async () => {
          await sleep(10)
          return 1
        },
        { cacheTime: Infinity }
      )
      const result2 = queryClient.getQueryData(key1)
      expect(result).toEqual(1)
      expect(result2).toEqual(1)
    })

    test('should not force fetch', async () => {
      const key = queryKey()

      queryClient.setQueryData(key, 'og')
      const fetchFn = () => Promise.resolve('new')
      const first = await queryClient.fetchQuery(key, fetchFn, {
        initialData: 'initial',
        staleTime: 100,
      })
      expect(first).toBe('og')
    })

    test('should only fetch if the data is older then the given stale time', async () => {
      const key = queryKey()

      let count = 0
      const fetchFn = () => ++count

      queryClient.setQueryData(key, count)
      const first = await queryClient.fetchQuery(key, fetchFn, {
        staleTime: 100,
      })
      await sleep(11)
      const second = await queryClient.fetchQuery(key, fetchFn, {
        staleTime: 10,
      })
      const third = await queryClient.fetchQuery(key, fetchFn, {
        staleTime: 10,
      })
      await sleep(11)
      const fourth = await queryClient.fetchQuery(key, fetchFn, {
        staleTime: 10,
      })
      expect(first).toBe(0)
      expect(second).toBe(1)
      expect(third).toBe(1)
      expect(fourth).toBe(2)
    })
  })

  describe('fetchInfiniteQuery', () => {
    test('should not type-error with strict query key', async () => {
      type StrictData = string
      type StrictQueryKey = ['strict', string]
      const key: StrictQueryKey = ['strict', queryKey()]

      const data = {
        pages: ['data'],
        pageParams: [undefined],
      } as const

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve(data.pages[0])

      await expect(
        queryClient.fetchInfiniteQuery<
          StrictData,
          any,
          StrictData,
          StrictQueryKey
        >(key, fetchFn)
      ).resolves.toEqual(data)
    })

    test('should return infinite query data', async () => {
      const key = queryKey()
      const result = await queryClient.fetchInfiniteQuery(
        key,
        ({ pageParam = 10 }) => Number(pageParam)
      )
      const result2 = queryClient.getQueryData(key)

      const expected = {
        pages: [10],
        pageParams: [undefined],
      }

      expect(result).toEqual(expected)
      expect(result2).toEqual(expected)
    })
  })

  describe('prefetchInfiniteQuery', () => {
    test('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', string]
      const key: StrictQueryKey = ['strict', queryKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve('data')

      await queryClient.prefetchInfiniteQuery<
        StrictData,
        any,
        StrictData,
        StrictQueryKey
      >(key, fetchFn)

      const result = queryClient.getQueryData(key)

      expect(result).toEqual({
        pages: ['data'],
        pageParams: [undefined],
      })
    })

    test('should return infinite query data', async () => {
      const key = queryKey()

      await queryClient.prefetchInfiniteQuery(key, ({ pageParam = 10 }) =>
        Number(pageParam)
      )

      const result = queryClient.getQueryData(key)

      expect(result).toEqual({
        pages: [10],
        pageParams: [undefined],
      })
    })
  })

  describe('prefetchQuery', () => {
    test('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', string]
      const key: StrictQueryKey = ['strict', queryKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve('data')

      await queryClient.prefetchQuery<
        StrictData,
        any,
        StrictData,
        StrictQueryKey
      >(key, fetchFn)

      const result = queryClient.getQueryData(key)

      expect(result).toEqual('data')
    })

    test('should return undefined when an error is thrown', async () => {
      const consoleMock = mockConsoleError()

      const key = queryKey()

      const result = await queryClient.prefetchQuery(
        key,
        async () => {
          throw new Error('error')
        },
        {
          retry: false,
        }
      )

      expect(result).toBeUndefined()
      expect(consoleMock).toHaveBeenCalled()

      consoleMock.mockRestore()
    })
  })

  describe('removeQueries', () => {
    test('should not crash when exact is provided', async () => {
      const key = queryKey()

      const fetchFn = () => Promise.resolve('data')

      // check the query was added to the cache
      await queryClient.prefetchQuery(key, fetchFn)
      expect(queryCache.find(key)).toBeTruthy()

      // check the error doesn't occur
      expect(() =>
        queryClient.removeQueries({ queryKey: key, exact: true })
      ).not.toThrow()

      // check query was successful removed
      expect(queryCache.find(key)).toBeFalsy()
    })
  })

  describe('cancelQueries', () => {
    test('should revert queries to their previous state', async () => {
      const consoleMock = mockConsoleError()
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()
      await queryClient.fetchQuery(key1, async () => {
        return 'data'
      })
      try {
        await queryClient.fetchQuery(key2, async () => {
          return Promise.reject('err')
        })
      } catch {}
      queryClient.fetchQuery(key1, async () => {
        await sleep(1000)
        return 'data2'
      })
      try {
        queryClient.fetchQuery(key2, async () => {
          await sleep(1000)
          return Promise.reject('err2')
        })
      } catch {}
      queryClient.fetchQuery(key3, async () => {
        await sleep(1000)
        return 'data3'
      })
      await sleep(10)
      await queryClient.cancelQueries()
      const state1 = queryClient.getQueryState(key1)
      const state2 = queryClient.getQueryState(key2)
      const state3 = queryClient.getQueryState(key3)
      expect(state1).toMatchObject({
        data: 'data',
        status: 'success',
      })
      expect(state2).toMatchObject({
        data: undefined,
        error: 'err',
        status: 'error',
      })
      expect(state3).toMatchObject({
        data: undefined,
        status: 'idle',
      })
      consoleMock.mockRestore()
    })

    test('should not revert if revert option is set to false', async () => {
      const consoleMock = mockConsoleError()
      const key1 = queryKey()
      await queryClient.fetchQuery(key1, async () => {
        return 'data'
      })
      queryClient.fetchQuery(key1, async () => {
        await sleep(1000)
        return 'data2'
      })
      await sleep(10)
      await queryClient.cancelQueries(key1, {}, { revert: false })
      const state1 = queryClient.getQueryState(key1)
      expect(state1).toMatchObject({
        status: 'error',
      })
      consoleMock.mockRestore()
    })
  })

  describe('refetchQueries', () => {
    test('should refetch all queries when no arguments are given', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        enabled: false,
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key1,
        enabled: false,
      })
      observer1.subscribe()
      observer2.subscribe()
      await queryClient.refetchQueries()
      observer1.destroy()
      observer2.destroy()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should be able to refetch all fresh queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries({ active: true, stale: false })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all stale queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe()
      queryClient.invalidateQueries(key1)
      await queryClient.refetchQueries({ stale: true })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all stale and active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      queryClient.invalidateQueries(key1)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries({ active: true, stale: true })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all active and inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries()
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should be able to refetch all active and inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries({ active: true, inactive: true })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should be able to refetch only active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries({ active: true })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch only inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries({ inactive: true })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should skip refetch for all active and inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      await queryClient.refetchQueries({ active: false, inactive: false })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should throw an error if throwOnError option is set to true', async () => {
      const consoleMock = mockConsoleError()
      const key1 = queryKey()
      const queryFnError = () => Promise.reject('error')
      try {
        await queryClient.fetchQuery({
          queryKey: key1,
          queryFn: queryFnError,
          retry: false,
        })
      } catch {}
      let error: any
      try {
        await queryClient.refetchQueries(
          { queryKey: key1 },
          { throwOnError: true }
        )
      } catch (err) {
        error = err
      }
      expect(error).toEqual('error')
      consoleMock.mockRestore()
    })
  })

  describe('invalidateQueries', () => {
    test('should refetch active queries by default', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      queryClient.invalidateQueries(key1)
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch inactive queries by default', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        enabled: false,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      queryClient.invalidateQueries(key1)
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch active queries when "refetchActive" is false', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      queryClient.invalidateQueries(key1, {
        refetchActive: false,
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should refetch inactive queries when "refetchInactive" is true', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
        enabled: false,
      })
      const unsubscribe = observer.subscribe()
      queryClient.invalidateQueries(key1, {
        refetchInactive: true,
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch active queries when "refetchActive" is not provided and "active" is false', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe()
      queryClient.invalidateQueries(key1, {
        active: false,
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should cancel ongoing fetches if cancelRefetch option is passed', async () => {
      const key = queryKey()
      const cancelFn = jest.fn()
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        enabled: false,
        initialData: 1,
      })
      observer.subscribe()

      queryClient.fetchQuery(key, () => {
        const promise = new Promise(resolve => {
          setTimeout(() => resolve(5), 10)
        })
        // @ts-expect-error
        promise.cancel = cancelFn
        return promise
      })

      await queryClient.refetchQueries(undefined, { cancelRefetch: true })
      observer.destroy()
      expect(cancelFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('resetQueries', () => {
    test('should notify listeners when a query is reset', async () => {
      const key = queryKey()

      const callback = jest.fn()

      await queryClient.prefetchQuery(key, () => 'data')

      queryCache.subscribe(callback)

      queryClient.resetQueries(key)

      expect(callback).toHaveBeenCalled()
    })

    test('should reset query', async () => {
      const key = queryKey()

      await queryClient.prefetchQuery(key, () => 'data')

      let state = queryClient.getQueryState(key)
      expect(state?.data).toEqual('data')
      expect(state?.status).toEqual('success')

      queryClient.resetQueries(key)

      state = queryClient.getQueryState(key)

      expect(state).toBeTruthy()
      expect(state?.data).toBeUndefined()
      expect(state?.status).toEqual('idle')
    })

    test('should reset query data to initial data if set', async () => {
      const key = queryKey()

      await queryClient.prefetchQuery(key, () => 'data', {
        initialData: 'initial',
      })

      let state = queryClient.getQueryState(key)
      expect(state?.data).toEqual('data')

      queryClient.resetQueries(key)

      state = queryClient.getQueryState(key)

      expect(state).toBeTruthy()
      expect(state?.data).toEqual('initial')
    })

    test('should refetch all active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn()
      const queryFn2 = jest.fn()
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        enabled: true,
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: queryFn2,
        enabled: false,
      })
      observer1.subscribe()
      observer2.subscribe()
      await queryClient.resetQueries()
      observer2.destroy()
      observer1.destroy()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(0)
    })
  })

  describe('refetch only certain pages of an infinite query', () => {
    test('refetchQueries', async () => {
      const key = queryKey()
      let multiplier = 1
      const observer = new InfiniteQueryObserver<number>(queryClient, {
        queryKey: key,
        queryFn: ({ pageParam = 10 }) => Number(pageParam) * multiplier,
        getNextPageParam: lastPage => lastPage + 1,
      })

      await observer.fetchNextPage()
      await observer.fetchNextPage()

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [10, 11],
      })

      multiplier = 2

      await queryClient.refetchQueries({
        queryKey: key,
        refetchPage: (_, index) => index === 0,
      })

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [20, 11],
      })
    })
    test('invalidateQueries', async () => {
      const key = queryKey()
      let multiplier = 1
      const observer = new InfiniteQueryObserver<number>(queryClient, {
        queryKey: key,
        queryFn: ({ pageParam = 10 }) => Number(pageParam) * multiplier,
        getNextPageParam: lastPage => lastPage + 1,
      })

      await observer.fetchNextPage()
      await observer.fetchNextPage()

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [10, 11],
      })

      multiplier = 2

      await queryClient.invalidateQueries({
        queryKey: key,
        refetchInactive: true,
        refetchPage: (page, _, allPages) => {
          return page === allPages[0]
        },
      })

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [20, 11],
      })
    })

    test('resetQueries', async () => {
      const key = queryKey()
      let multiplier = 1
      new InfiniteQueryObserver<number>(queryClient, {
        queryKey: key,
        queryFn: ({ pageParam = 10 }) => Number(pageParam) * multiplier,
        getNextPageParam: lastPage => lastPage + 1,
        initialData: () => ({
          pages: [10, 11],
          pageParams: [10, 11],
        }),
      })

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [10, 11],
      })

      multiplier = 2

      await queryClient.resetQueries({
        queryKey: key,
        inactive: true,
        refetchPage: (page, _, allPages) => {
          return page === allPages[0]
        },
      })

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [20, 11],
      })
    })
  })

  describe('focusManager and onlineManager', () => {
    test('should not notify queryCache and mutationCache if not focused or online', async () => {
      const testClient = new QueryClient()
      testClient.mount()

      const queryCacheOnFocusSpy = jest.spyOn(
        testClient.getQueryCache(),
        'onFocus'
      )
      const queryCacheOnOnlineSpy = jest.spyOn(
        testClient.getQueryCache(),
        'onOnline'
      )
      const mutationCacheOnFocusSpy = jest.spyOn(
        testClient.getMutationCache(),
        'onFocus'
      )
      const mutationCacheOnOnlineSpy = jest.spyOn(
        testClient.getMutationCache(),
        'onOnline'
      )

      focusManager.setFocused(false)
      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()
      expect(mutationCacheOnFocusSpy).not.toHaveBeenCalled()

      focusManager.setFocused(true)
      onlineManager.setOnline(false)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheOnOnlineSpy).not.toHaveBeenCalled()

      focusManager.setFocused(true)
      onlineManager.setOnline(false)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheOnOnlineSpy).not.toHaveBeenCalled()

      focusManager.setFocused(false)
      onlineManager.setOnline(true)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheOnOnlineSpy).not.toHaveBeenCalled()

      testClient.unmount()
      onlineManager.setOnline(true)
      focusManager.setFocused(true)
      queryCacheOnFocusSpy.mockRestore()
      mutationCacheOnFocusSpy.mockRestore()
      queryCacheOnOnlineSpy.mockRestore()
      mutationCacheOnOnlineSpy.mockRestore()
    })
  })

  describe('cancelMutations', () => {
    test('should cancel mutations', async () => {
      const key = queryKey()
      const mutationObserver = new MutationObserver(queryClient, {
        mutationKey: key,
        mutationFn: async () => {
          await sleep(20)
          return 'data'
        },
        onMutate: text => text,
      })
      await mutationObserver.mutate()
      const mutation = queryClient
        .getMutationCache()
        .find({ mutationKey: key })!
      const mutationSpy = jest.spyOn(mutation, 'cancel')
      queryClient.cancelMutations()
      expect(mutationSpy).toHaveBeenCalled()
      mutationSpy.mockRestore()
    })
  })
  describe('setMutationDefaults', () => {
    test('should update existing mutation defaults', () => {
      const key = queryKey()
      const mutationOptions1 = { mutationFn: async () => 'data' }
      const mutationOptions2 = { retry: false }
      queryClient.setMutationDefaults(key, mutationOptions1)
      queryClient.setMutationDefaults(key, mutationOptions2)
      expect(queryClient.getMutationDefaults(key)).toMatchObject(
        mutationOptions2
      )
    })
  })
})
