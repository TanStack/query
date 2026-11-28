import { createKey, sleep } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CancelledError,
  MutationCache,
  MutationObserver,
  QueryCache,
  QueryClient,
  QueryObserver,
  cancelQueries,
  clearQueryClient,
  countFetchingQueries,
  defaultQueryFn,
  defaultQueryOptions,
  dehydrate,
  query as fetchQueryData,
  findCachedQuery,
  focusManager,
  getDefaultOptions,
  getMutationCache,
  getMutationDefaults,
  getQueriesData,
  getQueryCache,
  getQueryData,
  getQueryDefaults,
  getQueryState,
  hydrate,
  infiniteQuery,
  invalidateQueries,
  isMutating,
  mountQueryClient,
  noop,
  onlineManager,
  refetchQueries,
  removeQueries,
  resetQueries,
  resumePausedMutations,
  select as selectData,
  serialScope,
  setDefaultOptions,
  setMutationDefaults,
  setQueriesData,
  setQueryData,
  setQueryDefaults,
  skipToken,
  unmountQueryClient,
} from '..'
import { optionalSelect } from './helpers/projection'
import { mockOnlineManagerIsOnline } from './utils'
import type {
  InfiniteData,
  Query,
  QueryCacheNotifyEvent,
  QueryFunction,
  QueryObserverOptions,
} from '..'

