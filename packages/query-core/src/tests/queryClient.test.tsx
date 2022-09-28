import { waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { sleep, queryKey, mockLogger, createQueryClient } from './utils'
import type {
  QueryCache,
  QueryClient,
  QueryFunction,
  QueryObserverOptions,
} from '..'
import { InfiniteQueryObserver, QueryObserver } from '..'
import { focusManager, onlineManager } from '..'

describe('queryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = createQueryClient()
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
      const testClient = createQueryClient({
        defaultOptions: { queries: { queryFn } },
      })

      expect(() => testClient.prefetchQuery(key)).not.toThrow()
    })

    test('should merge defaultOptions when query is added to cache', async () => {
      const key = queryKey()

      const testClient = createQueryClient({
        defaultOptions: {
          queries: { cacheTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve('data')
      await testClient.prefetchQuery(key, fetchData)
      const newQuery = testClient.getQueryCache().find(key)
      expect(newQuery?.options.cacheTime).toBe(Infinity)
    })

    test('should get defaultOptions', async () => {
      const queryFn = () => 'data'
      const defaultOptions = { queries: { queryFn } }
      const testClient = createQueryClient({
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
      const key = queryKey()
      queryClient.setQueryDefaults([key, 'a'], { queryFn: () => 'data' })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key],
        retry: false,
        enabled: false,
      })
      const { status } = await observer.refetch()
      expect(status).toBe('error')
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
      expect(observer.getCurrentResult().status).toBe('loading')
      expect(observer.getCurrentResult().fetchStatus).toBe('idle')
    })

    test('should update existing query defaults', async () => {
      const key = queryKey()
      const queryOptions1 = { queryFn: () => 'data' }
      const queryOptions2 = { retry: false }
      queryClient.setQueryDefaults(key, queryOptions1)
      queryClient.setQueryDefaults(key, queryOptions2)
      expect(queryClient.getQueryDefaults(key)).toMatchObject(queryOptions2)
    })

    test('should warn in dev if several query defaults match a given key', () => {
      // Check discussion here: https://github.com/tannerlinsley/react-query/discussions/3199
      const keyABCD = [
        {
          a: 'a',
          b: 'b',
          c: 'c',
          d: 'd',
        },
      ]

      // The key below "contains" keyABCD => it is more generic
      const keyABC = [
        {
          a: 'a',
          b: 'b',
          c: 'c',
        },
      ]

      // The defaults for query matching key "ABCD" (least generic)
      const defaultsOfABCD = {
        queryFn: function ABCDQueryFn() {
          return 'ABCD'
        },
      }

      // The defaults for query matching key "ABC" (most generic)
      const defaultsOfABC = {
        queryFn: function ABCQueryFn() {
          return 'ABC'
        },
      }

      // No defaults, no warning
      const noDefaults = queryClient.getQueryDefaults(keyABCD)
      expect(noDefaults).toBeUndefined()
      expect(mockLogger.error).not.toHaveBeenCalled()

      // If defaults for key ABCD are registered **before** the ones of key ABC (more generic)…
      queryClient.setQueryDefaults(keyABCD, defaultsOfABCD)
      queryClient.setQueryDefaults(keyABC, defaultsOfABC)
      // … then the "good" defaults are retrieved: we get the ones for key "ABCD"
      const goodDefaults = queryClient.getQueryDefaults(keyABCD)
      expect(goodDefaults).toBe(defaultsOfABCD)
      // The warning is still raised since several defaults are matching
      expect(mockLogger.error).toHaveBeenCalledTimes(1)

      // Let's create another queryClient and change the order of registration
      const newQueryClient = createQueryClient()
      // The defaults for key ABC (more generic) are registered **before** the ones of key ABCD…
      newQueryClient.setQueryDefaults(keyABC, defaultsOfABC)
      newQueryClient.setQueryDefaults(keyABCD, defaultsOfABCD)
      // … then the "wrong" defaults are retrieved: we get the ones for key "ABC"
      const badDefaults = newQueryClient.getQueryDefaults(keyABCD)
      expect(badDefaults).not.toBe(defaultsOfABCD)
      expect(badDefaults).toBe(defaultsOfABC)
      expect(mockLogger.error).toHaveBeenCalledTimes(2)
    })

    test('should warn in dev if several mutation defaults match a given key', () => {
      // Check discussion here: https://github.com/tannerlinsley/react-query/discussions/3199
      const keyABCD = [
        {
          a: 'a',
          b: 'b',
          c: 'c',
          d: 'd',
        },
      ]

      // The key below "contains" keyABCD => it is more generic
      const keyABC = [
        {
          a: 'a',
          b: 'b',
          c: 'c',
        },
      ]

      // The defaults for mutation matching key "ABCD" (least generic)
      const defaultsOfABCD = {
        mutationFn: Promise.resolve,
      }

      // The defaults for mutation matching key "ABC" (most generic)
      const defaultsOfABC = {
        mutationFn: Promise.resolve,
      }

      // No defaults, no warning
      const noDefaults = queryClient.getMutationDefaults(keyABCD)
      expect(noDefaults).toBeUndefined()
      expect(mockLogger.error).not.toHaveBeenCalled()

      // If defaults for key ABCD are registered **before** the ones of key ABC (more generic)…
      queryClient.setMutationDefaults(keyABCD, defaultsOfABCD)
      queryClient.setMutationDefaults(keyABC, defaultsOfABC)
      // … then the "good" defaults are retrieved: we get the ones for key "ABCD"
      const goodDefaults = queryClient.getMutationDefaults(keyABCD)
      expect(goodDefaults).toBe(defaultsOfABCD)
      // The warning is still raised since several defaults are matching
      expect(mockLogger.error).toHaveBeenCalledTimes(1)

      // Let's create another queryClient and change the order of registration
      const newQueryClient = createQueryClient()
      // The defaults for key ABC (more generic) are registered **before** the ones of key ABCD…
      newQueryClient.setMutationDefaults(keyABC, defaultsOfABC)
      newQueryClient.setMutationDefaults(keyABCD, defaultsOfABCD)
      // … then the "wrong" defaults are retrieved: we get the ones for key "ABC"
      const badDefaults = newQueryClient.getMutationDefaults(keyABCD)
      expect(badDefaults).not.toBe(defaultsOfABCD)
      expect(badDefaults).toBe(defaultsOfABC)
      expect(mockLogger.error).toHaveBeenCalledTimes(2)
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
      const testClient = createQueryClient({
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

    test('should not create a new query if query was not found and data is undefined', () => {
      const key = queryKey()
      expect(queryClient.getQueryCache().find(key)).toBe(undefined)
      queryClient.setQueryData(key, undefined)
      expect(queryClient.getQueryCache().find(key)).toBe(undefined)
    })

    test('should not create a new query if query was not found and updater returns undefined', () => {
      const key = queryKey()
      expect(queryClient.getQueryCache().find(key)).toBe(undefined)
      queryClient.setQueryData(key, () => undefined)
      expect(queryClient.getQueryCache().find(key)).toBe(undefined)
    })

    test('should not update query data if data is undefined', () => {
      const key = queryKey()
      queryClient.setQueryData(key, 'qux')
      queryClient.setQueryData(key, undefined)
      expect(queryClient.getQueryData(key)).toBe('qux')
    })

    test('should not update query data if updater returns undefined', () => {
      const key = queryKey()
      queryClient.setQueryData<string>(key, 'qux')
      queryClient.setQueryData<string>(key, () => undefined)
      expect(queryClient.getQueryData(key)).toBe('qux')
    })

    test('should accept an update function', () => {
      const key = queryKey()

      const updater = jest.fn((oldData) => `new data + ${oldData}`)

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

    test('should apply a custom structuralSharing function when provided', () => {
      const key = queryKey()

      const queryObserverOptions = {
        structuralSharing: (
          prevData: { value: Date } | undefined,
          newData: { value: Date },
        ) => {
          if (!prevData) {
            return newData
          }
          return newData.value.getTime() === prevData.value.getTime()
            ? prevData
            : newData
        },
      } as QueryObserverOptions

      queryClient.setDefaultOptions({ queries: queryObserverOptions })

      const oldData = { value: new Date(2022, 6, 19) }
      const newData = { value: new Date(2022, 6, 19) }
      queryClient.setQueryData(key, oldData)
      queryClient.setQueryData(key, newData)

      expect(queryCache.find(key)!.state.data).toBe(oldData)

      const distinctData = { value: new Date(2021, 11, 25) }
      queryClient.setQueryData(key, distinctData)

      expect(queryCache.find(key)!.state.data).toBe(distinctData)
    })

    test('should not set isFetching to false', async () => {
      const key = queryKey()
      queryClient.prefetchQuery(key, async () => {
        await sleep(10)
        return 23
      })
      expect(queryClient.getQueryState(key)).toMatchObject({
        data: undefined,
        fetchStatus: 'fetching',
      })
      queryClient.setQueryData(key, 42)
      expect(queryClient.getQueryState(key)).toMatchObject({
        data: 42,
        fetchStatus: 'fetching',
      })
      await waitFor(() =>
        expect(queryClient.getQueryState(key)).toMatchObject({
          data: 23,
          fetchStatus: 'idle',
        }),
      )
    })
  })

  describe('setQueriesData', () => {
    test('should update all existing, matching queries', () => {
      queryClient.setQueryData(['key', 1], 1)
      queryClient.setQueryData(['key', 2], 2)

      const result = queryClient.setQueriesData<number>(['key'], (old) =>
        old ? old + 5 : undefined,
      )

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
        { predicate: (query) => query === query1 },
        (old) => old! + 5,
      )

      expect(result).toEqual([[['key', 1], 6]])
      expect(queryClient.getQueryData(['key', 1])).toBe(6)
      expect(queryClient.getQueryData(['key', 2])).toBe(2)
    })

    test('should not update non existing queries', () => {
      const result = queryClient.setQueriesData<string>(['key'], 'data')

      expect(result).toEqual([])
      expect(queryClient.getQueryData(['key'])).toBe(undefined)
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
        predicate: (query) => query === query1,
      })

      expect(result).toEqual([[['key', 1], 1]])
    })
  })

  describe('fetchQuery', () => {
    test('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', ...ReturnType<typeof queryKey>]
      const key: StrictQueryKey = ['strict', ...queryKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve('data')

      await expect(
        queryClient.fetchQuery<StrictData, any, StrictData, StrictQueryKey>(
          key,
          fetchFn,
        ),
      ).resolves.toEqual('data')
    })

    // https://github.com/tannerlinsley/react-query/issues/652
    test('should not retry by default', async () => {
      const key = queryKey()

      await expect(
        queryClient.fetchQuery(key, async (): Promise<unknown> => {
          throw new Error('error')
        }),
      ).rejects.toEqual(new Error('error'))
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
        { cacheTime: 0 },
      )
      expect(result).toEqual(1)
      await waitFor(() =>
        expect(queryClient.getQueryData(key1)).toEqual(undefined),
      )
    })

    test('should keep a query in cache if cache time is Infinity', async () => {
      const key1 = queryKey()
      const result = await queryClient.fetchQuery(
        key1,
        async () => {
          await sleep(10)
          return 1
        },
        { cacheTime: Infinity },
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
      type StrictQueryKey = ['strict', ...ReturnType<typeof queryKey>]
      const key: StrictQueryKey = ['strict', ...queryKey()]

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
        >(key, fetchFn),
      ).resolves.toEqual(data)
    })

    test('should return infinite query data', async () => {
      const key = queryKey()
      const result = await queryClient.fetchInfiniteQuery(
        key,
        ({ pageParam = 10 }) => Number(pageParam),
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
      type StrictQueryKey = ['strict', ...ReturnType<typeof queryKey>]
      const key: StrictQueryKey = ['strict', ...queryKey()]

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
        Number(pageParam),
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
      type StrictQueryKey = ['strict', ...ReturnType<typeof queryKey>]
      const key: StrictQueryKey = ['strict', ...queryKey()]

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
      const key = queryKey()

      const result = await queryClient.prefetchQuery(
        key,
        async (): Promise<unknown> => {
          throw new Error('error')
        },
        {
          retry: false,
        },
      )

      expect(result).toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    test('should be garbage collected after cacheTime if unused', async () => {
      const key = queryKey()

      await queryClient.prefetchQuery(
        key,
        async () => {
          return 'data'
        },
        { cacheTime: 10 },
      )
      expect(queryCache.find(key)).toBeDefined()
      await sleep(15)
      expect(queryCache.find(key)).not.toBeDefined()
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
        queryClient.removeQueries({ queryKey: key, exact: true }),
      ).not.toThrow()

      // check query was successful removed
      expect(queryCache.find(key)).toBeFalsy()
    })
  })

  describe('cancelQueries', () => {
    test('should revert queries to their previous state', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()
      await queryClient.fetchQuery(key1, async () => {
        return 'data'
      })
      try {
        await queryClient.fetchQuery(key2, async () => {
          return Promise.reject<unknown>('err')
        })
      } catch {}
      queryClient.fetchQuery(key1, async () => {
        await sleep(1000)
        return 'data2'
      })
      try {
        queryClient.fetchQuery(key2, async () => {
          await sleep(1000)
          return Promise.reject<unknown>('err2')
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
        status: 'loading',
        fetchStatus: 'idle',
      })
    })

    test('should not revert if revert option is set to false', async () => {
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
    })
  })

  describe('refetchQueries', () => {
    test('should not refetch if all observers are disabled', async () => {
      const key = queryKey()
      const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
      await queryClient.fetchQuery(key, queryFn)
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        enabled: false,
      })
      observer1.subscribe(() => undefined)
      await queryClient.refetchQueries()
      observer1.destroy()
      expect(queryFn).toHaveBeenCalledTimes(1)
    })
    test('should refetch if at least one observer is enabled', async () => {
      const key = queryKey()
      const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
      await queryClient.fetchQuery(key, queryFn)
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        enabled: false,
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        refetchOnMount: false,
      })
      observer1.subscribe(() => undefined)
      observer2.subscribe(() => undefined)
      await queryClient.refetchQueries()
      observer1.destroy()
      observer2.destroy()
      expect(queryFn).toHaveBeenCalledTimes(2)
    })
    test('should refetch all queries when no arguments are given', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        staleTime: Infinity,
        initialData: 'initial',
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key1,
        staleTime: Infinity,
        initialData: 'initial',
      })
      observer1.subscribe(() => undefined)
      observer2.subscribe(() => undefined)
      await queryClient.refetchQueries()
      observer1.destroy()
      observer2.destroy()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should be able to refetch all fresh queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await queryClient.refetchQueries({ type: 'active', stale: false })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all stale queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries(key1)
      await queryClient.refetchQueries({ stale: true })
      unsubscribe()
      // fetchQuery, observer mount, invalidation (cancels observer mount) and refetch
      expect(queryFn1).toHaveBeenCalledTimes(4)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all stale and active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      queryClient.invalidateQueries(key1)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await queryClient.refetchQueries(
        { type: 'active', stale: true },
        { cancelRefetch: false },
      )
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all active and inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await queryClient.refetchQueries()
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should be able to refetch all active and inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await queryClient.refetchQueries({ type: 'all' })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should be able to refetch only active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await queryClient.refetchQueries({ type: 'active' })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch only inactive queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await queryClient.refetchQueries({ type: 'inactive' })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should throw an error if throwOnError option is set to true', async () => {
      const key1 = queryKey()
      const queryFnError = () => Promise.reject<unknown>('error')
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
          { throwOnError: true },
        )
      } catch (err) {
        error = err
      }
      expect(error).toEqual('error')
    })
  })

  describe('invalidateQueries', () => {
    test('should refetch active queries by default', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries(key1)
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch inactive queries by default', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        enabled: false,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries(key1)
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch active queries when "refetch" is "none"', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries(key1, {
        refetchType: 'none',
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should refetch inactive queries when "refetch" is "inactive"', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
        refetchOnMount: false,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      unsubscribe()

      await queryClient.invalidateQueries(key1, {
        refetchType: 'inactive',
      })
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should refetch active and inactive queries when "refetch" is "all"', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
      await queryClient.fetchQuery(key1, queryFn1)
      await queryClient.fetchQuery(key2, queryFn2)
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries({
        refetchType: 'all',
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    test('should cancel ongoing fetches if cancelRefetch option is set (default value)', async () => {
      const key = queryKey()
      const abortFn = jest.fn()
      let fetchCount = 0
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: ({ signal }) => {
          return new Promise((resolve) => {
            fetchCount++
            setTimeout(() => resolve(5), 10)
            if (signal) {
              signal.addEventListener('abort', abortFn)
            }
          })
        },
        initialData: 1,
      })
      observer.subscribe(() => undefined)

      await queryClient.refetchQueries()
      observer.destroy()
      expect(abortFn).toHaveBeenCalledTimes(1)
      expect(fetchCount).toBe(2)
    })

    test('should not cancel ongoing fetches if cancelRefetch option is set to false', async () => {
      const key = queryKey()
      const abortFn = jest.fn()
      let fetchCount = 0
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: ({ signal }) => {
          return new Promise((resolve) => {
            fetchCount++
            setTimeout(() => resolve(5), 10)
            if (signal) {
              signal.addEventListener('abort', abortFn)
            }
          })
        },
        initialData: 1,
      })
      observer.subscribe(() => undefined)

      await queryClient.refetchQueries(undefined, { cancelRefetch: false })
      observer.destroy()
      expect(abortFn).toHaveBeenCalledTimes(0)
      expect(fetchCount).toBe(1)
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
      expect(state?.status).toEqual('loading')
      expect(state?.fetchStatus).toEqual('idle')
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
      const queryFn1 = jest.fn<string, unknown[]>().mockReturnValue('data1')
      const queryFn2 = jest.fn<string, unknown[]>().mockReturnValue('data2')
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
      observer1.subscribe(() => undefined)
      observer2.subscribe(() => undefined)
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
        getNextPageParam: (lastPage) => lastPage + 1,
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
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      await observer.fetchNextPage()
      await observer.fetchNextPage()

      expect(queryClient.getQueryData(key)).toMatchObject({
        pages: [10, 11],
      })

      multiplier = 2

      await queryClient.invalidateQueries({
        queryKey: key,
        refetchType: 'all',
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
        getNextPageParam: (lastPage) => lastPage + 1,
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
        type: 'inactive',
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
    test('should notify queryCache and mutationCache if focused', async () => {
      const testClient = createQueryClient()
      testClient.mount()

      const queryCacheOnFocusSpy = jest.spyOn(
        testClient.getQueryCache(),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = jest.spyOn(
        testClient.getQueryCache(),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = jest.spyOn(
        testClient.getMutationCache(),
        'resumePausedMutations',
      )

      focusManager.setFocused(false)
      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      focusManager.setFocused(true)
      expect(queryCacheOnFocusSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(1)

      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()

      queryCacheOnFocusSpy.mockRestore()
      mutationCacheResumePausedMutationsSpy.mockRestore()
      queryCacheOnOnlineSpy.mockRestore()
      focusManager.setFocused(undefined)
    })

    test('should notify queryCache and mutationCache if online', async () => {
      const testClient = createQueryClient()
      testClient.mount()

      const queryCacheOnFocusSpy = jest.spyOn(
        testClient.getQueryCache(),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = jest.spyOn(
        testClient.getQueryCache(),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = jest.spyOn(
        testClient.getMutationCache(),
        'resumePausedMutations',
      )

      onlineManager.setOnline(false)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      onlineManager.setOnline(true)
      expect(queryCacheOnOnlineSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(1)

      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()

      queryCacheOnFocusSpy.mockRestore()
      queryCacheOnOnlineSpy.mockRestore()
      mutationCacheResumePausedMutationsSpy.mockRestore()
      onlineManager.setOnline(undefined)
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
        mutationOptions2,
      )
    })
  })
})
