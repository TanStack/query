import assert from 'node:assert'
import { sleep } from '@tanstack/query-test-utils'
import superjson from 'superjson'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { dehydrate, hydrate } from '../hydration'
import { MutationCache } from '../mutationCache'
import { QueryCache } from '../queryCache'
import { QueryClient } from '../queryClient'
import { executeMutation, mockOnlineManagerIsOnline } from './utils'

describe('dehydration and rehydration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should work with serializable values', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(0).then(() => 'string'),
      }),
    )
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['number'],
        queryFn: () => sleep(0).then(() => 1),
      }),
    )

    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['boolean'],
        queryFn: () => sleep(0).then(() => true),
      }),
    )
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['null'],

        queryFn: () => sleep(0).then(() => null),
      }),
    )
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['array'],
        queryFn: () => sleep(0).then(() => ['string', 0]),
      }),
    )
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['nested'],
        queryFn: () => sleep(0).then(() => ({ key: [{ nestedKey: 1 }] })),
      }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({
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

    const fetchDataAfterHydration =
      vi.fn<(...args: Array<unknown>) => unknown>()
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

  test('should not dehydrate queries if dehydrateQueries is set to false', () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(0).then(() => 'string'),
      }),
    )

    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: () => false,
    })

    expect(dehydrated.queries.length).toBe(0)

    queryClient.clear()
  })

  test('should use the garbage collection time from the client', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(0).then(() => 'string'),
        gcTime: 50,
      }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    await vi.advanceTimersByTimeAsync(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })?.state.data).toBe(
      'string',
    )
    await vi.advanceTimersByTimeAsync(100)
    expect(hydrationCache.find({ queryKey: ['string'] })).toBeTruthy()

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should be able to provide default options for the hydrated queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(0).then(() => 'string'),
      }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed, {
      defaultOptions: { queries: { retry: 10 } },
    })
    expect(hydrationCache.find({ queryKey: ['string'] })?.options.retry).toBe(
      10,
    )
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should respect query defaultOptions specified on the QueryClient', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: {
        dehydrate: { shouldDehydrateQuery: () => true },
      },
    })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        retry: 0,
        queryFn: () => Promise.reject(new Error('error')),
      }),
    )
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
    expect(hydrationCache.find({ queryKey: ['string'] })?.options.retry).toBe(
      10,
    )
    expect(hydrationCache.find({ queryKey: ['string'] })?.options.gcTime).toBe(
      10,
    )
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should respect mutation defaultOptions specified on the QueryClient', async () => {
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
        mutationKey: ['string'],
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
    expect(
      hydrationCache.find({ mutationKey: ['string'] })?.options.retry,
    ).toBe(10)
    expect(
      hydrationCache.find({ mutationKey: ['string'] })?.options.gcTime,
    ).toBe(10)
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should work with complex keys', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string', { key: ['string'], key2: 0 }],
        queryFn: () => sleep(0).then(() => 'string'),
      }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({
        queryKey: ['string', { key: ['string'], key2: 0 }],
      })?.state.data,
    ).toBe('string')

    const fetchDataAfterHydration =
      vi.fn<(...args: Array<unknown>) => unknown>()
    await vi.waitFor(() =>
      hydrationClient.prefetchQuery({
        queryKey: ['string', { key: ['string'], key2: 0 }],
        queryFn: fetchDataAfterHydration,
        staleTime: 100,
      }),
    )
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should only hydrate successful queries by default', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['success'],
        queryFn: () => sleep(0).then(() => 'success'),
      }),
    )
    queryClient.prefetchQuery({
      queryKey: ['loading'],
      queryFn: () => sleep(10000).then(() => 'loading'),
    })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['error'],
        queryFn: () => {
          throw new Error()
        },
      }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
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
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(0).then(() => 'string'),
      }),
    )
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['number'],
        queryFn: () => sleep(0).then(() => 1),
      }),
    )
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
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })).toBeUndefined()
    expect(hydrationCache.find({ queryKey: ['number'] })?.state.data).toBe(1)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should not overwrite query in cache if hydrated query is older', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(5).then(() => 'string-older'),
      }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    await vi.waitFor(() =>
      hydrationClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(5).then(() => 'string-newer'),
      }),
    )

    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find({ queryKey: ['string'] })?.state.data).toBe(
      'string-newer',
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should overwrite query in cache if hydrated query is newer', async () => {
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    await vi.waitFor(() =>
      hydrationClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(5).then(() => 'string-older'),
      }),
    )

    // ---

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['string'],
        queryFn: () => sleep(5).then(() => 'string-newer'),
      }),
    )
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
    const serverOnMutate = vi
      .fn()
      .mockImplementation((variables: { text: string }) => {
        const optimisticTodo = { id: 1, text: variables.text }
        return { optimisticTodo }
      })
    const serverOnSuccess = vi.fn()

    const serverClient = new QueryClient()

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
      { client: client, meta: undefined, mutationKey: ['addTodo'] },
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

    const queryClient = new QueryClient()

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

    await vi.advanceTimersByTimeAsync(1)
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

    const queryClient = new QueryClient()

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
    await vi.advanceTimersByTimeAsync(1)
    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.mutations.length).toBe(0)

    await vi.advanceTimersByTimeAsync(30)
    queryClient.clear()
    consoleMock.mockRestore()
  })

  test('should not hydrate if the hydratedState is null or is not an object', () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    expect(() => hydrate(queryClient, null)).not.toThrow()
    expect(() => hydrate(queryClient, 'invalid')).not.toThrow()

    queryClient.clear()
  })

  test('should support hydratedState with undefined queries and mutations', () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })

    expect(() => hydrate(queryClient, {})).not.toThrow()
    expect(() => hydrate(queryClient, {})).not.toThrow()

    queryClient.clear()
  })

  test('should set the fetchStatus to idle when creating a query with dehydrate', async () => {
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
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({ queryKey: ['string'] })?.state.fetchStatus,
    ).toBe('idle')
  })

  test('should dehydrate and hydrate meta for queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['meta'],
        queryFn: () => Promise.resolve('meta'),
        meta: {
          some: 'meta',
        },
      }),
    )
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['no-meta'],
        queryFn: () => Promise.resolve('no-meta'),
      }),
    )

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
    const hydrationClient = new QueryClient({
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
    const queryClient = new QueryClient({ mutationCache })

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
    const hydrationClient = new QueryClient({
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
    const queryClient = new QueryClient()

    const options = {
      queryKey: ['string'],
      queryFn: async () => {
        await sleep(10)
        return 'string'
      },
    } as const

    await vi.waitFor(() => queryClient.prefetchQuery(options))

    const dehydrated = dehydrate(queryClient)
    expect(
      dehydrated.queries.find((q) => q.queryHash === '["string"]')?.state
        .fetchStatus,
    ).toBe('idle')
    const stringified = JSON.stringify(dehydrated)

    // ---
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })

    const promise = hydrationClient.prefetchQuery(options)
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find({ queryKey: ['string'] })?.state.fetchStatus,
    ).toBe('fetching')
    await vi.waitFor(() => promise)
    expect(
      hydrationCache.find({ queryKey: ['string'] })?.state.fetchStatus,
    ).toBe('idle')
  })

  test('should dehydrate and hydrate mutation scopes', () => {
    const queryClient = new QueryClient()
    const onlineMock = mockOnlineManagerIsOnline(false)

    void executeMutation(
      queryClient,
      {
        mutationKey: ['mutation'],
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

  test('should dehydrate promises for pending queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: { dehydrate: { shouldDehydrateQuery: () => true } },
    })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['success'],
        queryFn: () => sleep(0).then(() => 'success'),
      }),
    )

    const promise = queryClient.prefetchQuery({
      queryKey: ['pending'],
      queryFn: () => sleep(10).then(() => 'pending'),
    })
    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.queries[0]?.promise).toBeUndefined()
    expect(dehydrated.queries[1]?.promise).toBeInstanceOf(Promise)

    await vi.waitFor(() => promise)
    queryClient.clear()
  })

  test('should hydrate promises even without observers', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({
      queryCache,
      defaultOptions: { dehydrate: { shouldDehydrateQuery: () => true } },
    })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['success'],
        queryFn: () => sleep(0).then(() => 'success'),
      }),
    )

    void queryClient.prefetchQuery({
      queryKey: ['pending'],
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

    expect(hydrationCache.find({ queryKey: ['success'] })?.state.data).toBe(
      'success',
    )

    expect(hydrationCache.find({ queryKey: ['pending'] })?.state).toMatchObject(
      {
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
      },
    )

    await vi.waitFor(() =>
      expect(
        hydrationCache.find({ queryKey: ['pending'] })?.state,
      ).toMatchObject({
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
      }),
    )
  })

  test('should transform promise result', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: superjson.serialize,
        },
      },
    })

    const promise = queryClient.prefetchQuery({
      queryKey: ['transformedStringToDate'],
      queryFn: () => sleep(20).then(() => new Date('2024-01-01T00:00:00.000Z')),
    })
    const dehydrated = dehydrate(queryClient)
    expect(dehydrated.queries[0]?.promise).toBeInstanceOf(Promise)

    const hydrationClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: superjson.deserialize,
        },
      },
    })

    hydrate(hydrationClient, dehydrated)
    await vi.waitFor(() => promise)
    await vi.waitFor(() =>
      expect(
        hydrationClient.getQueryData(['transformedStringToDate']),
      ).toBeInstanceOf(Date),
    )

    queryClient.clear()
  })

  test('should transform query data if promise is already resolved', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: superjson.serialize,
        },
      },
    })

    const promise = queryClient.prefetchQuery({
      queryKey: ['transformedStringToDate'],
      queryFn: () => sleep(0).then(() => new Date('2024-01-01T00:00:00.000Z')),
    })
    await vi.advanceTimersByTimeAsync(20)
    const dehydrated = dehydrate(queryClient)

    const hydrationClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: superjson.deserialize,
        },
      },
    })

    hydrate(hydrationClient, dehydrated)
    await vi.waitFor(() => promise)
    await vi.waitFor(() =>
      expect(
        hydrationClient.getQueryData(['transformedStringToDate']),
      ).toBeInstanceOf(Date),
    )

    queryClient.clear()
  })

  test('should overwrite query in cache if hydrated query is newer (with transformation)', async () => {
    const hydrationClient = new QueryClient({
      defaultOptions: {
        hydrate: {
          deserializeData: superjson.deserialize,
        },
      },
    })
    await vi.waitFor(() =>
      hydrationClient.prefetchQuery({
        queryKey: ['date'],
        queryFn: () =>
          sleep(5).then(() => new Date('2024-01-01T00:00:00.000Z')),
      }),
    )

    // ---

    const queryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
          serializeData: superjson.serialize,
        },
      },
    })
    await vi.waitFor(() =>
      queryClient.prefetchQuery({
        queryKey: ['date'],
        queryFn: () =>
          sleep(10).then(() => new Date('2024-01-02T00:00:00.000Z')),
      }),
    )
    const dehydrated = dehydrate(queryClient)

    // ---

    hydrate(hydrationClient, dehydrated)

    expect(hydrationClient.getQueryData(['date'])).toStrictEqual(
      new Date('2024-01-02T00:00:00.000Z'),
    )

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should overwrite query in cache if hydrated query is newer (with promise)', async () => {
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })

    const promise = serverQueryClient.prefetchQuery({
      queryKey: ['data'],
      queryFn: async () => {
        await sleep(10)
        return 'server data'
      },
    })

    const dehydrated = dehydrate(serverQueryClient)

    // --- client ---

    const clientQueryClient = new QueryClient()

    clientQueryClient.setQueryData(['data'], 'old data', { updatedAt: 10 })

    hydrate(clientQueryClient, dehydrated)

    await vi.waitFor(() => promise)
    await vi.waitFor(() =>
      expect(clientQueryClient.getQueryData(['data'])).toBe('server data'),
    )

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  test('should not overwrite query in cache if existing query is newer (with promise)', async () => {
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })

    const promise = serverQueryClient.prefetchQuery({
      queryKey: ['data'],
      queryFn: async () => {
        await sleep(10)
        return 'server data'
      },
    })

    const dehydrated = dehydrate(serverQueryClient)

    await vi.advanceTimersByTimeAsync(10)
    await promise

    // Pretend the output of this server part is cached for a long time

    // --- client ---

    await vi.advanceTimersByTimeAsync(10_000) // Arbitrary time in the future

    const clientQueryClient = new QueryClient()

    clientQueryClient.setQueryData(['data'], 'newer data', {
      updatedAt: Date.now(),
    })

    hydrate(clientQueryClient, dehydrated)

    // If the query was hydrated in error, it would still take some time for it
    // to end up in the cache, so for the test to fail properly on regressions,
    // wait for the fetchStatus to be idle
    await vi.waitFor(() =>
      expect(clientQueryClient.getQueryState(['data'])?.fetchStatus).toBe(
        'idle',
      ),
    )
    await vi.waitFor(() =>
      expect(clientQueryClient.getQueryData(['data'])).toBe('newer data'),
    )

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  test('should overwrite data when a new promise is streamed in', async () => {
    const countRef = { current: 0 }
    // --- server ---
    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })

    const query = {
      queryKey: ['data'],
      queryFn: async () => {
        await sleep(10)
        return countRef.current
      },
    }

    const promise = serverQueryClient.prefetchQuery(query)

    let dehydrated = dehydrate(serverQueryClient)

    // --- client ---

    const clientQueryClient = new QueryClient()

    hydrate(clientQueryClient, dehydrated)

    await vi.waitFor(() => promise)
    await vi.waitFor(() =>
      expect(clientQueryClient.getQueryData(query.queryKey)).toBe(0),
    )

    // --- server ---
    countRef.current++
    serverQueryClient.clear()
    const promise2 = serverQueryClient.prefetchQuery(query)

    dehydrated = dehydrate(serverQueryClient)

    // --- client ---

    hydrate(clientQueryClient, dehydrated)

    await vi.waitFor(() => promise2)
    await vi.waitFor(() =>
      expect(clientQueryClient.getQueryData(query.queryKey)).toBe(1),
    )

    clientQueryClient.clear()
    serverQueryClient.clear()
  })

  test('should not redact errors when shouldRedactErrors returns false', async () => {
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
        queryKey: ['error'],
        queryFn: () => Promise.reject(testError),
        retry: false,
      })
      .catch(() => undefined)

    const dehydrated = dehydrate(queryClient)

    expect(dehydrated.queries[0]?.promise).toBeInstanceOf(Promise)
    await expect(dehydrated.queries[0]?.promise).rejects.toBe(testError)
    await promise
  })

  test('should handle errors in promises for pending queries', async () => {
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
        queryKey: ['error'],
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

  test('should log error in development environment when redacting errors', async () => {
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
        queryKey: ['error'],
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
  test('should rehydrate synchronous thenable immediately', async () => {
    // --- server ---

    const serverQueryClient = new QueryClient({
      defaultOptions: {
        dehydrate: {
          shouldDehydrateQuery: () => true,
        },
      },
    })
    const originalPromise = serverQueryClient.prefetchQuery({
      queryKey: ['data'],
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
    expect(clientQueryClient.getQueryData(['data'])).toBe('server data')

    // Need to await the original promise or else it will get a cancellation
    // error and test will fail
    await originalPromise
  })

  test('should serialize and deserialize query keys', () => {
    const createQueryClient = () =>
      new QueryClient({
        defaultOptions: {
          dehydrate: {
            serializeData: superjson.serialize,
          },
          hydrate: {
            deserializeData: superjson.deserialize,
          },
        },
      })

    const getFirstEntry = (client: QueryClient) => {
      const [entry] = client.getQueryCache().getAll()
      assert(entry, 'cache should not be empty')
      return entry
    }

    const serverClient = createQueryClient()

    // Make a query key that isn't plain javascript object
    const queryKey = ['date', new Date('2024-01-01T00:00:00.000Z')] as const

    serverClient.setQueryData(queryKey, {
      foo: 'bar',
    })

    const serverEntry = getFirstEntry(serverClient)

    // use JSON.parse(JSON.stringify()) to mock a http roundtrip
    const dehydrated = JSON.parse(JSON.stringify(dehydrate(serverClient)))

    const frontendClient = createQueryClient()

    hydrate(frontendClient, dehydrated)

    const clientEntry = getFirstEntry(frontendClient)

    expect(clientEntry.queryKey).toEqual(queryKey)
    expect(clientEntry.queryKey).toEqual(serverEntry.queryKey)
    expect(clientEntry.queryHash).toEqual(serverEntry.queryHash)

    expect(clientEntry).toMatchObject(serverEntry)
  })
})