describe('queryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryCache = getQueryCache(queryClient)
    mountQueryClient(queryClient)
  })

  afterEach(() => {
    clearQueryClient(queryClient)
    unmountQueryClient(queryClient)
    vi.useRealTimers()
  })

  describe('defaultOptions', () => {
    it('should resolve defaultQueryFn using the matching query defaults first', async () => {
      setDefaultOptions(queryClient, {
        queries: { queryFn: ({ queryKey }) => queryKey[0] },
      })
      setQueryDefaults(queryClient, ['posts'], { queryFn: () => 'post' })

      await expect(
        fetchQueryData(queryClient, {
          queryKey: ['posts', 1],
          queryFn: defaultQueryFn,
        }),
      ).resolves.toBe('post')
      await expect(
        fetchQueryData(queryClient, {
          queryKey: ['todos'],
          queryFn: defaultQueryFn,
        }),
      ).resolves.toBe('todos')
      await expect(
        fetchQueryData(queryClient, {
          queryKey: ['posts', 2],
          queryFn: () => 'override',
        }),
      ).resolves.toBe('override')
    })

    it('should reject defaultQueryFn when no query function is configured', async () => {
      await expect(
        fetchQueryData(queryClient, {
          queryKey: ['todos'],
          queryFn: defaultQueryFn,
        }),
      ).rejects.toThrow('Missing queryFn')
    })

    it('should merge defaultOptions', () => {
      const key = createKey()

      const queryFn = () => 'data'
      const testClient = new QueryClient({
        defaultOptions: { queries: { queryFn } },
      })

      expect(() =>
        fetchQueryData(testClient, { queryKey: key }).catch(noop),
      ).not.toThrow()
    })

    it('should merge defaultOptions when query is added to cache', async () => {
      const key = createKey()

      const testClient = new QueryClient({
        defaultOptions: {
          queries: { gcTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve('data')
      await fetchQueryData(testClient, {
        queryKey: key,
        queryFn: fetchData,
      }).catch(noop)
      const newQuery = findCachedQuery(getQueryCache(testClient), {
        queryKey: key,
      })
      expect(newQuery?.options.gcTime).toBe(Infinity)
    })

    it('should get defaultOptions', () => {
      const queryFn = () => 'data'
      const defaultOptions = { queries: { queryFn } }
      const testClient = new QueryClient({
        defaultOptions,
      })

      expect(getDefaultOptions(testClient)).toMatchObject(defaultOptions)
    })
  })

  describe('setQueryDefaults', () => {
    it('should not trigger a fetch', () => {
      const key = createKey()
      setQueryDefaults(queryClient, key, { queryFn: () => 'data' })
      const data = getQueryData(queryClient, key)
      expect(data).toBeUndefined()
    })

    it('should be able to override defaults', async () => {
      const key = createKey()
      setQueryDefaults(queryClient, key, { queryFn: () => 'data' })
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: defaultQueryFn,
      })
      const { data } = await observer.refetch()
      expect(data).toBe('data')
    })

    it('should match the query key partially', async () => {
      const key = createKey()
      setQueryDefaults(queryClient, [key], { queryFn: () => 'data' })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key, 'a'],
        queryFn: defaultQueryFn,
      })
      const { data } = await observer.refetch()
      expect(data).toBe('data')
    })

    it('should use the QueryCache equality function when matching defaults', () => {
      const equalityFn = (a: unknown, b: unknown) =>
        typeof a === 'string' && typeof b === 'string'
          ? a.toLowerCase() === b.toLowerCase()
          : a === b
      const testClient = new QueryClient({
        queryCache: new QueryCache({ queryKey: { equalityFn } }),
      })

      setQueryDefaults(testClient, ['todos', { status: 'done' }], {
        staleTime: 1000,
      })

      expect(
        getQueryDefaults(testClient, ['TODOS', { status: 'DONE' }]),
      ).toMatchObject({ staleTime: 1000 })

      clearQueryClient(testClient)
    })

    it('should not match if the query key is a subset', async () => {
      const key = createKey()
      setQueryDefaults(queryClient, [key, 'a'], {
        queryFn: () => 'data',
      })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key],
        queryFn: defaultQueryFn,
        retry: false,
        enabled: false,
      })
      const { status } = await observer.refetch()
      expect(status).toBe('error')
    })

    it('should also set defaults for observers', () => {
      const key = createKey()
      setQueryDefaults(queryClient, key, {
        queryFn: () => 'data',
        enabled: false,
      })
      const observer = new QueryObserver(queryClient, {
        queryKey: [key],
        queryFn: defaultQueryFn,
      })

      expect(observer.getCurrentResult().status).toBe('pending')
      expect(observer.getCurrentResult().fetchStatus).toBe('idle')
    })

    it('should update existing query defaults', () => {
      const key = createKey()
      const queryOptions1 = { queryFn: () => 'data' }
      const queryOptions2 = { retry: false }
      setQueryDefaults(queryClient, key, { ...queryOptions1 })
      setQueryDefaults(queryClient, key, { ...queryOptions2 })

      expect(getQueryDefaults(queryClient, key)).toMatchObject(queryOptions2)
    })

    it('should merge defaultOptions', () => {
      const key = createKey()

      setQueryDefaults(queryClient, [...key, 'todo'], { suspense: true })
      setQueryDefaults(queryClient, [...key, 'todo', 'detail'], {
        staleTime: 5000,
      })

      expect(
        getQueryDefaults(queryClient, [...key, 'todo', 'detail']),
      ).toMatchObject({ suspense: true, staleTime: 5000 })
    })
  })

  describe('defaultQueryOptions', () => {
    it('should default networkMode when persister is present', () => {
      expect(
        defaultQueryOptions(
          new QueryClient({
            defaultOptions: {
              queries: {
                persister: 'ignore' as any,
              },
            },
          }),
          { queryKey: createKey() },
        ).networkMode,
      ).toBe('offlineFirst')
    })

    it('should not default networkMode without persister', () => {
      expect(
        defaultQueryOptions(
          new QueryClient({
            defaultOptions: {
              queries: {
                staleTime: 1000,
              },
            },
          }),
          { queryKey: createKey() },
        ).networkMode,
      ).toBeUndefined()
    })

    it('should not default networkMode when already present', () => {
      expect(
        defaultQueryOptions(
          new QueryClient({
            defaultOptions: {
              queries: {
                persister: 'ignore' as any,
                networkMode: 'always',
              },
            },
          }),
          { queryKey: createKey() },
        ).networkMode,
      ).toBe('always')
    })
  })

  describe('setQueryData', () => {
    it('should not crash if query could not be found', () => {
      const key = createKey()
      const user = { userId: 1 }
      expect(() => {
        setQueryData(queryClient, [key, user], (prevUser?: typeof user) => ({
          ...prevUser!,
          name: 'James',
        }))
      }).not.toThrow()
    })

    it('should not crash when variable is null', () => {
      const key = createKey()
      setQueryData(queryClient, [key, { userId: null }], 'Old Data')
      expect(() => {
        setQueryData(queryClient, [key, { userId: null }], 'New Data')
      }).not.toThrow()
    })

    it('should use the configured query cache hash function', () => {
      const key = createKey()
      const testClient = new QueryClient({
        queryCache: new QueryCache({ queryKey: { hashFn: () => 'someKey' } }),
      })
      const testCache = getQueryCache(testClient)
      setQueryData(testClient, key, 'data')
      expect(getQueryData(testClient, key)).toBe('data')
      expect(findCachedQuery(testCache, { queryKey: key })).toBe(
        testCache.get('someKey'),
      )
    })

    it('should create a new query if query was not found 1', () => {
      const key = createKey()
      setQueryData(queryClient, key, 'bar')
      expect(getQueryData(queryClient, key)).toBe('bar')
    })

    it('should create a new query if query was not found 2', () => {
      const key = createKey()
      setQueryData(queryClient, key, 'qux')
      expect(getQueryData(queryClient, key)).toBe('qux')
    })

    it('should not create a new query if query was not found and data is undefined', () => {
      const key = createKey()
      expect(
        findCachedQuery(getQueryCache(queryClient), { queryKey: key }),
      ).toBeUndefined()

      setQueryData(queryClient, key, undefined)
      expect(
        findCachedQuery(getQueryCache(queryClient), { queryKey: key }),
      ).toBeUndefined()
    })

    it('should not create a new query if query was not found and updater returns undefined', () => {
      const key = createKey()
      expect(
        findCachedQuery(getQueryCache(queryClient), { queryKey: key }),
      ).toBeUndefined()

      setQueryData(queryClient, key, () => undefined)
      expect(
        findCachedQuery(getQueryCache(queryClient), { queryKey: key }),
      ).toBeUndefined()
    })

    it('should not update query data if data is undefined', () => {
      const key = createKey()
      setQueryData(queryClient, key, 'qux')
      setQueryData(queryClient, key, undefined)
      expect(getQueryData(queryClient, key)).toBe('qux')
    })

    it('should not update query data if updater returns undefined', () => {
      const key = createKey()
      setQueryData<string>(queryClient, key, 'qux')
      setQueryData<string>(queryClient, key, () => undefined)
      expect(getQueryData(queryClient, key)).toBe('qux')
    })

    it('should accept an update function', () => {
      const key = createKey()

      const updater = vi.fn<(oldData: string | undefined) => string>(
        (oldData) => `new data + ${oldData}`,
      )

      setQueryData(queryClient, key, 'test data')
      setQueryData(queryClient, key, updater)
      expect(updater).toHaveBeenCalledWith('test data')
      expect(findCachedQuery(queryCache, { queryKey: key })!.state.data).toBe(
        'new data + test data',
      )
    })

    it('should set the new data without comparison if structuralSharing is set to false', () => {
      const key = createKey()

      setDefaultOptions(queryClient, {
        queries: {
          structuralSharing: false,
        },
      })

      const oldData = { value: true }
      const newData = { value: true }
      setQueryData(queryClient, key, oldData)
      setQueryData(queryClient, key, newData)
      expect(findCachedQuery(queryCache, { queryKey: key })!.state.data).toBe(
        newData,
      )
    })

    it('should apply a custom structuralSharing function when provided', () => {
      const key = createKey()

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
      } as Pick<QueryObserverOptions, 'structuralSharing'>

      setDefaultOptions(queryClient, { queries: queryObserverOptions })

      const oldData = { value: new Date(2022, 6, 19) }
      const newData = { value: new Date(2022, 6, 19) }
      setQueryData(queryClient, key, oldData)
      setQueryData(queryClient, key, newData)
      expect(findCachedQuery(queryCache, { queryKey: key })!.state.data).toBe(
        oldData,
      )

      const distinctData = { value: new Date(2021, 11, 25) }
      setQueryData(queryClient, key, distinctData)
      expect(findCachedQuery(queryCache, { queryKey: key })!.state.data).toBe(
        distinctData,
      )
    })

    it('should not set isFetching to false', async () => {
      const key = createKey()
      void fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: () => sleep(10).then(() => 23),
      }).catch(noop)
      expect(getQueryState(queryClient, key)).toMatchObject({
        data: undefined,
        fetchStatus: 'fetching',
      })

      setQueryData(queryClient, key, 42)
      expect(getQueryState(queryClient, key)).toMatchObject({
        data: 42,
        fetchStatus: 'fetching',
      })
      await vi.advanceTimersByTimeAsync(10)
      expect(getQueryState(queryClient, key)).toMatchObject({
        data: 23,
        fetchStatus: 'idle',
      })
    })
  })

  describe('setQueriesData', () => {
    it('should update all existing, matching queries', () => {
      setQueryData(queryClient, ['key', 1], 1)
      setQueryData(queryClient, ['key', 2], 2)

      const result = setQueriesData<number>(
        queryClient,
        { queryKey: ['key'] },
        (old) => (old ? old + 5 : undefined),
      )

      expect(result).toStrictEqual([
        [['key', 1], 6],
        [['key', 2], 7],
      ])
      expect(getQueryData(queryClient, ['key', 1])).toBe(6)
      expect(getQueryData(queryClient, ['key', 2])).toBe(7)
    })

    it('should accept queryFilters', () => {
      setQueryData(queryClient, ['key', 1], 1)
      setQueryData(queryClient, ['key', 2], 2)
      const query1 = findCachedQuery(queryCache, { queryKey: ['key', 1] })!

      const result = setQueriesData<number>(
        queryClient,
        { predicate: (query) => query === query1 },
        (old) => old! + 5,
      )

      expect(result).toStrictEqual([[['key', 1], 6]])
      expect(getQueryData(queryClient, ['key', 1])).toBe(6)
      expect(getQueryData(queryClient, ['key', 2])).toBe(2)
    })

    it('should not update non existing queries', () => {
      const result = setQueriesData<string>(
        queryClient,
        { queryKey: ['key'] },
        'data',
      )

      expect(result).toStrictEqual([])
      expect(getQueryData(queryClient, ['key'])).toBeUndefined()
    })
  })

  describe('isFetching', () => {
    it('should return length of fetching queries', async () => {
      expect(countFetchingQueries(queryClient)).toBe(0)

      void fetchQueryData(queryClient, {
        queryKey: createKey(),
        queryFn: () => sleep(10).then(() => 'data'),
      }).catch(noop)
      expect(countFetchingQueries(queryClient)).toBe(1)

      void fetchQueryData(queryClient, {
        queryKey: createKey(),
        queryFn: () => sleep(5).then(() => 'data'),
      }).catch(noop)
      expect(countFetchingQueries(queryClient)).toBe(2)
      await vi.advanceTimersByTimeAsync(5)
      expect(countFetchingQueries(queryClient)).toBe(1)
      await vi.advanceTimersByTimeAsync(5)
      expect(countFetchingQueries(queryClient)).toBe(0)
    })
  })

  describe('isMutating', () => {
    it('should return length of mutating', async () => {
      expect(isMutating(queryClient)).toBe(0)
      new MutationObserver(queryClient, {
        mutationFn: () => sleep(10).then(() => 'data'),
      }).mutate()

      expect(isMutating(queryClient)).toBe(1)
      new MutationObserver(queryClient, {
        mutationFn: () => sleep(5).then(() => 'data'),
      }).mutate()

      expect(isMutating(queryClient)).toBe(2)
      await vi.advanceTimersByTimeAsync(5)
      expect(isMutating(queryClient)).toBe(1)
      await vi.advanceTimersByTimeAsync(5)
      expect(isMutating(queryClient)).toBe(0)
    })
  })

  describe('getQueryData', () => {
    it('should return the query data if the query is found', () => {
      const key = createKey()
      setQueryData(queryClient, [key, 'id'], 'bar')
      expect(getQueryData(queryClient, [key, 'id'])).toBe('bar')
    })

    it('should return undefined if the query is not found', () => {
      const key = createKey()
      expect(getQueryData(queryClient, key)).toBeUndefined()
    })

    it('should match exact by default', () => {
      const key = createKey()
      setQueryData(queryClient, [key, 'id'], 'bar')
      expect(getQueryData(queryClient, [key])).toBeUndefined()
    })
  })

  describe('query with static staleTime', () => {
    it('should return the cached query data if the query is found', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      setQueryData(queryClient, [key, 'id'], 'bar')
      await expect(
        fetchQueryData(queryClient, {
          queryKey: [key, 'id'],
          queryFn,
          staleTime: 'static',
        }),
      ).resolves.toBe('bar')
      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should return the cached query data if the query is found and cached query data is falsy', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<number>>(() => Promise.resolve(0))

      setQueryData(queryClient, [key, 'id'], null)
      await expect(
        fetchQueryData(queryClient, {
          queryKey: [key, 'id'],
          queryFn,
          staleTime: 'static',
        }),
      ).resolves.toBeNull()
      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should call queryFn and return its results if the query is not found', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      await expect(
        fetchQueryData(queryClient, {
          queryKey: [key],
          queryFn,
          staleTime: 'static',
        }),
      ).resolves.toBe('data')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should not fetch when initialData is provided', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      await expect(
        fetchQueryData(queryClient, {
          queryKey: [key, 'id'],
          queryFn,
          staleTime: 'static',
          initialData: 'initial',
        }),
      ).resolves.toBe('initial')

      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should support manual background revalidation via a second query call', async () => {
      const key = createKey()
      let value = 'data-1'
      const queryFn = vi.fn<() => Promise<string>>(() => Promise.resolve(value))

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn,
          staleTime: 'static',
        }),
      ).resolves.toBe('data-1')
      expect(queryFn).toHaveBeenCalledTimes(1)

      value = 'data-2'
      void fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 0,
      }).catch(noop)
      await vi.advanceTimersByTimeAsync(0)
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(getQueryData(queryClient, key)).toBe('data-2')
    })
  })

  describe('infiniteQuery with static staleTime', () => {
    it('should return the cached query data if the query is found', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      setQueryData(queryClient, [key, 'id'], {
        pages: ['bar'],
        pageParams: [0],
      })
      await expect(
        infiniteQuery(queryClient, {
          queryKey: [key, 'id'],
          queryFn,
          staleTime: 'static',
          initialPageParam: 1,
          getNextPageParam: () => undefined,
        }),
      ).resolves.toStrictEqual({ pages: ['bar'], pageParams: [0] })
      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should fetch the query and return its results if the query is not found', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      await expect(
        infiniteQuery(queryClient, {
          queryKey: [key, 'id'],
          queryFn,
          staleTime: 'static',
          initialPageParam: 1,
          getNextPageParam: () => undefined,
        }),
      ).resolves.toStrictEqual({ pages: ['data'], pageParams: [1] })
      expect(queryFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('getQueriesData', () => {
    it('should return the query data for all matched queries', () => {
      const key1 = createKey()
      const key2 = createKey()
      setQueryData(queryClient, [key1, 1], 1)
      setQueryData(queryClient, [key1, 2], 2)
      setQueryData(queryClient, [key2, 2], 2)
      expect(getQueriesData(queryClient, { queryKey: [key1] })).toStrictEqual([
        [[key1, 1], 1],
        [[key1, 2], 2],
      ])
    })

    it('should return empty array if queries are not found', () => {
      const key = createKey()
      expect(getQueriesData(queryClient, { queryKey: key })).toStrictEqual([])
    })

    it('should accept query filters', () => {
      setQueryData(queryClient, ['key', 1], 1)
      setQueryData(queryClient, ['key', 2], 2)
      const query1 = findCachedQuery(queryCache, { queryKey: ['key', 1] })!

      const result = getQueriesData(queryClient, {
        predicate: (query) => query === query1,
      })

      expect(result).toStrictEqual([[['key', 1], 1]])
    })
  })

  describe('query', () => {
    it('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', ...ReturnType<typeof createKey>]
      const key: StrictQueryKey = ['strict', ...createKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve('data')

      await expect(
        fetchQueryData<StrictData, any, StrictData, StrictData, StrictQueryKey>(
          queryClient,
          {
            queryKey: key,
            queryFn: fetchFn,
          },
        ),
      ).resolves.toBe('data')
    })

    // https://github.com/tannerlinsley/react-query/issues/652
    it('should not retry by default', async () => {
      const key = createKey()

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn: (): Promise<unknown> => {
            throw new Error('error')
          },
        }),
      ).rejects.toStrictEqual(new Error('error'))
    })

    it('should return the cached data on cache hit', async () => {
      const key = createKey()

      const fetchFn = () => Promise.resolve('data')
      const first = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
      })
      const second = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
      })
      expect(second).toBe(first)
    })

    it('should fetch when disabled', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn,
          // @ts-expect-error enabled is not supported for imperative queries
          enabled: false,
        }),
      ).resolves.toBe('data')

      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should fetch when disabled by callback', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('data'),
      )

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn,
          // @ts-expect-error enabled is not supported for imperative queries
          enabled: () => false,
        }),
      ).resolves.toBe('data')

      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should fetch when disabled and apply select', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('fetched-data'),
      )

      setQueryData(queryClient, key, 'cached-data')

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        // @ts-expect-error enabled is not supported for imperative queries
        enabled: false,
        staleTime: 0,
        select: [selectData, (data) => `${data}-selected`],
      })
      expect(result).toBe('fetched-data-selected')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should fetch instead of returning initialData when disabled', async () => {
      const booleanQueryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('fetched-data'),
      )

      await expect(
        fetchQueryData(queryClient, {
          queryKey: createKey(),
          queryFn: booleanQueryFn,
          // @ts-expect-error enabled is not supported for imperative queries
          enabled: false,
          initialData: 'initial-data',
        }),
      ).resolves.toBe('fetched-data')

      expect(booleanQueryFn).toHaveBeenCalledTimes(1)
    })

    it('should leave a cache miss untouched when skipToken is provided', async () => {
      const key = createKey()
      const initialData = vi.fn<() => string>(() => 'initial')
      const select = vi.fn<(data: unknown) => number>(
        (data: unknown) => (data as string).length,
      )

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn: skipToken,
          select: optionalSelect(select),
          initialData,
        }),
      ).resolves.toBeUndefined()

      expect(select).not.toHaveBeenCalled()
      expect(initialData).not.toHaveBeenCalled()
      expect(getQueryState(queryClient, key)).toBeUndefined()
    })

    it('should return stale cached data when skipToken is provided', async () => {
      const key = createKey()

      setQueryData(queryClient, key, 'cached-data')

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: skipToken,
        select: optionalSelect((data: unknown) => (data as string).length),
      })
      expect(result).toBe('cached-data'.length)
    })

    it('should read the cache without waiting for an in-flight query', async () => {
      const queryKey = createKey()
      const { promise, resolve } = Promise.withResolvers<number>()
      const fetching = fetchQueryData(queryClient, {
        queryKey,
        queryFn: () => promise,
      })

      await expect(
        fetchQueryData(queryClient, { queryKey, queryFn: skipToken }),
      ).resolves.toBeUndefined()

      resolve(5)
      await expect(fetching).resolves.toBe(5)
    })

    it('should fetch when enabled callback returns false', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('fetched-data'),
      )

      setQueryData(queryClient, key, 'cached-data')

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        // @ts-expect-error enabled is not supported for imperative queries
        enabled: () => false,
      })
      expect(result).toBe('fetched-data')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should fetch when enabled callback returns true and cache is stale', async () => {
      const key = createKey()

      setQueryData(queryClient, key, 'old-data')
      await vi.advanceTimersByTimeAsync(1)

      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('new-data'),
      )

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        // @ts-expect-error enabled is not supported for imperative queries
        enabled: () => true,
        staleTime: 0,
      })
      expect(result).toBe('new-data')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should read from cache with static staleTime even if invalidated', async () => {
      const key = createKey()

      const fetchFn = vi.fn<() => Promise<{ data: string }>>(() =>
        Promise.resolve({ data: 'data' }),
      )
      const first = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
        staleTime: 'static',
      })
      expect(first.data).toBe('data')
      expect(fetchFn).toHaveBeenCalledTimes(1)

      await invalidateQueries(queryClient, {
        queryKey: key,
        refetchType: 'none',
      })

      const second = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
        staleTime: 'static',
      })
      expect(fetchFn).toHaveBeenCalledTimes(1)

      expect(second).toBe(first)
    })

    it('should be able to fetch when garbage collection time is set to 0 and then be removed', async () => {
      const key1 = createKey()
      const promise = fetchQueryData(queryClient, {
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 1),
        gcTime: 0,
      })
      await vi.advanceTimersByTimeAsync(10)
      await expect(promise).resolves.toBe(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(getQueryData(queryClient, key1)).toBeUndefined()
    })

    it('should keep a query in cache if garbage collection time is Infinity', async () => {
      const key1 = createKey()
      const promise = fetchQueryData(queryClient, {
        queryKey: key1,
        queryFn: () => sleep(10).then(() => 1),
        gcTime: Infinity,
      })
      await vi.advanceTimersByTimeAsync(10)
      const result2 = getQueryData(queryClient, key1)
      await expect(promise).resolves.toBe(1)
      expect(result2).toBe(1)
    })

    it('should not force fetch', async () => {
      const key = createKey()

      setQueryData(queryClient, key, 'og')
      const fetchFn = () => Promise.resolve('new')
      const first = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
        initialData: 'initial',
        staleTime: 100,
      })
      expect(first).toBe('og')
    })

    it('should only fetch if the data is older then the given stale time', async () => {
      const key = createKey()

      let count = 0
      const queryFn = () => ++count

      setQueryData(queryClient, key, count)
      const firstPromise = fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 100,
      })
      await expect(firstPromise).resolves.toBe(0)
      await vi.advanceTimersByTimeAsync(10)
      const secondPromise = fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 10,
      })
      await expect(secondPromise).resolves.toBe(1)

      const thirdPromise = fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 10,
      })
      await expect(thirdPromise).resolves.toBe(1)
      await vi.advanceTimersByTimeAsync(10)
      const fourthPromise = fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 10,
      })
      await expect(fourthPromise).resolves.toBe(2)
    })

    it('should evaluate staleTime when provided as a function', async () => {
      const key = createKey()
      const staleTime = vi.fn<() => number>(() => 0)

      setQueryData(queryClient, key, 'old-data')
      await vi.advanceTimersByTimeAsync(1)

      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('new-data'),
      )

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime,
      })
      expect(result).toBe('new-data')
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(staleTime).toHaveBeenCalledTimes(1)
    })

    it('should allow new meta', async () => {
      const key = createKey()

      const first = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: ({ meta }) => Promise.resolve(meta),
        meta: {
          foo: true,
        },
      })
      expect(first).toStrictEqual({ foo: true })

      const second = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: ({ meta }) => Promise.resolve(meta),
        meta: {
          foo: false,
        },
      })
      expect(second).toStrictEqual({ foo: false })
    })

    it('should fetch when enabled is true and cache is stale', async () => {
      const key = createKey()

      setQueryData(queryClient, key, 'old-data')
      await vi.advanceTimersByTimeAsync(1)

      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('new-data'),
      )

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        // @ts-expect-error enabled is not supported for imperative queries
        enabled: true,
        staleTime: 0,
      })
      expect(result).toBe('new-data')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should propagate errors', async () => {
      const key = createKey()

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn: (): Promise<unknown> => {
            throw new Error('error')
          },
        }),
      ).rejects.toStrictEqual(new Error('error'))
    })

    it('should apply select when data is fresh in cache', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<string>>(() =>
        Promise.resolve('fetched-data'),
      )

      setQueryData(queryClient, key, 'cached-data')

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: Infinity,
        select: [selectData, (data) => `${data}-selected`],
      })
      expect(result).toBe('cached-data-selected')
      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should apply select to freshly fetched data', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => Promise<{ value: string }>>(() =>
        Promise.resolve({ value: 'fetched-data' }),
      )

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn,
        select: [selectData, (data) => data.value.toUpperCase()],
      })
      expect(result).toBe('FETCHED-DATA')
      expect(queryFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('infiniteQuery', () => {
    it('should not type-error with strict query key', async () => {
      type StrictData = string
      type StrictQueryKey = ['strict', ...ReturnType<typeof createKey>]
      const key: StrictQueryKey = ['strict', ...createKey()]

      const data = {
        pages: ['data'],
        pageParams: [0],
      } as const

      const fetchFn: QueryFunction<StrictData, StrictQueryKey, number> = () =>
        Promise.resolve(data.pages[0])

      await expect(
        infiniteQuery<StrictData, any, StrictData, StrictQueryKey, number>(
          queryClient,
          {
            queryKey: key,
            queryFn: fetchFn,
            getNextPageParam: () => undefined,
            initialPageParam: 0,
          },
        ),
      ).resolves.toStrictEqual(data)
    })

    it('should return infinite query data', async () => {
      const key = createKey()
      const result = await infiniteQuery(queryClient, {
        queryKey: key,
        getNextPageParam: () => undefined,
        initialPageParam: 10,
        queryFn: ({ pageParam }) => Number(pageParam),
      })
      const result2 = getQueryData(queryClient, key)

      const expected = {
        pages: [10],
        pageParams: [10],
      }

      expect(result).toStrictEqual(expected)
      expect(result2).toStrictEqual(expected)
    })

    it('should fetch when disabled', async () => {
      const key = createKey()
      const queryFn = vi.fn<
        (context: { pageParam: number }) => Promise<number>
      >(({ pageParam }: { pageParam: number }) => Promise.resolve(pageParam))

      await expect(
        infiniteQuery(queryClient, {
          queryKey: key,
          queryFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
          // @ts-expect-error enabled is not supported for imperative queries
          enabled: false,
        }),
      ).resolves.toStrictEqual({ pages: [0], pageParams: [0] })

      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should fetch when disabled and apply select', async () => {
      const key = createKey()
      const queryFn = vi.fn<
        (context: { pageParam: number }) => Promise<string>
      >(({ pageParam }: { pageParam: number }) =>
        Promise.resolve(`'fetched-${String(pageParam)}`),
      )

      setQueryData(queryClient, key, {
        pages: ['cached-page'],
        pageParams: [0],
      })

      const result = await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
        // @ts-expect-error enabled is not supported for imperative queries
        enabled: false,
        select: [
          selectData,
          (data) => data.pages.map((page) => `${page}-selected`),
        ],
      })
      expect(result).toStrictEqual(["'fetched-0-selected"])
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should return stale cached data when skipToken is provided', async () => {
      const key = createKey()

      setQueryData(queryClient, key, {
        pages: ['page-1'],
        pageParams: [0],
      })

      const result = await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn: skipToken,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
      })
      expect(result).toStrictEqual({
        pages: ['page-1'],
        pageParams: [0],
      })
    })

    it('should leave a cache miss untouched when skipToken is provided', async () => {
      const key = createKey()
      const select = vi.fn<(data: { pages: Array<string> }) => number>(
        (data: { pages: Array<string> }) => data.pages.length,
      )

      await expect(
        infiniteQuery(queryClient, {
          queryKey: key,
          queryFn: skipToken,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
          select: optionalSelect(select),
        }),
      ).resolves.toBeUndefined()

      expect(select).not.toHaveBeenCalled()
      expect(getQueryState(queryClient, key)).toBeUndefined()
    })

    it('should evaluate staleTime callback and refetch when it returns stale', async () => {
      const key = createKey()

      setQueryData(queryClient, key, {
        pages: [{ value: 'old-page', staleTime: 0 }],
        pageParams: [0],
      })
      await vi.advanceTimersByTimeAsync(1)

      const queryFn = vi.fn<
        (context: {
          pageParam: number
        }) => Promise<{ value: string; staleTime: number }>
      >(({ pageParam }: { pageParam: number }) =>
        Promise.resolve({
          value: `new-page-${String(pageParam)}`,
          staleTime: 0,
        }),
      )
      const staleTimeSpy = vi.fn<() => void>()
      const staleTime = (
        query: Query<
          { value: string; staleTime: number },
          Error,
          InfiniteData<{ value: string; staleTime: number }, number>
        >,
      ) => {
        staleTimeSpy()
        return query.state.data?.pages[0]?.staleTime ?? 0
      }

      const result = await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
        staleTime,
      })
      expect(result).toStrictEqual({
        pages: [{ value: 'new-page-0', staleTime: 0 }],
        pageParams: [0],
      })
      expect(staleTimeSpy).toHaveBeenCalledWith()
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should read from cache with static staleTime even if invalidated', async () => {
      const key = createKey()

      const queryFn = vi.fn<
        (context: { pageParam: number }) => Promise<{ value: string }>
      >(({ pageParam }: { pageParam: number }) =>
        Promise.resolve({ value: `fetched-${String(pageParam)}` }),
      )
      const first = await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
        staleTime: 'static',
      })
      expect(first).toStrictEqual({
        pages: [{ value: 'fetched-0' }],
        pageParams: [0],
      })
      expect(queryFn).toHaveBeenCalledTimes(1)

      await invalidateQueries(queryClient, {
        queryKey: key,
        refetchType: 'none',
      })

      const second = await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn,
        getNextPageParam: () => undefined,
        initialPageParam: 0,
        staleTime: 'static',
      })
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(second).toBe(first)
    })

    it('should apply select to infinite query data', async () => {
      const key = createKey()

      const result = await infiniteQuery(queryClient, {
        queryKey: key,
        getNextPageParam: () => undefined,
        initialPageParam: 10,
        queryFn: ({ pageParam }) => Number(pageParam),
        select: [selectData, (data) => data.pages.map((page) => page * 2)],
      })
      expect(result).toStrictEqual([20])
    })
  })

  describe('infiniteQuery used for prefetching', () => {
    it('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', ...ReturnType<typeof createKey>]
      const key: StrictQueryKey = ['strict', ...createKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey, number> = () =>
        Promise.resolve('data')

      await infiniteQuery<StrictData, any, StrictData, StrictQueryKey, number>(
        queryClient,
        {
          queryKey: key,
          queryFn: fetchFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        },
      ).catch(noop)

      const result = getQueryData(queryClient, key)

      expect(result).toStrictEqual({
        pages: ['data'],
        pageParams: [0],
      })
    })

    it('should return infinite query data', async () => {
      const key = createKey()

      await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn: ({ pageParam }) => Number(pageParam),
        getNextPageParam: () => undefined,
        initialPageParam: 10,
      }).catch(noop)

      const result = getQueryData(queryClient, key)

      expect(result).toStrictEqual({
        pages: [10],
        pageParams: [10],
      })
    })

    it('should prefetch multiple pages', async () => {
      const key = createKey()

      await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn: ({ pageParam }) => String(pageParam),
        getNextPageParam: (_lastPage, _pages, lastPageParam) =>
          lastPageParam + 5,
        initialPageParam: 10,
        pages: 3,
      }).catch(noop)

      const result = getQueryData(queryClient, key)

      expect(result).toStrictEqual({
        pages: ['10', '15', '20'],
        pageParams: [10, 15, 20],
      })
    })

    it('should stop prefetching if getNextPageParam returns undefined', async () => {
      const key = createKey()
      let count = 0

      await infiniteQuery(queryClient, {
        queryKey: key,
        queryFn: ({ pageParam }) => String(pageParam),
        getNextPageParam: (_lastPage, _pages, lastPageParam) => {
          count++
          return lastPageParam >= 20 ? undefined : lastPageParam + 5
        },
        initialPageParam: 10,
        pages: 5,
      }).catch(noop)

      const result = getQueryData(queryClient, key)

      expect(result).toStrictEqual({
        pages: ['10', '15', '20'],
        pageParams: [10, 15, 20],
      })

      // this check ensures we're exiting the fetch loop early
      expect(count).toBe(3)
    })
  })

  describe('query used for prefetching', () => {
    it('should not type-error with strict query key', async () => {
      type StrictData = 'data'
      type StrictQueryKey = ['strict', ...ReturnType<typeof createKey>]
      const key: StrictQueryKey = ['strict', ...createKey()]

      const fetchFn: QueryFunction<StrictData, StrictQueryKey> = () =>
        Promise.resolve('data')

      await fetchQueryData<
        StrictData,
        any,
        StrictData,
        StrictData,
        StrictQueryKey
      >(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
      }).catch(noop)

      const result = getQueryData(queryClient, key)

      expect(result).toBe('data')
    })

    it('should resolve to undefined when error is caught with noop', async () => {
      const key = createKey()

      const result = await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: (): Promise<unknown> => {
          throw new Error('error')
        },
        retry: false,
      }).catch(noop)
      expect(result).toBeUndefined()
    })

    it('should be garbage collected after gcTime if unused', async () => {
      const key = createKey()

      await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 10,
      }).catch(noop)
      expect(findCachedQuery(queryCache, { queryKey: key })).toBeDefined()
      await vi.advanceTimersByTimeAsync(15)
      expect(findCachedQuery(queryCache, { queryKey: key })).toBeUndefined()
    })
  })

  describe('removeQueries', () => {
    it('should not crash when exact is provided', async () => {
      const key = createKey()

      const fetchFn = () => Promise.resolve('data')

      // check the query was added to the cache
      await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: fetchFn,
      }).catch(noop)
      expect(findCachedQuery(queryCache, { queryKey: key })?.state.data).toBe(
        'data',
      )

      // check the error doesn't occur
      expect(() =>
        removeQueries(queryClient, { queryKey: key, exact: true }),
      ).not.toThrow()

      // check query was successful removed
      expect(findCachedQuery(queryCache, { queryKey: key })).toBeUndefined()
    })
  })

  describe('cancelQueries', () => {
    it('should revert queries to their previous state', async () => {
      const key1 = createKey()
      setQueryData(queryClient, key1, 'data')

      const pending = fetchQueryData(queryClient, {
        queryKey: key1,
        queryFn: () => sleep(1000).then(() => 'data2'),
      })
      await vi.advanceTimersByTimeAsync(10)

      await cancelQueries(queryClient)

      // with previous data present, imperative fetch should resolve to that data after cancel
      await expect(pending).resolves.toBe('data')

      const state1 = getQueryState(queryClient, key1)
      expect(state1).toMatchObject({
        data: 'data',
        status: 'success',
      })
    })

    it('should not revert if revert option is set to false', async () => {
      const key1 = createKey()
      await fetchQueryData(queryClient, {
        queryKey: key1,
        queryFn: () => 'data',
      })
      void fetchQueryData(queryClient, {
        queryKey: key1,
        queryFn: () => sleep(1000).then(() => 'data2'),
      }).catch(noop)
      await vi.advanceTimersByTimeAsync(10)
      await cancelQueries(queryClient, { queryKey: key1 }, { revert: false })
      const state1 = getQueryState(queryClient, key1)
      expect(state1).toMatchObject({
        status: 'error',
      })
    })

    it('should throw CancelledError for imperative methods when initial fetch is cancelled', async () => {
      const key = createKey()

      const promise = fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: () => sleep(50).then(() => 25),
      })
      await vi.advanceTimersByTimeAsync(10)

      await cancelQueries(queryClient, { queryKey: key })

      // we have to reject here because we can't resolve with `undefined`
      // the alternative would be a never-ending promise
      await expect(promise).rejects.toBeInstanceOf(CancelledError)

      // however, the query was correctly reverted to pending state
      expect(getQueryState(queryClient, key)).toMatchObject({
        status: 'pending',
        fetchStatus: 'idle',
        data: undefined,
        error: null,
      })
    })
  })

  describe('refetchQueries', () => {
    it('should not refetch if all observers are disabled', async () => {
      const key = createKey()
      const queryFn = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data')
      await fetchQueryData(queryClient, { queryKey: key, queryFn })
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        enabled: false,
      })
      observer1.subscribe(() => undefined)
      await refetchQueries(queryClient)
      observer1.destroy()
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should refetch if at least one observer is enabled', async () => {
      const key = createKey()
      const queryFn = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data')
      await fetchQueryData(queryClient, { queryKey: key, queryFn })
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
      await refetchQueries(queryClient)
      observer1.destroy()
      observer2.destroy()
      expect(queryFn).toHaveBeenCalledTimes(2)
    })

    it('should refetch all queries when no arguments are given', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
        initialData: 'initial',
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
        initialData: 'initial',
      })
      observer1.subscribe(() => undefined)
      observer2.subscribe(() => undefined)
      await refetchQueries(queryClient)
      observer1.destroy()
      observer2.destroy()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    it('should be able to refetch all fresh queries', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(queryClient, { type: 'active', stale: false })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should be able to refetch all stale queries', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      invalidateQueries(queryClient, { queryKey: key1 })
      await refetchQueries(queryClient, { stale: true })
      unsubscribe()
      // query, observer mount, invalidation (cancels observer mount) and refetch
      expect(queryFn1).toHaveBeenCalledTimes(4)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should be able to refetch all stale and active queries', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      invalidateQueries(queryClient, { queryKey: key1 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(
        queryClient,
        { type: 'active', stale: true },
        { cancelRefetch: false },
      )
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should be able to refetch all active and inactive queries (queryClient.refetchQueries()', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(queryClient)
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    it('should be able to refetch all active and inactive queries (queryClient.refetchQueries({ type: "all" }))', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(queryClient, { type: 'all' })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    it('should be able to refetch only active queries', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(queryClient, { type: 'active' })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should be able to refetch only inactive queries', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(queryClient, { type: 'inactive' })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    it('should throw an error if throwOnError option is set to true', async () => {
      const key1 = createKey()
      const queryFnError = () => Promise.reject<unknown>('error')
      try {
        await fetchQueryData(queryClient, {
          queryKey: key1,
          queryFn: queryFnError,
          retry: false,
        })
      } catch {}
      let error: any
      try {
        await refetchQueries(
          queryClient,
          { queryKey: key1 },
          { throwOnError: true },
        )
      } catch (err) {
        error = err
      }
      expect(error).toBe('error')
    })

    it('should resolve Promise immediately if query is paused', async () => {
      const key1 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      mockOnlineManagerIsOnline(false)

      await refetchQueries(queryClient, { queryKey: key1 })

      // if we reach this point, the test succeeds because the Promise was resolved immediately
      expect(queryFn1).toHaveBeenCalledTimes(1)
    })

    it('should not leave an unhandled rejection when a paused query is cancelled with throwOnError', async ({
      onTestFinished,
    }) => {
      const unhandledRejectionFn = vi.fn<NodeJS.UnhandledRejectionListener>()
      process.on('unhandledRejection', unhandledRejectionFn)
      onTestFinished(() => {
        process.off('unhandledRejection', unhandledRejectionFn)
      })

      const key1 = createKey()
      await fetchQueryData(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
      })
      mockOnlineManagerIsOnline(false)

      await refetchQueries(
        queryClient,
        { queryKey: key1 },
        { throwOnError: true },
      )
      expect(getQueryState(queryClient, key1)?.fetchStatus).toBe('paused')

      clearQueryClient(queryClient)
      await vi.advanceTimersByTimeAsync(0)

      expect(unhandledRejectionFn).not.toHaveBeenCalled()
    })

    it('should refetch if query we are offline but query networkMode is always', async () => {
      const key1 = createKey()
      setQueryDefaults(queryClient, key1, { networkMode: 'always' })
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      mockOnlineManagerIsOnline(false)

      await refetchQueries(queryClient, { queryKey: key1 })

      // initial fetch + refetch (even though we are offline)
      expect(queryFn1).toHaveBeenCalledTimes(2)
    })

    it('should not refetch static queries', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => string>(() => 'data1')
      await fetchQueryData(queryClient, { queryKey: key, queryFn: queryFn })
      expect(queryFn).toHaveBeenCalledTimes(1)

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 'static',
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await refetchQueries(queryClient)
      expect(queryFn).toHaveBeenCalledTimes(1)

      unsubscribe()
    })
  })

  describe('invalidateQueries', () => {
    it('should refetch active queries by default', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      invalidateQueries(queryClient, { queryKey: key1 })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should not refetch inactive queries by default', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        enabled: false,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      invalidateQueries(queryClient, { queryKey: key1 })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should not refetch active queries when "refetch" is "none"', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      invalidateQueries(queryClient, {
        queryKey: key1,
        refetchType: 'none',
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(1)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should refetch inactive queries when "refetch" is "inactive"', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
        refetchOnMount: false,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      unsubscribe()

      await invalidateQueries(queryClient, {
        queryKey: key1,
        refetchType: 'inactive',
      })
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(1)
    })

    it('should refetch active and inactive queries when "refetch" is "all"', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
      await fetchQueryData(queryClient, { queryKey: key1, queryFn: queryFn1 })
      await fetchQueryData(queryClient, { queryKey: key2, queryFn: queryFn2 })
      const observer = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: queryFn1,
        staleTime: Infinity,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      invalidateQueries(queryClient, {
        refetchType: 'all',
      })
      unsubscribe()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(2)
    })

    it('should not refetch disabled inactive queries even if "refetchType" is "all', async () => {
      const queryFn = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const observer = new QueryObserver(queryClient, {
        queryKey: createKey(),
        queryFn: queryFn,
        staleTime: Infinity,
        enabled: false,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      unsubscribe()
      await invalidateQueries(queryClient, {
        refetchType: 'all',
      })
      expect(queryFn).toHaveBeenCalledTimes(0)
    })

    it('should not refetch inactive queries that have a skipToken queryFn even if "refetchType" is "all', async () => {
      const key = createKey()
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: skipToken,
        staleTime: Infinity,
      })

      setQueryData(queryClient, key, 'data1')

      const unsubscribe = observer.subscribe(() => undefined)
      unsubscribe()
      expect(getQueryState(queryClient, key)?.dataUpdateCount).toBe(1)

      await invalidateQueries(queryClient, {
        refetchType: 'all',
      })
      expect(getQueryState(queryClient, key)?.dataUpdateCount).toBe(1)
    })

    it('should cancel ongoing fetches if cancelRefetch option is set (default value)', async () => {
      const key = createKey()
      const abortFn = vi.fn<(event: Event) => void>()
      let fetchCount = 0
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: ({ signal }) =>
          new Promise((resolve) => {
            fetchCount++
            setTimeout(() => resolve(5), 10)
            signal.addEventListener('abort', abortFn)
          }),
        initialData: 1,
      })
      observer.subscribe(() => undefined)

      refetchQueries(queryClient)
      await vi.advanceTimersByTimeAsync(10)
      observer.destroy()
      expect(abortFn).toHaveBeenCalledTimes(1)
      expect(fetchCount).toBe(2)
    })

    it('should not cancel ongoing fetches if cancelRefetch option is set to false', async () => {
      const key = createKey()
      const abortFn = vi.fn<(event: Event) => void>()
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

      refetchQueries(queryClient, undefined, { cancelRefetch: false })
      await vi.advanceTimersByTimeAsync(10)
      observer.destroy()
      expect(abortFn).toHaveBeenCalledTimes(0)
      expect(fetchCount).toBe(1)
    })

    it('should refetch static queries without data after invalidation', async () => {
      const key = createKey()
      const queryFn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('error'))
        .mockResolvedValue('data')
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 'static',
        retry: false,
      })
      const unsubscribe = observer.subscribe(noop)
      await vi.advanceTimersByTimeAsync(0)
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(getQueryState(queryClient, key)?.status).toBe('error')

      await invalidateQueries(queryClient, { queryKey: key })

      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(getQueryData(queryClient, key)).toBe('data')
      unsubscribe()
    })

    it('should not refetch static queries after invalidation', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => string>(() => 'data1')
      await fetchQueryData(queryClient, { queryKey: key, queryFn: queryFn })
      expect(queryFn).toHaveBeenCalledTimes(1)

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 'static',
      })
      const unsubscribe = observer.subscribe(() => undefined)
      await invalidateQueries(queryClient)
      expect(queryFn).toHaveBeenCalledTimes(1)

      unsubscribe()
    })
  })

  describe('resetQueries', () => {
    it('should refetch active static queries after reset', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => string>(() => 'data')
      await fetchQueryData(queryClient, { queryKey: key, queryFn })

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 'static',
      })
      const unsubscribe = observer.subscribe(noop)
      expect(queryFn).toHaveBeenCalledTimes(1)

      await resetQueries(queryClient, { queryKey: key })

      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(getQueryData(queryClient, key)).toBe('data')
      unsubscribe()
    })

    it('should not refetch static queries when reset restores initial data', async () => {
      const key = createKey()
      const queryFn = vi.fn<() => number>(() => 1)
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        staleTime: 'static',
        initialData: 0,
      })
      const unsubscribe = observer.subscribe(noop)
      setQueryData(queryClient, key, 2)

      await resetQueries(queryClient, { queryKey: key })

      expect(queryFn).not.toHaveBeenCalled()
      expect(getQueryData(queryClient, key)).toBe(0)
      unsubscribe()
    })

    it('should notify listeners when a query is reset', async () => {
      const key = createKey()

      const callback = vi.fn<(event: QueryCacheNotifyEvent) => void>()

      await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
      }).catch(noop)

      queryCache.subscribe(callback)

      resetQueries(queryClient, { queryKey: key })

      const query = findCachedQuery(queryCache, { queryKey: key })
      expect(callback).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: 'updated',
          query,
          action: expect.objectContaining({ type: 'setState' }),
        }),
      )
    })

    it('should reset query', async () => {
      const key = createKey()

      await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
      }).catch(noop)

      let state = getQueryState(queryClient, key)
      expect(state?.data).toBe('data')
      expect(state?.status).toBe('success')

      resetQueries(queryClient, { queryKey: key })

      state = getQueryState(queryClient, key)

      expect(state?.data).toBeUndefined()
      expect(state?.status).toBe('pending')
      expect(state?.fetchStatus).toBe('idle')
    })

    it('should reset query data to initial data if set', async () => {
      const key = createKey()

      await fetchQueryData(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        initialData: 'initial',
      }).catch(noop)

      let state = getQueryState(queryClient, key)
      expect(state?.data).toBe('data')

      resetQueries(queryClient, { queryKey: key })

      state = getQueryState(queryClient, key)

      expect(state?.data).toBe('initial')
    })

    it('should refetch queries matched by a state-dependent predicate', async () => {
      const key = createKey()
      const queryFn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('error'))
        .mockResolvedValue('data')

      await expect(
        fetchQueryData(queryClient, {
          queryKey: key,
          queryFn,
          retry: false,
        }),
      ).rejects.toThrow('error')

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn,
        retry: false,
        retryOnMount: false,
      })
      const unsubscribe = observer.subscribe(() => undefined)

      await resetQueries(queryClient, {
        predicate: (query) => query.state.status === 'error',
      })
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(getQueryData(queryClient, key)).toBe('data')

      unsubscribe()
    })

    it('should refetch all active queries', async () => {
      const key1 = createKey()
      const key2 = createKey()
      const key3 = createKey()
      const queryFn1 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data1')
      const queryFn2 = vi
        .fn<(...args: Array<unknown>) => string>()
        .mockReturnValue('data2')
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
      const observer3 = new QueryObserver(queryClient, {
        queryKey: key3,
        queryFn: skipToken,
      })
      let didSkipTokenRun = false
      observer1.subscribe(() => undefined)
      observer2.subscribe(() => undefined)
      observer3.subscribe(() => (didSkipTokenRun = true))
      await resetQueries(queryClient)
      observer3.destroy()
      observer2.destroy()
      observer1.destroy()
      expect(queryFn1).toHaveBeenCalledTimes(2)
      expect(queryFn2).toHaveBeenCalledTimes(0)
      expect(didSkipTokenRun).toBe(false)
    })
  })

  describe('focusManager and onlineManager', () => {
    afterEach(() => {
      onlineManager.setOnline(true)
      focusManager.setFocused(undefined)
    })

    it('should notify queryCache and mutationCache if focused', async () => {
      const testClient = new QueryClient()
      mountQueryClient(testClient)

      const queryCacheOnFocusSpy = vi.spyOn(
        getQueryCache(testClient),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        getQueryCache(testClient),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
        getMutationCache(testClient),
        'resumePausedMutations',
      )

      focusManager.setFocused(false)
      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(queryCacheOnFocusSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(1)

      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
    })

    it('should notify queryCache and mutationCache if online', async () => {
      const testClient = new QueryClient()
      mountQueryClient(testClient)

      const queryCacheOnFocusSpy = vi.spyOn(
        getQueryCache(testClient),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        getQueryCache(testClient),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
        getMutationCache(testClient),
        'resumePausedMutations',
      )

      onlineManager.setOnline(false)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(queryCacheOnOnlineSpy).toHaveBeenCalledTimes(1)

      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(1)

      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()
    })

    it('should resume paused mutations when coming online', async () => {
      const consoleErrorMock = vi.spyOn(console, 'error')
      consoleErrorMock.mockReturnValue(undefined)
      onlineManager.setOnline(false)

      const observer1 = new MutationObserver(queryClient, {
        mutationFn: () => Promise.resolve(1),
      })

      const observer2 = new MutationObserver(queryClient, {
        mutationFn: () => Promise.resolve(2),
      })
      void observer1.mutate()
      void observer2.mutate()
      expect(observer1.getCurrentResult().isPaused).toBe(true)
      expect(observer2.getCurrentResult().isPaused).toBe(true)

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(observer1.getCurrentResult().status).toBe('success')
      expect(observer2.getCurrentResult().status).toBe('success')
    })

    it('should resume paused mutations in parallel', async () => {
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
      void observer1.mutate()
      void observer2.mutate()
      expect(observer1.getCurrentResult().isPaused).toBe(true)
      expect(observer2.getCurrentResult().isPaused).toBe(true)

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(50)
      expect(observer1.getCurrentResult().status).toBe('success')
      expect(observer2.getCurrentResult().status).toBe('success')

      expect(orders).toStrictEqual(['1start', '2start', '2end', '1end'])
    })

    it('should resume paused mutations one after the other when in the same scope when invoked manually at the same time', async () => {
      const consoleErrorMock = vi.spyOn(console, 'error')
      consoleErrorMock.mockReturnValue(undefined)
      onlineManager.setOnline(false)

      const orders: Array<string> = []

      const observer1 = new MutationObserver(queryClient, {
        scope: serialScope('scope'),
        mutationFn: async () => {
          orders.push('1start')
          await sleep(50)
          orders.push('1end')
          return 1
        },
      })

      const observer2 = new MutationObserver(queryClient, {
        scope: serialScope('scope'),
        mutationFn: async () => {
          orders.push('2start')
          await sleep(20)
          orders.push('2end')
          return 2
        },
      })
      void observer1.mutate()
      void observer2.mutate()
      expect(observer1.getCurrentResult().isPaused).toBe(true)
      expect(observer2.getCurrentResult().isPaused).toBe(true)

      onlineManager.setOnline(true)
      void resumePausedMutations(queryClient)
      await vi.advanceTimersByTimeAsync(70)
      expect(observer1.getCurrentResult().status).toBe('success')
      expect(observer2.getCurrentResult().status).toBe('success')

      expect(orders).toStrictEqual(['1start', '1end', '2start', '2end'])
    })

    it('should resumePausedMutations when coming online after having called resumePausedMutations while offline', async () => {
      const consoleErrorMock = vi.spyOn(console, 'error')
      consoleErrorMock.mockReturnValue(undefined)
      onlineManager.setOnline(false)

      const observer = new MutationObserver(queryClient, {
        mutationFn: () => Promise.resolve(1),
      })

      void observer.mutate()
      expect(observer.getCurrentResult().isPaused).toBe(true)

      await resumePausedMutations(queryClient)

      // still paused because we are still offline
      expect(observer.getCurrentResult().isPaused).toBe(true)

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(observer.getCurrentResult().status).toBe('success')
    })

    it('should resumePausedMutations when coming online after having restored cache (and resumed) while offline', async () => {
      const consoleErrorMock = vi.spyOn(console, 'error')
      consoleErrorMock.mockReturnValue(undefined)
      onlineManager.setOnline(false)

      const observer = new MutationObserver(queryClient, {
        mutationFn: () => Promise.resolve(1),
      })

      void observer.mutate()
      expect(observer.getCurrentResult().isPaused).toBe(true)

      const state = dehydrate(queryClient)

      const newQueryClient = new QueryClient({
        defaultOptions: {
          mutations: {
            mutationFn: () => Promise.resolve(1),
          },
        },
      })

      mountQueryClient(newQueryClient)

      hydrate(newQueryClient, state)

      // still paused because we are still offline
      expect(getMutationCache(newQueryClient).getAll()[0]?.state.isPaused).toBe(
        true,
      )

      await resumePausedMutations(newQueryClient)

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(getMutationCache(newQueryClient).getAll()[0]?.state.status).toBe(
        'success',
      )

      unmountQueryClient(newQueryClient)
    })

    it('should notify queryCache after resumePausedMutations has finished when coming online', async () => {
      const key = createKey()

      let count = 0
      const results: Array<string> = []

      const queryObserver = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: async () => {
          count++
          results.push('data' + count)
          await sleep(10)
          return 'data' + count
        },
      })

      const unsubscribe = queryObserver.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(10)
      expect(getQueryData(queryClient, key)).toBe('data1')

      onlineManager.setOnline(false)

      const observer = new MutationObserver(queryClient, {
        mutationFn: async () => {
          results.push('mutation1-start')
          await sleep(50)
          results.push('mutation1-end')
          return 1
        },
      })

      void observer.mutate()

      const observer2 = new MutationObserver(queryClient, {
        scope: serialScope('scope'),
        mutationFn: async () => {
          results.push('mutation2-start')
          await sleep(50)
          results.push('mutation2-end')
          return 2
        },
      })

      void observer2.mutate()

      const observer3 = new MutationObserver(queryClient, {
        scope: serialScope('scope'),
        mutationFn: async () => {
          results.push('mutation3-start')
          await sleep(50)
          results.push('mutation3-end')
          return 3
        },
      })

      void observer3.mutate()
      expect(observer.getCurrentResult().isPaused).toBe(true)
      expect(observer2.getCurrentResult().isPaused).toBe(true)
      expect(observer3.getCurrentResult().isPaused).toBe(true)

      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(110)
      expect(getQueryData(queryClient, key)).toBe('data2')

      // refetch from coming online should happen after mutations have finished
      expect(results).toStrictEqual([
        'data1',
        'mutation1-start',
        'mutation2-start',
        'mutation1-end',
        'mutation2-end',
        'mutation3-start', // 3 starts after 2 because they are in the same scope
        'mutation3-end',
        'data2',
      ])

      unsubscribe()
    })

    it('should notify queryCache and mutationCache after multiple mounts and single unmount', async () => {
      const testClient = new QueryClient()
      mountQueryClient(testClient)
      mountQueryClient(testClient)
      unmountQueryClient(testClient)

      const queryCacheOnFocusSpy = vi.spyOn(
        getQueryCache(testClient),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        getQueryCache(testClient),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
        getMutationCache(testClient),
        'resumePausedMutations',
      )

      onlineManager.setOnline(false)
      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(queryCacheOnOnlineSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(1)

      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(0)
      expect(queryCacheOnFocusSpy).toHaveBeenCalledTimes(1)
      expect(mutationCacheResumePausedMutationsSpy).toHaveBeenCalledTimes(2)

      focusManager.setFocused(undefined)
      onlineManager.setOnline(true)
    })

    it('should not notify queryCache and mutationCache after multiple mounts/unmounts', () => {
      const testClient = new QueryClient()
      mountQueryClient(testClient)
      mountQueryClient(testClient)
      unmountQueryClient(testClient)
      unmountQueryClient(testClient)

      const queryCacheOnFocusSpy = vi.spyOn(
        getQueryCache(testClient),
        'onFocus',
      )
      const queryCacheOnOnlineSpy = vi.spyOn(
        getQueryCache(testClient),
        'onOnline',
      )
      const mutationCacheResumePausedMutationsSpy = vi.spyOn(
        getMutationCache(testClient),
        'resumePausedMutations',
      )

      onlineManager.setOnline(true)
      expect(queryCacheOnOnlineSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      focusManager.setFocused(true)
      expect(queryCacheOnFocusSpy).not.toHaveBeenCalled()
      expect(mutationCacheResumePausedMutationsSpy).not.toHaveBeenCalled()

      focusManager.setFocused(undefined)
      onlineManager.setOnline(true)
    })
  })

  describe('setMutationDefaults', () => {
    it('should update existing mutation defaults', () => {
      const key = createKey()
      const mutationOptions1 = { mutationFn: () => Promise.resolve('data') }
      const mutationOptions2 = { retry: false }
      setMutationDefaults(queryClient, key, mutationOptions1)
      setMutationDefaults(queryClient, key, mutationOptions2)

      expect(getMutationDefaults(queryClient, key)).toMatchObject(
        mutationOptions2,
      )
    })

    it('should return only matching defaults when multiple mutation defaults are set', () => {
      const key1 = createKey()
      const key2 = createKey()
      const mutationOptions1 = { retry: 1 }
      const mutationOptions2 = { retry: 2 }
      setMutationDefaults(queryClient, key1, mutationOptions1)
      setMutationDefaults(queryClient, key2, mutationOptions2)

      expect(getMutationDefaults(queryClient, key1)).toMatchObject(
        mutationOptions1,
      )
      expect(getMutationDefaults(queryClient, key2)).toMatchObject(
        mutationOptions2,
      )
    })

    it('should use the MutationCache equality function when matching defaults', () => {
      const equalityFn = (a: unknown, b: unknown) =>
        typeof a === 'string' && typeof b === 'string'
          ? a.toLowerCase() === b.toLowerCase()
          : a === b
      const testClient = new QueryClient({
        mutationCache: new MutationCache({ mutationKey: { equalityFn } }),
      })

      setMutationDefaults(testClient, ['todos', { status: 'done' }], {
        retry: false,
      })

      expect(
        getMutationDefaults(testClient, ['TODOS', { status: 'DONE' }]),
      ).toMatchObject({ retry: false })

      clearQueryClient(testClient)
    })
  })
})
