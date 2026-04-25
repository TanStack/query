import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import { QueryCache } from '../queryCache'
import { dehydrate, hydrate } from '../hydration'
import { MutationCache } from '../mutationCache'
import { executeMutation, mockOnlineManagerIsOnline } from './utils'

describe('dehydration and rehydration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should work with serializable values', async () => {
    const stringKey = queryKey()
    const numberKey = queryKey()
    const booleanKey = queryKey()
    const nullKey = queryKey()
    const arrayKey = queryKey()
    const nestedKey = queryKey()

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: stringKey,
      queryFn: () => sleep(0).then(() => 'string'),
    })
    queryClient.prefetchQuery({
      queryKey: numberKey,
      queryFn: () => sleep(0).then(() => 1),
    })
    queryClient.prefetchQuery({
      queryKey: booleanKey,
      queryFn: () => sleep(0).then(() => true),
    })
    queryClient.prefetchQuery({
      queryKey: nullKey,
      queryFn: () => sleep(0).then(() => null),
    })
    queryClient.prefetchQuery({
      queryKey: arrayKey,
      queryFn: () => sleep(0).then(() => ['string', 0]),
    })
    queryClient.prefetchQuery({
      queryKey: nestedKey,
      queryFn: () => sleep(0).then(() => ({ key: [{ nestedKey: 1 }] })),
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({
      queryCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: stringKey })?.state.data).toBe(
      'string',
    )
    expect(hydrationCache.find({ queryKey: numberKey })?.state.data).toBe(1)
    expect(hydrationCache.find({ queryKey: booleanKey })?.state.data).toBe(true)
    expect(hydrationCache.find({ queryKey: nullKey })?.state.data).toBe(null)
    expect(hydrationCache.find({ queryKey: arrayKey })?.state.data).toEqual([
      'string',
      0,
    ])
    expect(hydrationCache.find({ queryKey: nestedKey })?.state.data).toEqual({
      key: [{ nestedKey: 1 }],
    })

    const fetchDataAfterHydration =
      vi.fn<(...args: Array<unknown>) => unknown>()
    await hydrationClient.prefetchQuery({
      queryKey: stringKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: numberKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: booleanKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: nullKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: arrayKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: nestedKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should not dehydrate queries if dehydrateQueries is set to false', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'string'),
    })
    await vi.advanceTimersByTimeAsync(0)

    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: () => false,
    })

    expect(dehydrated.queries.length).toBe(0)

    queryClient.clear()
  })

  it('should use the garbage collection time from the client', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'string'),
      gcTime: 50,
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    await vi.advanceTimersByTimeAsync(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: key })?.state.data).toBe('string')
    await vi.advanceTimersByTimeAsync(100)
    expect(hydrationCache.find({ queryKey: key })).toBeTruthy()

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should be able to provide default options for the hydrated queries', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'string'),
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed, {
      defaultOptions: { queries: { retry: 10 } },
    })
    expect(hydrationCache.find({ queryKey: key })?.options.retry).toBe(10)
    queryClient.clear()
    hydrationClient.clear()
  })

  it('should respect query defaultOptions specified on the QueryClient', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })
    queryClient.prefetchQuery({
      queryKey: key,
      retry: 0,
      queryFn: () => Promise.reject(new Error('error')),
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient)
    expect(dehydrated.queries.length).toBe(1)
    expect(dehydrated.queries[0]?.state.error).toStrictEqual(new Error('error'))
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({
      queryCache: hydrationCache,
      defaultOptions: { hydrate: { queries: { retry: 10 } } },
    })
    hydrate(hydrationClient, parsed, {
      defaultOptions: { queries: { gcTime: 10 } },
    })
    expect(hydrationCache.find({ queryKey: key })?.options.retry).toBe(10)
    expect(hydrationCache.find({ queryKey: key })?.options.gcTime).toBe(10)
    queryClient.clear()
    hydrationClient.clear()
  })

  it('should respect mutation defaultOptions specified on the QueryClient', async () => {
    const key = queryKey()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({
      mutationCache,
      defaultOptions: {
        dehydrate: {
          shouldDehydrateMutation: (mutation) => mutation.state.data === 'done',
        },
      },
    })
    await executeMutation(
      queryClient,
      {
        mutationKey: key,
        mutationFn: () => Promise.resolve('done'),
      },
      undefined,
    )

    const dehydrated = dehydrate(queryClient)
    expect(dehydrated.mutations.length).toBe(1)
    expect(dehydrated.mutations[0]?.state.data).toBe('done')
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new MutationCache()
    const hydrationClient = new QueryClient({
      mutationCache: hydrationCache,
      defaultOptions: { hydrate: { mutations: { retry: 10 } } },
    })
    hydrate(hydrationClient, parsed, {
      defaultOptions: { mutations: { gcTime: 10 } },
    })
    expect(hydrationCache.find({ mutationKey: key })?.options.retry).toBe(10)
    expect(hydrationCache.find({ mutationKey: key })?.options.gcTime).toBe(10)
    queryClient.clear()
    hydrationClient.clear()
  })

  it('should work with complex keys', async () => {
    const key = queryKey()
    const complexKey = [...key, { key: ['string'], key2: 0 }]
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: complexKey,
      queryFn: () => sleep(0).then(() => 'string'),
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({
        queryKey: complexKey,
      })?.state.data,
    ).toBe('string')

    const fetchDataAfterHydration =
      vi.fn<(...args: Array<unknown>) => unknown>()
    await hydrationClient.prefetchQuery({
      queryKey: complexKey,
      queryFn: fetchDataAfterHydration,
      staleTime: 100,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should only hydrate successful queries by default', async () => {
    const successKey = queryKey()
    const loadingKey = queryKey()
    const errorKey = queryKey()

    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: successKey,
      queryFn: () => sleep(0).then(() => 'success'),
    })
    await vi.advanceTimersByTimeAsync(0)
    queryClient.prefetchQuery({
      queryKey: loadingKey,
      queryFn: () => sleep(10000).then(() => 'loading'),
    })
    queryClient.prefetchQuery({
      queryKey: errorKey,
      queryFn: () => {
        throw new Error()
      },
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)

    expect(hydrationCache.find({ queryKey: successKey })).toBeTruthy()
    expect(hydrationCache.find({ queryKey: loadingKey })).toBeFalsy()
    expect(hydrationCache.find({ queryKey: errorKey })).toBeFalsy()

    queryClient.clear()
    hydrationClient.clear()
    consoleMock.mockRestore()
  })

  it('should filter queries via dehydrateQuery', async () => {
    const stringKey = queryKey()
    const numberKey = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: stringKey,
      queryFn: () => sleep(0).then(() => 'string'),
    })
    queryClient.prefetchQuery({
      queryKey: numberKey,
      queryFn: () => sleep(0).then(() => 1),
    })
    await vi.advanceTimersByTimeAsync(0)
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => query.queryKey !== stringKey,
    })

    // This is testing implementation details that can change and are not
    // part of the public API, but is important for keeping the payload small
    const dehydratedQuery = dehydrated.queries.find(
      (query) => query.queryKey === stringKey,
    )
    expect(dehydratedQuery).toBeUndefined()

    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: stringKey })).toBeUndefined()
    expect(hydrationCache.find({ queryKey: numberKey })?.state.data).toBe(1)

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should not overwrite query in cache if hydrated query is older', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    const promise1 = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'string-older'),
    })
    await vi.advanceTimersByTimeAsync(5)
    await promise1
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    const promise2 = hydrationClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'string-newer'),
    })
    await vi.advanceTimersByTimeAsync(5)
    await promise2

    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: key })?.state.data).toBe(
      'string-newer',
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should overwrite query in cache if hydrated query is newer', async () => {
    const key = queryKey()
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    const promise1 = hydrationClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'string-older'),
    })
    await vi.advanceTimersByTimeAsync(5)
    await promise1

    // ---

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    const promise2 = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => 'string-newer'),
    })
    await vi.advanceTimersByTimeAsync(5)
    await promise2
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: key })?.state.data).toBe(
      'string-newer',
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should be able to dehydrate mutations and continue on hydration', async () => {
    const key = queryKey()
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const onlineMock = mockOnlineManagerIsOnline(false)

    const serverAddTodo = vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('offline')))
    const serverOnMutate = vi
      .fn()
      .mockImplementation((variables: { text: string }) => {
        const optimisticTodo = { id: 1, text: variables.text }
        return { optimisticTodo }
      })
    const serverOnSuccess = vi.fn()

    const serverClient = new QueryClient()

    serverClient.setMutationDefaults(key, {
      mutationFn: serverAddTodo,
      onMutate: serverOnMutate,
      onSuccess: serverOnSuccess,
      retry: 3,
      retryDelay: 10,
    })

    executeMutation(
      serverClient,
      {
        mutationKey: key,
      },
      { text: 'text' },
    ).catch(() => undefined)

    await vi.advanceTimersByTimeAsync(50)

    const dehydrated = dehydrate(serverClient)
    const stringified = JSON.stringify(dehydrated)

    serverClient.clear()

    // ---

    onlineMock.mockReturnValue(true)

    const parsed = JSON.parse(stringified)
    const client = new QueryClient()

    const clientAddTodo = vi
      .fn()
      .mockImplementation((variables: { text: string }) => {
        return { id: 2, text: variables.text }
      })
    const clientOnMutate = vi
      .fn()
      .mockImplementation((variables: { text: string }) => {
        const optimisticTodo = { id: 1, text: variables.text }
        return { optimisticTodo }
      })
    const clientOnSuccess = vi.fn()

    client.setMutationDefaults(key, {
      mutationFn: clientAddTodo,
      onMutate: clientOnMutate,
      onSuccess: clientOnSuccess,
      retry: 3,
      retryDelay: 10,
    })

    hydrate(client, parsed)

    await client.resumePausedMutations()

    expect(clientAddTodo).toHaveBeenCalledTimes(1)
    expect(clientOnMutate).not.toHaveBeenCalled()
    expect(clientOnSuccess).toHaveBeenCalledTimes(1)
    expect(clientOnSuccess).toHaveBeenCalledWith(
      { id: 2, text: 'text' },
      { text: 'text' },
      { optimisticTodo: { id: 1, text: 'text' } },
      { client: client, meta: undefined, mutationKey: key },
    )

    client.clear()
    consoleMock.mockRestore()
    onlineMock.mockRestore()
  })

  it('should not dehydrate mutations if dehydrateMutations is set to false', async () => {
    const key = queryKey()
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const serverAddTodo = vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('offline')))

    const queryClient = new QueryClient()

    queryClient.setMutationDefaults(key, {
      mutationFn: serverAddTodo,
      retry: false,
    })

    executeMutation(
      queryClient,
      {
        mutationKey: key,
      },
      { text: 'text' },
    ).catch(() => undefined)

    await vi.advanceTimersByTimeAsync(1)
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateMutation: () => false,
    })

    expect(dehydrated.mutations.length).toBe(0)

    queryClient.clear()
    consoleMock.mockRestore()
  })

  it('should not dehydrate mutation if mutation state is set to pause', async () => {
    const key = queryKey()
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const serverAddTodo = vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('offline')))

    const queryClient = new QueryClient()

    queryClient.setMutationDefaults(key, {
      mutationFn: serverAddTodo,
      retry: 1,
      retryDelay: 20,
    })

    executeMutation(
      queryClient,
      {
        mutationKey: key,
      },
      { text: 'text' },
    ).catch(() => undefined)

    // Dehydrate mutation between retries
    await vi.advanceTimersByTimeAsync(1)
    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.mutations.length).toBe(0)

    await vi.advanceTimersByTimeAsync(30)
    queryClient.clear()
    consoleMock.mockRestore()
  })

  it('should not hydrate if the hydratedState is null or is not an object', () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    expect(() => hydrate(queryClient, null)).not.toThrow()
    expect(() => hydrate(queryClient, 'invalid')).not.toThrow()

    queryClient.clear()
  })

  it('should support hydratedState with undefined queries and mutations', () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    expect(() => hydrate(queryClient, {})).not.toThrow()
    expect(() => hydrate(queryClient, {})).not.toThrow()

    queryClient.clear()
  })

  it('should set the fetchStatus to idle when creating a query with dehydrate', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    let isInitialFetch = true
    let resolvePromise: (value: unknown) => void = () => undefined

    const customFetchData = () => {
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      // Resolve the promise in initial fetch
      // because we are awaiting the query first time
      if (isInitialFetch) {
        resolvePromise('string')
      }
      isInitialFetch = false
      return promise
    }

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => customFetchData(),
    })

    queryClient.refetchQueries({ queryKey: key })

    const dehydrated = dehydrate(queryClient)
    resolvePromise('string')
    expect(
      dehydrated.queries.find((q) => q.queryHash === JSON.stringify(key))?.state
        .fetchStatus,
    ).toBe('fetching')
    const stringified = JSON.stringify(dehydrated)

    // ---
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: key })?.state.fetchStatus).toBe(
      'idle',
    )
  })

  it('should dehydrate and hydrate meta for queries', async () => {
    const metaKey = queryKey()
    const noMetaKey = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    queryClient.prefetchQuery({
      queryKey: metaKey,
      queryFn: () => Promise.resolve('meta'),
      meta: {
        some: 'meta',
      },
    })
    queryClient.prefetchQuery({
      queryKey: noMetaKey,
      queryFn: () => Promise.resolve('no-meta'),
    })
    await vi.advanceTimersByTimeAsync(0)

    const dehydrated = dehydrate(queryClient)

    expect(
      dehydrated.queries.find((q) => q.queryHash === JSON.stringify(metaKey))
        ?.meta,
    ).toEqual({
      some: 'meta',
    })

    expect(
      dehydrated.queries.find((q) => q.queryHash === JSON.stringify(noMetaKey))
        ?.meta,
    ).toEqual(undefined)

    expect(
      Object.keys(
        dehydrated.queries.find(
          (q) => q.queryHash === JSON.stringify(noMetaKey),
        )!,
      ),
    ).not.toEqual(expect.arrayContaining(['meta']))

    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({
      queryCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: metaKey })?.meta).toEqual({
      some: 'meta',
    })
    expect(hydrationCache.find({ queryKey: noMetaKey })?.meta).toEqual(
      undefined,
    )
  })

  it('should dehydrate and hydrate meta for mutations', async () => {
    const metaKey = queryKey()
    const noMetaKey = queryKey()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ mutationCache })

    await executeMutation(
      queryClient,
      {
        mutationKey: metaKey,
        mutationFn: () => Promise.resolve('meta'),
        meta: {
          some: 'meta',
        },
      },
      undefined,
    )

    await executeMutation(
      queryClient,
      {
        mutationKey: noMetaKey,
        mutationFn: () => Promise.resolve('no-meta'),
      },
      undefined,
    )

    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateMutation: () => true,
    })

    expect(Object.keys(dehydrated.mutations[0]!)).toEqual(
      expect.arrayContaining(['meta']),
    )
    expect(dehydrated.mutations[0]?.meta).toEqual({
      some: 'meta',
    })

    expect(Object.keys(dehydrated.mutations[1]!)).not.toEqual(
      expect.arrayContaining(['meta']),
    )
    expect(dehydrated.mutations[1]?.meta).toEqual(undefined)

    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new MutationCache()
    const hydrationClient = new QueryClient({
      mutationCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ mutationKey: metaKey })?.meta).toEqual({
      some: 'meta',
    })
    expect(hydrationCache.find({ mutationKey: noMetaKey })?.meta).toEqual(
      undefined,
    )
  })

  it('should not change fetchStatus when updating a query with dehydrate', async () => {
    const key = queryKey()
    const queryClient = new QueryClient()

    const options = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'string'),
    } as const

    const prefetchPromise = queryClient.prefetchQuery(options)
    await vi.advanceTimersByTimeAsync(10)
    await prefetchPromise

    const dehydrated = dehydrate(queryClient)
    expect(
      dehydrated.queries.find((q) => q.queryHash === JSON.stringify(key))?.state
        .fetchStatus,
    ).toBe('idle')
    const stringified = JSON.stringify(dehydrated)

    // ---
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })

    const promise = hydrationClient.prefetchQuery(options)
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: key })?.state.fetchStatus).toBe(
      'fetching',
    )
    await vi.advanceTimersByTimeAsync(10)
    await promise
    expect(hydrationCache.find({ queryKey: key })?.state.fetchStatus).toBe(
      'idle',
    )
  })

  it('should dehydrate and hydrate mutation scopes', () => {
    const key = queryKey()
    const queryClient = new QueryClient()
    const onlineMock = mockOnlineManagerIsOnline(false)

    void executeMutation(
      queryClient,
      {
        mutationKey: key,
        mutationFn: () => {
          return Promise.resolve('mutation')
        },
        scope: {
          id: 'scope',
        },
      },
      'vars',
    )

    const dehydrated = dehydrate(queryClient)
    expect(dehydrated.mutations[0]?.scope?.id).toBe('scope')
    const stringified = JSON.stringify(dehydrated)

    // ---
    const parsed = JSON.parse(stringified)
    const hydrationCache = new MutationCache()
    const hydrationClient = new QueryClient({ mutationCache: hydrationCache })

    hydrate(hydrationClient, parsed)

    expect(dehydrated.mutations[0]?.scope?.id).toBe('scope')

    onlineMock.mockRestore()
  })

  it('should dehydrate promises for pending queries', async () => {
    const successKey = queryKey()
    const pendingKey = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: { dehydrate: { shouldDehydrateQuery: () => true } },
    })
    queryClient.prefetchQuery({
      queryKey: successKey,
      queryFn: () => sleep(0).then(() => 'success'),
    })
    await vi.advanceTimersByTimeAsync(0)

    const promise = queryClient.prefetchQuery({
      queryKey: pendingKey,
      queryFn: () => sleep(10).then(() => 'pending'),
    })
    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.queries[0]?.promise).toBeUndefined()
    expect(dehydrated.queries[1]?.promise).toBeInstanceOf(Promise)

    await vi.advanceTimersByTimeAsync(10)
    await promise
    queryClient.clear()
  })

  it('should hydrate promises even without observers', async () => {
    const successKey = queryKey()
    const pendingKey = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: { dehydrate: { shouldDehydrateQuery: () => true } },
    })
    queryClient.prefetchQuery({
      queryKey: successKey,
      queryFn: () => sleep(0).then(() => 'success'),
    })
    await vi.advanceTimersByTimeAsync(0)

    void queryClient.prefetchQuery({
      queryKey: pendingKey,
      queryFn: () => sleep(20).then(() => 'pending'),
    })
    const dehydrated = dehydrate(queryClient)
    // no stringify/parse here because promises can't be serialized to json
    // but nextJs still can do it

    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({
      queryCache: hydrationCache,
    })

    hydrate(hydrationClient, dehydrated)

    expect(hydrationCache.find({ queryKey: successKey })?.state.data).toBe(
      'success',
    )

    expect(hydrationCache.find({ queryKey: pendingKey })?.state).toMatchObject({
      data: undefined,
      dataUpdateCount: 0,
      dataUpdatedAt: 0,
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchMeta: null,
      fetchStatus: 'fetching',
      isInvalidated: false,
      status: 'pending',
    })

    await vi.advanceTimersByTimeAsync(20)

    expect(hydrationCache.find({ queryKey: pendingKey })?.state).toMatchObject({
      data: 'pending',
      dataUpdateCount: 1,
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchMeta: null,
      fetchStatus: 'idle',
      isInvalidated: false,
      status: 'success',
    })
  })

  it('should transform promise result', async () => {
    const key = queryKey()
    const queryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: (data) => data.toISOString(),
        },
      },
    })

    const promise = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(20).then(() => new Date('2024-01-01T00:00:00.000Z')),
    })
    const dehydrated = dehydrate(queryClient)
    expect(dehydrated.queries[0]?.promise).toBeInstanceOf(Promise)

    const hydrationClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: (data) => new Date(data),
        },
      },
    })

    hydrate(hydrationClient, dehydrated)
    await vi.advanceTimersByTimeAsync(20)
    await promise

    expect(hydrationClient.getQueryData(key)).toBeInstanceOf(Date)

    queryClient.clear()
  })

  it('should transform query data if promise is already resolved', async () => {
    const key = queryKey()
    const queryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: (data) => data.toISOString(),
        },
      },
    })

    const promise = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => new Date('2024-01-01T00:00:00.000Z')),
    })
    await vi.advanceTimersByTimeAsync(20)
    const dehydrated = dehydrate(queryClient)

    const hydrationClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: (data) => new Date(data),
        },
      },
    })

    hydrate(hydrationClient, dehydrated)
    await promise

    expect(hydrationClient.getQueryData(key)).toBeInstanceOf(Date)

    queryClient.clear()
  })

  it('should overwrite query in cache if hydrated query is newer (with transformation)', async () => {
    const key = queryKey()
    const hydrationClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: (data) => new Date(data),
        },
      },
    })
    const hydrationPromise = hydrationClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(5).then(() => new Date('2024-01-01T00:00:00.000Z')),
    })
    await vi.advanceTimersByTimeAsync(5)
    await hydrationPromise

    // ---

    const queryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: (data) => data.toISOString(),
        },
      },
    })
    const queryPromise = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => new Date('2024-01-02T00:00:00.000Z')),
    })
    await vi.advanceTimersByTimeAsync(10)
    await queryPromise
    const dehydrated = dehydrate(queryClient)

    // ---

    hydrate(hydrationClient, dehydrated)

    expect(hydrationClient.getQueryData(key)).toStrictEqual(
      new Date('2024-01-02T00:00:00.000Z'),
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  it('should overwrite query in cache if hydrated query is newer (with promise)', async () => {
    const key = queryKey()
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })

    const promise = serverQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'server data'),
    })

    const dehydrated = dehydrate(serverQueryClient)

    // --- client ---

    const clientQueryClient = new QueryClient()

    clientQueryClient.setQueryData(key, 'old data', { updatedAt: 10 })

    hydrate(clientQueryClient, dehydrated)

    await vi.advanceTimersByTimeAsync(10)
    await promise

    expect(clientQueryClient.getQueryData(key)).toBe('server data')

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  it('should not overwrite query in cache if existing query is newer (with promise)', async () => {
    const key = queryKey()
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })

    const promise = serverQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'server data'),
    })

    const dehydrated = dehydrate(serverQueryClient)

    await vi.advanceTimersByTimeAsync(10)
    await promise

    // Pretend the output of this server part is cached for a long time

    // --- client ---

    await vi.advanceTimersByTimeAsync(10_000) // Arbitrary time in the future

    const clientQueryClient = new QueryClient()

    clientQueryClient.setQueryData(key, 'newer data', {
      updatedAt: Date.now(),
    })

    hydrate(clientQueryClient, dehydrated)

    // If the query was hydrated in error, it would still take some time for it
    // to end up in the cache, so for the test to fail properly on regressions,
    // wait for the fetchStatus to be idle
    await vi.advanceTimersByTimeAsync(0)

    expect(clientQueryClient.getQueryState(key)?.fetchStatus).toBe('idle')
    expect(clientQueryClient.getQueryData(key)).toBe('newer data')

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  it('should overwrite data when a new promise is streamed in', async () => {
    const key = queryKey()
    const serializeDataMock = vi.fn((data: any) => data)
    const deserializeDataMock = vi.fn((data: any) => data)

    const countRef = { current: 0 }
    // --- server ---
    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: serializeDataMock,
        },
      },
    })

    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => countRef.current),
    }

    const promise = serverQueryClient.prefetchQuery(query)

    let dehydrated = dehydrate(serverQueryClient)

    // --- client ---

    const clientQueryClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: deserializeDataMock,
        },
      },
    })

    hydrate(clientQueryClient, dehydrated)

    await vi.advanceTimersByTimeAsync(10)
    await promise

    expect(clientQueryClient.getQueryData(query.queryKey)).toBe(0)

    expect(serializeDataMock).toHaveBeenCalledTimes(1)
    expect(serializeDataMock).toHaveBeenCalledWith(0)

    expect(deserializeDataMock).toHaveBeenCalledTimes(1)
    expect(deserializeDataMock).toHaveBeenCalledWith(0)

    // --- server ---
    countRef.current++
    await vi.advanceTimersByTimeAsync(1)
    serverQueryClient.clear()
    const promise2 = serverQueryClient.prefetchQuery(query)

    dehydrated = dehydrate(serverQueryClient)

    // --- client ---

    hydrate(clientQueryClient, dehydrated)

    await vi.advanceTimersByTimeAsync(10)
    await promise2

    expect(clientQueryClient.getQueryData(query.queryKey)).toBe(1)

    expect(serializeDataMock).toHaveBeenCalledTimes(2)
    expect(serializeDataMock).toHaveBeenCalledWith(1)

    expect(deserializeDataMock).toHaveBeenCalledTimes(2)
    expect(deserializeDataMock).toHaveBeenCalledWith(1)

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  it('should not redact errors when shouldRedactErrors returns false', async () => {
    const key = queryKey()
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          shouldRedactErrors: () => false,
        },
      },
    })

    const testError = new Error('original error')

    const promise = queryClient
      .prefetchQuery({
        queryKey: key,
        queryFn: () => Promise.reject(testError),
        retry: false,
      })
      .catch(() => undefined)

    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.queries[0]?.promise).toBeInstanceOf(Promise)
    await expect(dehydrated.queries[0]?.promise).rejects.toBe(testError)
    await promise
  })

  it('should handle errors in promises for pending queries', async () => {
    const key = queryKey()
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })

    const promise = queryClient
      .prefetchQuery({
        queryKey: key,
        queryFn: () => Promise.reject(new Error('test error')),
        retry: false,
      })
      .catch(() => undefined)

    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.queries[0]?.promise).toBeInstanceOf(Promise)

    await expect(dehydrated.queries[0]?.promise).rejects.toThrow('redacted')
    await promise
    consoleMock.mockRestore()
  })

  it('should log error in development environment when redacting errors', async () => {
    const key = queryKey()
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          shouldRedactErrors: () => true,
        },
      },
    })

    const testError = new Error('test error')

    const promise = queryClient
      .prefetchQuery({
        queryKey: key,
        queryFn: () => Promise.reject(testError),
        retry: false,
      })
      .catch(() => undefined)

    const dehydrated = dehydrate(queryClient)

    await expect(dehydrated.queries[0]?.promise).rejects.toThrow('redacted')
    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringContaining('test error'),
    )
    await promise

    process.env.NODE_ENV = originalNodeEnv
    consoleMock.mockRestore()
  })

  // When React hydrates promises across RSC/client boundaries, it passes
  // them as special ReactPromise types. There are situations where the
  // promise might have time to resolve before we end up hydrating it, in
  // which case React will have made it a special synchronous thenable where
  // .then() resolves immediately.
  // In these cases it's important we hydrate the data synchronously, or else
  // the data in the cache wont match the content that was rendered on the server.
  // What can end up happening otherwise is that the content is visible from the
  // server, but the client renders a Suspense fallback, only to immediately show
  // the data again.
  it('should rehydrate synchronous thenable immediately', async () => {
    const key = queryKey()
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })
    const originalPromise = serverQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => null,
    })

    const dehydrated = dehydrate(serverQueryClient)

    // --- server end ---

    // Simulate a synchronous thenable
    // @ts-expect-error
    dehydrated.queries[0].promise.then = (cb) => {
      cb?.('server data')
    }

    // --- client ---

    const clientQueryClient = new QueryClient()
    hydrate(clientQueryClient, dehydrated)

    // If data is already resolved, it should end up in the cache immediately
    expect(clientQueryClient.getQueryData(key)).toBe('server data')

    // Need to await the original promise or else it will get a cancellation
    // error and test will fail
    await originalPromise
  })

  test('should preserve queryType for infinite queries during hydration', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    await vi.waitFor(() =>
      queryClient.prefetchInfiniteQuery({
        queryKey: ['infinite'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            items: [`page-${pageParam}`],
            nextCursor: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: {
          items: Array<string>
          nextCursor: number
        }) => lastPage.nextCursor,
      }),
    )

    const dehydrated = dehydrate(queryClient)

    const infiniteQueryState = dehydrated.queries.find(
      (q) => q.queryKey[0] === 'infinite',
    )
    expect(infiniteQueryState?.queryType).toBe('infinite')

    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, dehydrated)

    const hydratedQuery = hydrationCache.find({ queryKey: ['infinite'] })
    expect(hydratedQuery?.state.data).toBeDefined()
    expect(hydratedQuery?.state.data).toHaveProperty('pages')
    expect(hydratedQuery?.state.data).toHaveProperty('pageParams')
    expect((hydratedQuery?.state.data as any).pages).toHaveLength(1)
  })

  test('should attach infiniteQueryBehavior during hydration', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    await vi.waitFor(() =>
      queryClient.prefetchInfiniteQuery({
        queryKey: ['infinite-with-behavior'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            data: `page-${pageParam}`,
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: { data: string; next: number }) =>
          lastPage.next,
      }),
    )

    const dehydrated = dehydrate(queryClient)

    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, dehydrated)

    const result = await vi.waitFor(() =>
      hydrationClient.fetchInfiniteQuery({
        queryKey: ['infinite-with-behavior'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            data: `page-${pageParam}`,
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: { data: string; next: number }) =>
          lastPage.next,
      }),
    )

    expect(result.pages).toHaveLength(1)
    expect(result.pageParams).toHaveLength(1)
  })

  test('should restore infinite query type through dehydrate and hydrate cycle', async () => {
    const serverClient = new QueryClient({ queryCache: new QueryCache() })

    await vi.waitFor(() =>
      serverClient.prefetchInfiniteQuery({
        queryKey: ['infinite-type-restore'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            items: [`item-${pageParam}`],
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: { items: Array<string>; next: number }) =>
          lastPage.next,
      }),
    )

    const dehydrated = dehydrate(serverClient)

    const dehydratedQuery = dehydrated.queries.find(
      (q) => q.queryKey[0] === 'infinite-type-restore',
    )
    expect(dehydratedQuery?.queryType).toBe('infinite')

    const clientCache = new QueryCache()
    const clientClient = new QueryClient({ queryCache: clientCache })
    hydrate(clientClient, dehydrated)

    const hydratedQuery = clientCache.find({
      queryKey: ['infinite-type-restore'],
    })
    expect(hydratedQuery?.queryType).toBe('infinite')
  })

  test('should preserve pages structure when refetching infinite query after hydration', async () => {
    const serverClient = new QueryClient({ queryCache: new QueryCache() })

    await vi.waitFor(() =>
      serverClient.prefetchInfiniteQuery({
        queryKey: ['refetch'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            items: [`page-${pageParam}`],
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: { items: Array<string>; next: number }) =>
          lastPage.next,
      }),
    )

    const dehydrated = dehydrate(serverClient)

    const clientCache = new QueryCache()
    const clientClient = new QueryClient({ queryCache: clientCache })
    hydrate(clientClient, dehydrated)

    const beforeRefetch = clientClient.getQueryData<{
      pages: Array<{ items: Array<string>; next: number }>
      pageParams: Array<unknown>
    }>(['refetch'])
    expect(beforeRefetch?.pages).toHaveLength(1)
    expect(beforeRefetch?.pageParams).toHaveLength(1)

    const result = await vi.waitFor(() =>
      clientClient.fetchInfiniteQuery({
        queryKey: ['refetch'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            items: [`page-${pageParam}`],
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: { items: Array<string>; next: number }) =>
          lastPage.next,
      }),
    )

    expect(result).toHaveProperty('pages')
    expect(result).toHaveProperty('pageParams')
    expect(Array.isArray(result.pages)).toBe(true)
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0]).toHaveProperty('items')
  })

  test('should retain infinite query type after subsequent setOptions calls', async () => {
    const serverClient = new QueryClient({ queryCache: new QueryCache() })

    await vi.waitFor(() =>
      serverClient.prefetchInfiniteQuery({
        queryKey: ['infinite-setoptions-guard'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            data: `p${pageParam}`,
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        getNextPageParam: (lastPage: { data: string; next: number }) =>
          lastPage.next,
      }),
    )

    const dehydrated = dehydrate(serverClient)

    const clientCache = new QueryCache()
    const clientClient = new QueryClient({ queryCache: clientCache })
    hydrate(clientClient, dehydrated)

    const query = clientCache.find({ queryKey: ['infinite-setoptions-guard'] })!
    expect(query.queryType).toBe('infinite')

    query.setOptions({ queryKey: ['infinite-setoptions-guard'] })
    expect(query.queryType).toBe('infinite')
  })

  test('should restore all pages when refetching multi-page infinite query after hydration', async () => {
    const serverClient = new QueryClient({ queryCache: new QueryCache() })

    await vi.waitFor(() =>
      serverClient.prefetchInfiniteQuery({
        queryKey: ['infinite-multipage-restore'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            items: [`item-${pageParam}`],
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        pages: 2,
        getNextPageParam: (lastPage: { items: Array<string>; next: number }) =>
          lastPage.next,
      }),
    )

    const dehydrated = dehydrate(serverClient)

    const clientCache = new QueryCache()
    const clientClient = new QueryClient({ queryCache: clientCache })
    hydrate(clientClient, dehydrated)

    const beforeRefetch = clientClient.getQueryData<{
      pages: Array<unknown>
      pageParams: Array<unknown>
    }>(['infinite-multipage-restore'])
    expect(beforeRefetch?.pages).toHaveLength(2)

    const result = await vi.waitFor(() =>
      clientClient.fetchInfiniteQuery({
        queryKey: ['infinite-multipage-restore'],
        queryFn: async ({ pageParam }) =>
          sleep(0).then(() => ({
            items: [`item-${pageParam}`],
            next: pageParam + 1,
          })),
        initialPageParam: 0,
        pages: 2,
        getNextPageParam: (lastPage: { items: Array<string>; next: number }) =>
          lastPage.next,
      }),
    )

    expect(result.pages).toHaveLength(2)
    expect(result.pageParams).toHaveLength(2)
    expect(result.pages[0]).toHaveProperty('items')
    expect(result.pages[1]).toHaveProperty('items')
  })

  // Companion to the test above: when the query already exists in the cache
  // (e.g. after an initial render or a first hydration pass), the same
  // synchronous thenable resolution must also produce status: 'success'.
  // Previously the if (query) branch would spread status: 'pending' from the
  // server state without correcting it for the resolved data.
  it('should set status to success when rehydrating an existing pending query with a synchronously resolved promise', async () => {
    const key = queryKey()
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    let resolvePrefetch: undefined | ((value?: unknown) => void)
    const prefetchPromise = new Promise((res) => {
      resolvePrefetch = res
    })
    // Keep the query pending so it dehydrates with status: 'pending' and a promise
    void serverQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => prefetchPromise,
    })

    const dehydrated = dehydrate(serverQueryClient)
    expect(dehydrated.queries[0]?.state.status).toBe('pending')

    // Simulate a synchronous thenable – models a React streaming promise that
    // resolved before the second hydrate() call.
    resolvePrefetch?.('server data')
    // @ts-expect-error
    dehydrated.queries[0].promise.then = (cb) => {
      cb?.('server data')
      // @ts-expect-error
      return dehydrated.queries[0].promise
    }

    // --- client ---
    // Query already exists in the cache in a pending state, as it would after
    // a first hydration pass or an initial render.
    const clientQueryClient = new QueryClient()
    void clientQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => {
        throw new Error('QueryFn on client should not be called')
      },
    })

    const query = clientQueryClient.getQueryCache().find({ queryKey: key })!
    expect(query.state.status).toBe('pending')

    hydrate(clientQueryClient, dehydrated)

    expect(clientQueryClient.getQueryData(key)).toBe('server data')
    expect(query.state.status).toBe('success')

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  it('should not transition to a fetching/pending state when hydrating an already resolved promise into a new query', async () => {
    const key = queryKey()
    // --- server ---
    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    let resolvePrefetch: undefined | ((value?: unknown) => void)
    const prefetchPromise = new Promise((res) => {
      resolvePrefetch = res
    })
    void serverQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => prefetchPromise,
    })
    const dehydrated = dehydrate(serverQueryClient)

    // Simulate a synchronous thenable – the promise was already resolved
    // before we hydrate on the client
    resolvePrefetch?.('server data')
    // @ts-expect-error
    dehydrated.queries[0].promise.then = (cb) => {
      cb?.('server data')
      // @ts-expect-error
      return dehydrated.queries[0].promise
    }

    // --- client ---
    const clientQueryClient = new QueryClient()

    const states: Array<{ status: string; fetchStatus: string }> = []
    const unsubscribe = clientQueryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated') {
        const { status, fetchStatus } = event.query.state
        states.push({ status, fetchStatus })
      }
    })

    hydrate(clientQueryClient, dehydrated)
    await vi.advanceTimersByTimeAsync(0)
    unsubscribe()

    expect(states).not.toContainEqual(
      expect.objectContaining({ fetchStatus: 'fetching' }),
    )
    expect(states).not.toContainEqual(
      expect.objectContaining({ status: 'pending' }),
    )

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  it('should not transition to a fetching/pending state when hydrating an already resolved promise into an existing query', async () => {
    const key = queryKey()
    // --- server ---
    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })

    let resolvePrefetch: undefined | ((value?: unknown) => void)
    const prefetchPromise = new Promise((res) => {
      resolvePrefetch = res
    })
    void serverQueryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => prefetchPromise,
    })
    const dehydrated = dehydrate(serverQueryClient)

    // Simulate a synchronous thenable – the promise was already resolved
    // before we hydrate on the client
    resolvePrefetch?.('server data')
    // @ts-expect-error
    dehydrated.queries[0].promise.then = (cb) => {
      cb?.('server data')
      // @ts-expect-error
      return dehydrated.queries[0].promise
    }

    // --- client ---
    // Pre-populate with old data (updatedAt: 0 ensures dehydratedAt is newer)
    const clientQueryClient = new QueryClient()
    clientQueryClient.setQueryData(key, 'old data', { updatedAt: 0 })

    const states: Array<{ status: string; fetchStatus: string }> = []
    const unsubscribe = clientQueryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated') {
        const { status, fetchStatus } = event.query.state
        states.push({ status, fetchStatus })
      }
    })

    hydrate(clientQueryClient, dehydrated)
    await vi.advanceTimersByTimeAsync(0)
    unsubscribe()

    expect(states).not.toContainEqual(
      expect.objectContaining({ fetchStatus: 'fetching' }),
    )
    expect(states).not.toContainEqual(
      expect.objectContaining({ status: 'pending' }),
    )

    clientQueryClient.clear()
    serverQueryClient.clear()
  })
})
