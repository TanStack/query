import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'

import {
  MutationObserver,
  QueryObserver,
  focusManager,
  onlineManager,
} from '..'
import { noop } from '../utils'
import {
  createQueryClient,
  mockOnlineManagerIsOnline,
  queryKey,
  sleep,
} from './utils'
import type {
  QueryCache,
  QueryClient,
  QueryFunction,
  QueryObserverOptions,
} from '..'

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
    queryClient.unmount()
  })

  describe('defaultOptions', () => {
    test('should merge defaultOptions', async () => {
      const key = queryKey()

      const queryFn = () => 'data'
      const testClient = createQueryClient({
        defaultOptions: { queries: { queryFn } },
      })

      expect(() => testClient.prefetchQuery({ queryKey: key })).not.toThrow()
    })

    test('should merge defaultOptions when query is added to cache', async () => {
      const key = queryKey()

      const testClient = createQueryClient({
        defaultOptions: {
          queries: { gcTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve('data')
      await testClient.prefetchQuery({ queryKey: key, queryFn: fetchData })
      const newQuery = testClient.getQueryCache().find({ queryKey: key })
      expect(newQuery?.options.gcTime).toBe(Infinity)
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
      queryClient.setQueryDefaults([key, 'a'], {
        queryFn: () => 'data',
      })
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
      expect(observer.getCurrentResult().status).toBe('pending')
      expect(observer.getCurrentResult().fetchStatus).toBe('idle')
    })

    test('should update existing query defaults', async () => {
      const key = queryKey()
      const queryOptions1 = { queryFn: () => 'data' }
      const queryOptions2 = { retry: false }
      queryClient.setQueryDefaults(key, { ...queryOptions1 })
      queryClient.setQueryDefaults(key, { ...queryOptions2 })
      expect(queryClient.getQueryDefaults(key)).toMatchObject(queryOptions2)
    })

    test('should merge defaultOptions', async () => {
      const key = queryKey()

      queryClient.setQueryDefaults([...key, 'todo'], { suspense: true })
      queryClient.setQueryDefaults([...key, 'todo', 'detail'], {
        staleTime: 5000,
      })

      expect(
        queryClient.getQueryDefaults([...key, 'todo', 'detail']),
      ).toMatchObject({ suspense: true, staleTime: 5000 })
    })
  })

  describe('defaultQueryOptions', () => {
    test('should default networkMode when persister is present', async () => {
      expect(
        createQueryClient({
          defaultOptions: {
            queries: {
              persister: 'ignore' as any,
            },
          },
        }).defaultQueryOptions({ queryKey: queryKey() }).networkMode,
      ).toBe('offlineFirst')
    })

    test('should not default networkMode without persister', async () => {
      expect(
        createQueryClient({
          defaultOptions: {
            queries: {
              staleTime: 1000,
            },
          },
        }).defaultQueryOptions({ queryKey: queryKey() }).networkMode,
      ).toBe(undefined)
    })

    test('should not default networkMode when already present', async () => {
      expect(
        createQueryClient({
          defaultOptions: {
            queries: {
              persister: 'ignore' as any,
              networkMode: 'always',
            },
          },
        }).defaultQueryOptions({ queryKey: queryKey() }).networkMode,
      ).toBe('always')
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
      expect(testCache.find({ queryKey: key })).toBe(testCache.get('someKey'))
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
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBe(
        undefined,
      )
      queryClient.setQueryData(key, undefined)
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBe(
        undefined,
      )
    })

    test('should not create a new query if query was not found and updater returns undefined', () => {
      const key = queryKey()
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBe(
        undefined,
      )
      queryClient.setQueryData(key, () => undefined)
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBe(
        undefined,
      )
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

      const updater = vi.fn((oldData) => `new data + ${oldData}`)

      queryClient.setQueryData(key, 'test data')
      queryClient.setQueryData(key, updater)

      expect(updater).toHaveBeenCalled()
      expect(queryCache.find({ queryKey: key })!.state.data).toEqual(
        'new data + test data',
      )
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

      expect(queryCache.find({ queryKey: key })!.state.data).toBe(newData)
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

      expect(queryCache.find({ queryKey: key })!.state.data).toBe(oldData)

      const distinctData = { value: new Date(2021, 11, 25) }
      queryClient.setQueryData(key, distinctData)

      expect(queryCache.find({ queryKey: key })!.state.data).toBe(distinctData)
    })

    test('should not set isFetching to false', async () => {
      const key = queryKey()
      queryClient.prefetchQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 23
        },
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

      const result = queryClient.setQueriesData<number>(
        { queryKey: ['key'] },
        (old) => (old ? old + 5 : undefined),
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
      const query1 = queryCache.find({ queryKey: ['key', 1] })!

      const result = queryClient.setQueriesData<number>(
        { predicate: (query) => query === query1 },
        (old) => old! + 5,
      )

      expect(result).toEqual([[['key', 1], 6]])
      expect(queryClient.getQueryData(['key', 1])).toBe(6)
      expect(queryClient.getQueryData(['key', 2])).toBe(2)
    })

    test('should not update non existing queries', () => {
      const result = queryClient.setQueriesData<string>(
        { queryKey: ['key'] },
        'data',
      )

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

  describe('ensureQueryData', () => {
    test('should return the cached query data if the query is found', async () => {
      const key = queryKey()
      const queryFn = () => Promise.resolve('data')

      queryClient.setQueryData([key, 'id'], 'bar')

      await expect(
        queryClient.ensureQueryData({ queryKey: [key, 'id'], queryFn }),
      ).resolves.toEqual('bar')
    })

    test('should return the cached query data if the query is found and cached query data is falsey', async () => {
      const key = queryKey()
      const queryFn = () => Promise.resolve(0)

      queryClient.setQueryData([key, 'id'], null)

      await expect(
        queryClient.ensureQueryData({ queryKey: [key, 'id'], queryFn }),
      ).resolves.toEqual(null)
    })

    test('should call fetchQuery and return its results if the query is not found', async () => {
      const key = queryKey()
      const queryFn = () => Promise.resolve('data')

      await expect(
        queryClient.ensureQueryData({ queryKey: [key], queryFn }),
      ).resolves.toEqual('data')
    })
  })

  describe('getQueriesData', () => {
    test('should return the query data for all matched queries', () => {
      const key1 = queryKey()
      const key2 = queryKey()
      queryClient.setQueryData([key1, 1], 1)
      queryClient.setQueryData([key1, 2], 2)
      queryClient.setQueryData([key2, 2], 2)
      expect(queryClient.getQueriesData({ queryKey: [key1] })).toEqual([
        [[key1, 1], 1],
        [[key1, 2], 2],
      ])
    })

    test('should return empty array if queries are not found', () => {
      const key = queryKey()
      expect(queryClient.getQueriesData({ queryKey: key })).toEqual([])
    })

    test('should accept query filters', () => {
      queryClient.setQueryData(['key', 1], 1)
      queryClient.setQueryData(['key', 2], 2)
      const query1 = queryCache.find({ queryKey: ['key', 1] })!

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
        queryClient.fetchQuery<StrictData, any, StrictData, StrictQueryKey>({
          queryKey: key,
          queryFn: fetchFn,
        }),
      ).resolves.toEqual('data')
    })

    // https://github.com/tannerlinsley/react-query/issues/652
    test('should not retry by default', async () => {
      const key = queryKey()

      await expect(
        queryClient.fetchQuery({
          queryKey: key,
          queryFn: async (): Promise<unknown> => {
            throw new Error('error')
          },
        }),
      ).rejects.toEqual(new Error('error'))
    })

    test('should return the cached data on cache hit', async () => {
      const key = queryKey()

      const fetchFn = () => Promise.resolve('data')
      const first = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
      })
      const second = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
      })

      expect(second).toBe(first)
    })

    test('should be able to fetch when garbage collection time is set to 0 and then be removed', async () => {
      const key1 = queryKey()
      const result = await queryClient.fetchQuery({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 1
        },
        gcTime: 0,
      })
      expect(result).toEqual(1)
      await waitFor(() =>
        expect(queryClient.getQueryData(key1)).toEqual(undefined),
      )
    })

    test('should keep a query in cache if garbage collection time is Infinity', async () => {
      const key1 = queryKey()
      const result = await queryClient.fetchQuery({
        queryKey: key1,
        queryFn: async () => {
          await sleep(10)
          return 1
        },
        gcTime: Infinity,
      })
      const result2 = queryClient.getQueryData(key1)
      expect(result).toEqual(1)
      expect(result2).toEqual(1)
    })

    test('should not force fetch', async () => {
      const key = queryKey()

      queryClient.setQueryData(key, 'og')
      const fetchFn = () => Promise.resolve('new')
      const first = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
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
      const first = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
        staleTime: 100,
      })
      await sleep(11)
      const second = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
        staleTime: 10,
      })
      const third = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
        staleTime: 10,
      })
      await sleep(11)
      const fourth = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
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
        pageParams: [0],
      } as const

      const fetchFn: QueryFunction<StrictData, StrictQueryKey, number> = () =>
        Promise.resolve(data.pages[0])

      await expect(
        queryClient.fetchInfiniteQuery<
          StrictData,
          any,
          StrictData,
          StrictQueryKey,
          number
        >({ queryKey: key, queryFn: fetchFn, initialPageParam: 0 }),
      ).resolves.toEqual(data)
    })

    test('should return infinite query data', async () => {
      const key = queryKey()
      const result = await queryClient.fetchInfiniteQuery({
        queryKey: key,
        initialPageParam: 10,
        queryFn: ({ pageParam }) => Number(pageParam),
      })
      const result2 = queryClient.getQueryData(key)

      const expected = {
        pages: [10],
        pageParams: [10],
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

      const fetchFn: QueryFunction<StrictData, StrictQueryKey, number> = () =>
        Promise.resolve('data')

      await queryClient.prefetchInfiniteQuery<
        StrictData,
        any,
        StrictData,
        StrictQueryKey,
        number
      >({ queryKey: key, queryFn: fetchFn, initialPageParam: 0 })

      const result = queryClient.getQueryData(key)

      expect(result).toEqual({
        pages: ['data'],
        pageParams: [0],
      })
    })

    test('should return infinite query data', async () => {
      const key = queryKey()

      await queryClient.prefetchInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        initialPageParam: 10,
      })

      const result = queryClient.getQueryData(key)

      expect(result).toEqual({
        pages: [10],
        pageParams: [10],
      })
    })

    test('should prefetch multiple pages', async () => {
      const key = queryKey()

      await queryClient.prefetchInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => String(pageParam),
        getNextPageParam: (_lastPage, _pages, lastPageParam) =>
          lastPageParam + 5,
        initialPageParam: 10,
        pages: 3,
      })

      const result = queryClient.getQueryData(key)

      expect(result).toEqual({
        pages: ['10', '15', '20'],
        pageParams: [10, 15, 20],
      })
    })

    test('should stop prefetching if getNextPageParam returns undefined', async () => {
      const key = queryKey()

      await queryClient.prefetchInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => String(pageParam),
        getNextPageParam: (_lastPage, _pages, lastPageParam) =>
          lastPageParam >= 20 ? undefined : lastPageParam + 5,
        initialPageParam: 10,
        pages: 5,
      })

      const result = queryClient.getQueryData(key)

      expect(result).toEqual({
        pages: ['10', '15', '20'],
        pageParams: [10, 15, 20],
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
      >({ queryKey: key, queryFn: fetchFn })

      const result = queryClient.getQueryData(key)

      expect(result).toEqual('data')
    })

    test('should return undefined when an error is thrown', async () => {
      const key = queryKey()

      const result = await queryClient.prefetchQuery({
        queryKey: key,
        queryFn: async (): Promise<unknown> => {
          throw new Error('error')
        },
        retry: false,
      })

      expect(result).toBeUndefined()
    })

    test('should be garbage collected after gcTime if unused', async () => {
      const key = queryKey()

      await queryClient.prefetchQuery({
        queryKey: key,
        queryFn: async () => {
          return 'data'
        },
        gcTime: 10,
      })
      expect(queryCache.find({ queryKey: key })).toBeDefined()
      await sleep(15)
      expect(queryCache.find({ queryKey: key })).not.toBeDefined()
    })
  })

  describe('removeQueries', () => {
    test('should not crash when exact is provided', async () => {
      const key = queryKey()

      const fetchFn = () => Promise.resolve('data')

      // check the query was added to the cache
      await queryClient.prefetchQuery({ queryKey: key, queryFn: fetchFn })
      expect(queryCache.find({ queryKey: key })).toBeTruthy()

      // check the error doesn't occur
      expect(() =>
        queryClient.removeQueries({ queryKey: key, exact: true }),
      ).not.toThrow()

      // check query was successful removed
      expect(queryCache.find({ queryKey: key })).toBeFalsy()
    })
  })

  describe('cancelQueries', () => {
    test('should revert queries to their previous state', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()
      await queryClient.fetchQuery({
        queryKey: key1,
        queryFn: async () => {
          return 'data'
        },
      })
      try {
        await queryClient.fetchQuery({
          queryKey: key2,
          queryFn: async () => {
            return Promise.reject<unknown>('err')
          },
        })
      } catch {}
      queryClient.fetchQuery({
        queryKey: key1,
        queryFn: async () => {
          await sleep(1000)
          return 'data2'
        },
      })
      try {
        queryClient.fetchQuery({
          queryKey: key2,
          queryFn: async () => {
            await sleep(1000)
            return Promise.reject<unknown>('err2')
          },
        })
      } catch {}
      queryClient.fetchQuery({
        queryKey: key3,
        queryFn: async () => {
          await sleep(1000)
          return 'data3'
        },
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
        status: 'pending',
        fetchStatus: 'idle',
      })
    })

    test('should not revert if revert option is set to false', async () => {
      const key1 = queryKey()
      await queryClient.fetchQuery({
        queryKey: key1,
        queryFn: async () => {
          return 'data'
        },
      })
      queryClient.fetchQuery({
        queryKey: key1,
        queryFn: async () => {
          await sleep(1000)
          return 'data2'
        },
      })
      await sleep(10)
      await queryClient.cancelQueries({ queryKey: key1 }, { revert: false })
      const state1 = queryClient.getQueryState(key1)
      expect(state1).toMatchObject({
        status: 'error',
      })
    })
  })

  describe('refetchQueries', () => {
    test('should not refetch if all observers are disabled', async () => {
      const key = queryKey()
      const queryFn = vi.fn<Array<unknown>, string>().mockReturnValue('data')
      await queryClient.fetchQuery({ queryKey: key, queryFn })
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
      const queryFn = vi.fn<Array<unknown>, string>().mockReturnValue('data')
      await queryClient.fetchQuery({ queryKey: key, queryFn })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries({ queryKey: key1 })
      await queryClient.refetchQueries({ stale: true })
      unsubscribe()
      // fetchQuery, observer mount, invalidation (cancels observer mount) and refetch
      expect(queryFn1).toHaveBeenCalledTimes(4)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should be able to refetch all stale and active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
      queryClient.invalidateQueries({ queryKey: key1 })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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

    test('should resolve Promise immediately if query is paused', async () => {
      const key1 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      const onlineMock = mockOnlineManagerIsOnline(false)

      await queryClient.refetchQueries({ queryKey: key1 })

      // if we reach this point, the test succeeds because the Promise was resolved immediately
      expect(queryFn1).toHaveBeenCalledTimes(1)
      onlineMock.mockRestore()
    })

    test('should refetch if query we are offline but query networkMode is always', async () => {
      const key1 = queryKey()
      queryClient.setQueryDefaults(key1, { networkMode: 'always' })
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      const onlineMock = mockOnlineManagerIsOnline(false)

      await queryClient.refetchQueries({ queryKey: key1 })

      // initial fetch + refetch (even though we are offline)
      expect(queryFn1).toHaveBeenCalledTimes(2)
      onlineMock.mockRestore()
    })
  })

  describe('invalidateQueries', () => {
    test('should refetch active queries by default', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries({ queryKey: key1 })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch inactive queries by default', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        enabled: false,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries({ queryKey: key1 })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should not refetch active queries when "refetch" is "none"', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      queryClient.invalidateQueries({
        queryKey: key1,
        refetchType: 'none',
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should refetch inactive queries when "refetch" is "inactive"', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
        refetchOnMount: false,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      unsubscribe()

      await queryClient.invalidateQueries({
        queryKey: key1,
        refetchType: 'inactive',
      })
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    test('should refetch active and inactive queries when "refetch" is "all"', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
      await queryClient.fetchQuery({ queryKey: key1, queryFn: queryFn1 })
      await queryClient.fetchQuery({ queryKey: key2, queryFn: queryFn2 })
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
      const abortFn = vi.fn()
      let fetchCount = 0
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: ({ signal }) => {
          return new Promise((resolve) => {
            fetchCount++
            setTimeout(() => resolve(5), 10)
            signal.addEventListener('abort', abortFn)
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
      const abortFn = vi.fn()
      let fetchCount = 0
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: ({ signal }) => {
          return new Promise((resolve) => {
            fetchCount++
            setTimeout(() => resolve(5), 10)
            signal.addEventListener('abort', abortFn)
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

      const callback = vi.fn()

      await queryClient.prefetchQuery({ queryKey: key, queryFn: () => 'data' })

      queryCache.subscribe(callback)

      queryClient.resetQueries({ queryKey: key })

      expect(callback).toHaveBeenCalled()
    })

    test('should reset query', async () => {
      const key = queryKey()

      await queryClient.prefetchQuery({ queryKey: key, queryFn: () => 'data' })

      let state = queryClient.getQueryState(key)
      expect(state?.data).toEqual('data')
      expect(state?.status).toEqual('success')

      queryClient.resetQueries({ queryKey: key })

      state = queryClient.getQueryState(key)

      expect(state).toBeTruthy()
      expect(state?.data).toBeUndefined()
      expect(state?.status).toEqual('pending')
      expect(state?.fetchStatus).toEqual('idle')
    })

    test('should reset query data to initial data if set', async () => {
      const key = queryKey()

      await queryClient.prefetchQuery({
        queryKey: key,
        queryFn: () => 'data',
        initialData: 'initial',
      })

      let state = queryClient.getQueryState(key)
      expect(state?.data).toEqual('data')

      queryClient.resetQueries({ queryKey: key })

      state = queryClient.getQueryState(key)

      expect(state).toBeTruthy()
      expect(state?.data).toEqual('initial')
    })

    test('should refetch all active queries', async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const queryFn1 = vi.fn<Array<unknown>, string>().mockReturnValue('data1')
      const queryFn2 = vi.fn<Array<unknown>, string>().mockReturnValue('data2')
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

  describe('focusManager and onlineManager', () => {
    test('should notify queryCache and mutationCache if focused', async () => {
      const testClient = createQueryClient()
      testClient.mount()

      const queryCacheOnFocusSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
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

      const queryCacheOnFocusSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
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
      onlineManager.setOnline(true)
    })

    test('should resume paused mutations when coming online', async () => {
      const consoleMock = vi.spyOn(console, 'error')
      consoleMock.mockImplementation(() => undefined)
      onlineManager.setOnline(false)

      const observer1 = new MutationObserver(queryClient, {
        mutationFn: async () => 1,
      })

      const observer2 = new MutationObserver(queryClient, {
        mutationFn: async () => 2,
      })
      void observer1.mutate().catch(noop)
      void observer2.mutate().catch(noop)

      await waitFor(() => {
        expect(observer1.getCurrentResult().isPaused).toBeTruthy()
        expect(observer2.getCurrentResult().isPaused).toBeTruthy()
      })

      onlineManager.setOnline(true)

      await waitFor(() => {
        expect(observer1.getCurrentResult().status).toBe('success')
        expect(observer1.getCurrentResult().status).toBe('success')
      })

      onlineManager.setOnline(true)
    })

    test('should resume paused mutations one after the other when invoked manually at the same time', async () => {
      const consoleMock = vi.spyOn(console, 'error')
      consoleMock.mockImplementation(() => undefined)
      onlineManager.setOnline(false)

      const orders: Array<string> = []

      const observer1 = new MutationObserver(queryClient, {
        mutationFn: async () => {
          orders.push('1start')
          await sleep(50)
          orders.push('1end')
          return 1
        },
      })

      const observer2 = new MutationObserver(queryClient, {
        mutationFn: async () => {
          orders.push('2start')
          await sleep(20)
          orders.push('2end')
          return 2
        },
      })
      void observer1.mutate().catch(noop)
      void observer2.mutate().catch(noop)

      await waitFor(() => {
        expect(observer1.getCurrentResult().isPaused).toBeTruthy()
        expect(observer2.getCurrentResult().isPaused).toBeTruthy()
      })

      onlineManager.setOnline(true)
      void queryClient.resumePausedMutations()
      await sleep(5)
      await queryClient.resumePausedMutations()

      await waitFor(() => {
        expect(observer1.getCurrentResult().status).toBe('success')
        expect(observer2.getCurrentResult().status).toBe('success')
      })

      expect(orders).toEqual(['1start', '1end', '2start', '2end'])
    })

    test('should notify queryCache and mutationCache after multiple mounts and single unmount', async () => {
      const testClient = createQueryClient()
      testClient.mount()
      testClient.mount()
      testClient.unmount()

      const queryCacheOnFocusSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
        testClient.getMutationCache(),
        'resumePausedMutations',
      )

      onlineManager.setOnline(false)
      onlineManager.setOnline(true)
      expect(queryCacheOnOnlineSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(1)

      focusManager.setFocused(true)
      expect(queryCacheOnFocusSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(2)

      queryCacheOnFocusSpy.mockRestore()
      queryCacheOnOnlineSpy.mockRestore()
      mutationCacheResumePausedMutationsSpy.mockRestore()
      focusManager.setFocused(undefined)
      onlineManager.setOnline(true)
    })

    test('should not notify queryCache and mutationCache after multiple mounts/unmounts', async () => {
      const testClient = createQueryClient()
      testClient.mount()
      testClient.mount()
      testClient.unmount()
      testClient.unmount()

      const queryCacheOnFocusSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        testClient.getQueryCache(),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
        testClient.getMutationCache(),
        'resumePausedMutations',
      )

      onlineManager.setOnline(true)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      focusManager.setFocused(true)
      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      queryCacheOnFocusSpy.mockRestore()
      queryCacheOnOnlineSpy.mockRestore()
      mutationCacheResumePausedMutationsSpy.mockRestore()
      focusManager.setFocused(undefined)
      onlineManager.setOnline(true)
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
