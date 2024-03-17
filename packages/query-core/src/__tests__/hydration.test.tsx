import { describe, expect, test, vi } from 'vitest'
import { QueryCache } from '../queryCache'
import { dehydrate, hydrate } from '../hydration'
import { MutationCache } from '../mutationCache'
import {
  createQueryClient,
  executeMutation,
  mockOnlineManagerIsOnline,
  sleep,
} from './utils'

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 0)
  return value
}

describe('dehydration and rehydration', () => {
  test('should work with serializable values', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string'),
    })
    await queryClient.prefetchQuery({
      queryKey: ['number'],
      queryFn: () => fetchData(1),
    })
    await queryClient.prefetchQuery({
      queryKey: ['boolean'],
      queryFn: () => fetchData(true),
    })
    await queryClient.prefetchQuery({
      queryKey: ['null'],
      queryFn: () => fetchData(null),
    })
    await queryClient.prefetchQuery({
      queryKey: ['array'],
      queryFn: () => fetchData(['string', 0]),
    })
    await queryClient.prefetchQuery({
      queryKey: ['nested'],
      queryFn: () => fetchData({ key: [{ nestedKey: 1 }] }),
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({
      queryCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })?.state.data).toBe(
      'string',
    )
    expect(hydrationCache.find({ queryKey: ['number'] })?.state.data).toBe(1)
    expect(hydrationCache.find({ queryKey: ['boolean'] })?.state.data).toBe(
      true,
    )
    expect(hydrationCache.find({ queryKey: ['null'] })?.state.data).toBe(null)
    expect(hydrationCache.find({ queryKey: ['array'] })?.state.data).toEqual([
      'string',
      0,
    ])
    expect(hydrationCache.find({ queryKey: ['nested'] })?.state.data).toEqual({
      key: [{ nestedKey: 1 }],
    })

    const fetchDataAfterHydration = vi.fn<Array<unknown>, unknown>()
    await hydrationClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: ['number'],
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: ['boolean'],
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: ['null'],
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: ['array'],
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery({
      queryKey: ['nested'],
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should not dehydrate queries if dehydrateQueries is set to false', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string'),
    })

    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: () => false,
    })

    expect(dehydrated.queries.length).toBe(0)

    queryClient.clear()
  })

  test('should use the garbage collection time from the client', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string'),
      gcTime: 50,
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    await sleep(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })?.state.data).toBe(
      'string',
    )
    await sleep(100)
    expect(hydrationCache.find({ queryKey: ['string'] })).toBeTruthy()

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should be able to provide default options for the hydrated queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string'),
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed, {
      defaultOptions: { queries: { retry: 10 } },
    })
    expect(hydrationCache.find({ queryKey: ['string'] })?.options.retry).toBe(
      10,
    )
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should work with complex keys', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string', { key: ['string'], key2: 0 }],
      queryFn: () => fetchData('string'),
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({
        queryKey: ['string', { key: ['string'], key2: 0 }],
      })?.state.data,
    ).toBe('string')

    const fetchDataAfterHydration = vi.fn<Array<unknown>, unknown>()
    await hydrationClient.prefetchQuery({
      queryKey: ['string', { key: ['string'], key2: 0 }],
      queryFn: fetchDataAfterHydration,
      staleTime: 100,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should only hydrate successful queries by default', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['success'],
      queryFn: () => fetchData('success'),
    })
    queryClient.prefetchQuery({
      queryKey: ['loading'],
      queryFn: () => fetchData('loading', 10000),
    })
    await queryClient.prefetchQuery({
      queryKey: ['error'],
      queryFn: () => {
        throw new Error()
      },
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)

    expect(hydrationCache.find({ queryKey: ['success'] })).toBeTruthy()
    expect(hydrationCache.find({ queryKey: ['loading'] })).toBeFalsy()
    expect(hydrationCache.find({ queryKey: ['error'] })).toBeFalsy()

    queryClient.clear()
    hydrationClient.clear()
    consoleMock.mockRestore()
  })

  test('should filter queries via dehydrateQuery', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string'),
    })
    await queryClient.prefetchQuery({
      queryKey: ['number'],
      queryFn: () => fetchData(1),
    })
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => query.queryKey[0] !== 'string',
    })

    // This is testing implementation details that can change and are not
    // part of the public API, but is important for keeping the payload small
    const dehydratedQuery = dehydrated.queries.find(
      (query) => query.queryKey[0] === 'string',
    )
    expect(dehydratedQuery).toBeUndefined()

    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })).toBeUndefined()
    expect(hydrationCache.find({ queryKey: ['number'] })?.state.data).toBe(1)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should not overwrite query in cache if hydrated query is older', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string-older', 5),
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    await hydrationClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string-newer', 5),
    })

    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })?.state.data).toBe(
      'string-newer',
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should overwrite query in cache if hydrated query is newer', async () => {
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    await hydrationClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string-older', 5),
    })

    // ---

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => fetchData('string-newer', 5),
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })?.state.data).toBe(
      'string-newer',
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should be able to dehydrate mutations and continue on hydration', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const onlineMock = mockOnlineManagerIsOnline(false)

    const serverAddTodo = vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('offline')))
    const serverOnMutate = vi.fn().mockImplementation((variables) => {
      const optimisticTodo = { id: 1, text: variables.text }
      return { optimisticTodo }
    })
    const serverOnSuccess = vi.fn()

    const serverClient = createQueryClient()

    serverClient.setMutationDefaults(['addTodo'], {
      mutationFn: serverAddTodo,
      onMutate: serverOnMutate,
      onSuccess: serverOnSuccess,
      retry: 3,
      retryDelay: 10,
    })

    executeMutation(
      serverClient,
      {
        mutationKey: ['addTodo'],
      },
      { text: 'text' },
    ).catch(() => undefined)

    await sleep(50)

    const dehydrated = dehydrate(serverClient)
    const stringified = JSON.stringify(dehydrated)

    serverClient.clear()

    // ---

    onlineMock.mockReturnValue(true)

    const parsed = JSON.parse(stringified)
    const client = createQueryClient()

    const clientAddTodo = vi.fn().mockImplementation((variables) => {
      return { id: 2, text: variables.text }
    })
    const clientOnMutate = vi.fn().mockImplementation((variables) => {
      const optimisticTodo = { id: 1, text: variables.text }
      return { optimisticTodo }
    })
    const clientOnSuccess = vi.fn()

    client.setMutationDefaults(['addTodo'], {
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
    )

    client.clear()
    consoleMock.mockRestore()
    onlineMock.mockRestore()
  })

  test('should not dehydrate mutations if dehydrateMutations is set to false', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const serverAddTodo = vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('offline')))

    const queryClient = createQueryClient()

    queryClient.setMutationDefaults(['addTodo'], {
      mutationFn: serverAddTodo,
      retry: false,
    })

    executeMutation(
      queryClient,
      {
        mutationKey: ['addTodo'],
      },
      { text: 'text' },
    ).catch(() => undefined)

    await sleep(1)
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateMutation: () => false,
    })

    expect(dehydrated.mutations.length).toBe(0)

    queryClient.clear()
    consoleMock.mockRestore()
  })

  test('should not dehydrate mutation if mutation state is set to pause', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const serverAddTodo = vi
      .fn()
      .mockImplementation(() => Promise.reject(new Error('offline')))

    const queryClient = createQueryClient()

    queryClient.setMutationDefaults(['addTodo'], {
      mutationFn: serverAddTodo,
      retry: 1,
      retryDelay: 20,
    })

    executeMutation(
      queryClient,
      {
        mutationKey: ['addTodo'],
      },
      { text: 'text' },
    ).catch(() => undefined)

    // Dehydrate mutation between retries
    await sleep(1)
    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.mutations.length).toBe(0)

    await sleep(30)
    queryClient.clear()
    consoleMock.mockRestore()
  })

  test('should not hydrate if the hydratedState is null or is not an object', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    expect(() => hydrate(queryClient, null)).not.toThrow()
    expect(() => hydrate(queryClient, 'invalid')).not.toThrow()

    queryClient.clear()
  })

  test('should support hydratedState with undefined queries and mutations', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    expect(() => hydrate(queryClient, {})).not.toThrow()
    expect(() => hydrate(queryClient, {})).not.toThrow()

    queryClient.clear()
  })

  test('should set the fetchStatus to idle when creating a query with dehydrate', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

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
      queryKey: ['string'],
      queryFn: () => customFetchData(),
    })

    queryClient.refetchQueries({ queryKey: ['string'] })

    const dehydrated = dehydrate(queryClient)
    resolvePromise('string')
    expect(
      dehydrated.queries.find((q) => q.queryHash === '["string"]')?.state
        .fetchStatus,
    ).toBe('fetching')
    const stringified = JSON.stringify(dehydrated)

    // ---
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({ queryKey: ['string'] })?.state.fetchStatus,
    ).toBe('idle')
  })

  test('should dehydrate and hydrate meta for queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery({
      queryKey: ['meta'],
      queryFn: () => Promise.resolve('meta'),
      meta: {
        some: 'meta',
      },
    })
    await queryClient.prefetchQuery({
      queryKey: ['no-meta'],
      queryFn: () => Promise.resolve('no-meta'),
    })

    const dehydrated = dehydrate(queryClient)

    expect(
      dehydrated.queries.find((q) => q.queryHash === '["meta"]')?.meta,
    ).toEqual({
      some: 'meta',
    })

    expect(
      dehydrated.queries.find((q) => q.queryHash === '["no-meta"]')?.meta,
    ).toEqual(undefined)

    expect(
      Object.keys(
        dehydrated.queries.find((q) => q.queryHash === '["no-meta"]')!,
      ),
    ).not.toEqual(expect.arrayContaining(['meta']))

    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({
      queryCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['meta'] })?.meta).toEqual({
      some: 'meta',
    })
    expect(hydrationCache.find({ queryKey: ['no-meta'] })?.meta).toEqual(
      undefined,
    )
  })

  test('should dehydrate and hydrate meta for mutations', async () => {
    const mutationCache = new MutationCache()
    const queryClient = createQueryClient({ mutationCache })

    await executeMutation(
      queryClient,
      {
        mutationKey: ['meta'],
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
        mutationKey: ['no-meta'],
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
    const hydrationClient = createQueryClient({
      mutationCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ mutationKey: ['meta'] })?.meta).toEqual({
      some: 'meta',
    })
    expect(hydrationCache.find({ mutationKey: ['no-meta'] })?.meta).toEqual(
      undefined,
    )
  })

  test('should not change fetchStatus when updating a query with dehydrate', async () => {
    const queryClient = createQueryClient()

    const options = {
      queryKey: ['string'],
      queryFn: async () => {
        await sleep(10)
        return 'string'
      },
    } as const

    await queryClient.prefetchQuery(options)

    const dehydrated = dehydrate(queryClient)
    expect(
      dehydrated.queries.find((q) => q.queryHash === '["string"]')?.state
        .fetchStatus,
    ).toBe('idle')
    const stringified = JSON.stringify(dehydrated)

    // ---
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })

    const promise = hydrationClient.prefetchQuery(options)
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({ queryKey: ['string'] })?.state.fetchStatus,
    ).toBe('fetching')
    await promise
    expect(
      hydrationCache.find({ queryKey: ['string'] })?.state.fetchStatus,
    ).toBe('idle')
  })
})
