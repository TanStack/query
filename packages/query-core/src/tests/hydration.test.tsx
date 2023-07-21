import { QueryCache } from '../queryCache'
import { dehydrate, hydrate } from '../hydration'
import {
  createQueryClient,
  executeMutation,
  mockNavigatorOnLine,
  sleep,
} from './utils'

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 0)
  return value
}

describe('dehydration and rehydration', () => {
  test('should work with serializeable values', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () => fetchData('string'))
    await queryClient.prefetchQuery(['number'], () => fetchData(1))
    await queryClient.prefetchQuery(['boolean'], () => fetchData(true))
    await queryClient.prefetchQuery(['null'], () => fetchData(null))
    await queryClient.prefetchQuery(['array'], () => fetchData(['string', 0]))
    await queryClient.prefetchQuery(['nested'], () =>
      fetchData({ key: [{ nestedKey: 1 }] }),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({
      queryCache: hydrationCache,
    })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find(['string'])?.state.data).toBe('string')
    expect(hydrationCache.find(['number'])?.state.data).toBe(1)
    expect(hydrationCache.find(['boolean'])?.state.data).toBe(true)
    expect(hydrationCache.find(['null'])?.state.data).toBe(null)
    expect(hydrationCache.find(['array'])?.state.data).toEqual(['string', 0])
    expect(hydrationCache.find(['nested'])?.state.data).toEqual({
      key: [{ nestedKey: 1 }],
    })

    const fetchDataAfterHydration = jest.fn<unknown, unknown[]>()
    await hydrationClient.prefetchQuery(['string'], fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery(['number'], fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery(['boolean'], fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery(['null'], fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery(['array'], fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery(['nested'], fetchDataAfterHydration, {
      staleTime: 1000,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should not dehydrate queries if dehydrateQueries is set to false', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () => fetchData('string'))

    const dehydrated = dehydrate(queryClient, { dehydrateQueries: false })

    expect(dehydrated.queries.length).toBe(0)

    queryClient.clear()
  })

  test('should use the cache time from the client', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () => fetchData('string'), {
      cacheTime: 50,
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    await sleep(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find(['string'])?.state.data).toBe('string')
    await sleep(100)
    expect(hydrationCache.find(['string'])).toBeTruthy()

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should be able to provide default options for the hydrated queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () => fetchData('string'))
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed, {
      defaultOptions: { queries: { retry: 10 } },
    })
    expect(hydrationCache.find(['string'])?.options.retry).toBe(10)
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should work with complex keys', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(
      ['string', { key: ['string'], key2: 0 }],
      () => fetchData('string'),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find(['string', { key: ['string'], key2: 0 }])?.state.data,
    ).toBe('string')

    const fetchDataAfterHydration = jest.fn<unknown, unknown[]>()
    await hydrationClient.prefetchQuery(
      ['string', { key: ['string'], key2: 0 }],
      fetchDataAfterHydration,
      { staleTime: 100 },
    )
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should only hydrate successful queries by default', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['success'], () => fetchData('success'))
    queryClient.prefetchQuery(['loading'], () => fetchData('loading', 10000))
    await queryClient.prefetchQuery(['error'], () => {
      throw new Error()
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)

    expect(hydrationCache.find(['success'])).toBeTruthy()
    expect(hydrationCache.find(['loading'])).toBeFalsy()
    expect(hydrationCache.find(['error'])).toBeFalsy()

    queryClient.clear()
    hydrationClient.clear()
    consoleMock.mockRestore()
  })

  test('should filter queries via shouldDehydrateQuery', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () => fetchData('string'))
    await queryClient.prefetchQuery(['number'], () => fetchData(1))
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
    expect(hydrationCache.find(['string'])).toBeUndefined()
    expect(hydrationCache.find(['number'])?.state.data).toBe(1)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should not overwrite query in cache if hydrated query is older', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () =>
      fetchData('string-older', 5),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    await hydrationClient.prefetchQuery(['string'], () =>
      fetchData('string-newer', 5),
    )

    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find(['string'])?.state.data).toBe('string-newer')

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should overwrite query in cache if hydrated query is newer', async () => {
    const hydrationCache = new QueryCache()
    const hydrationClient = createQueryClient({ queryCache: hydrationCache })
    await hydrationClient.prefetchQuery(['string'], () =>
      fetchData('string-older', 5),
    )

    // ---

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    await queryClient.prefetchQuery(['string'], () =>
      fetchData('string-newer', 5),
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find(['string'])?.state.data).toBe('string-newer')

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should be able to dehydrate mutations and continue on hydration', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const onlineMock = mockNavigatorOnLine(false)

    const serverAddTodo = jest
      .fn()
      .mockImplementation(() => Promise.reject('offline'))
    const serverOnMutate = jest.fn().mockImplementation((variables) => {
      const optimisticTodo = { id: 1, text: variables.text }
      return { optimisticTodo }
    })
    const serverOnSuccess = jest.fn()

    const serverClient = createQueryClient()

    serverClient.setMutationDefaults(['addTodo'], {
      mutationFn: serverAddTodo,
      onMutate: serverOnMutate,
      onSuccess: serverOnSuccess,
      retry: 3,
      retryDelay: 10,
    })

    executeMutation(serverClient, {
      mutationKey: ['addTodo'],
      variables: { text: 'text' },
    }).catch(() => undefined)

    await sleep(50)

    const dehydrated = dehydrate(serverClient)
    const stringified = JSON.stringify(dehydrated)

    serverClient.clear()

    // ---

    onlineMock.mockReturnValue(true)

    const parsed = JSON.parse(stringified)
    const client = createQueryClient()

    const clientAddTodo = jest.fn().mockImplementation((variables) => {
      return { id: 2, text: variables.text }
    })
    const clientOnMutate = jest.fn().mockImplementation((variables) => {
      const optimisticTodo = { id: 1, text: variables.text }
      return { optimisticTodo }
    })
    const clientOnSuccess = jest.fn()

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
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const serverAddTodo = jest
      .fn()
      .mockImplementation(() => Promise.reject('offline'))

    const queryClient = createQueryClient()

    queryClient.setMutationDefaults(['addTodo'], {
      mutationFn: serverAddTodo,
      retry: false,
    })

    executeMutation(queryClient, {
      mutationKey: ['addTodo'],
      variables: { text: 'text' },
    }).catch(() => undefined)

    await sleep(1)
    const dehydrated = dehydrate(queryClient, { dehydrateMutations: false })

    expect(dehydrated.mutations.length).toBe(0)

    queryClient.clear()
    consoleMock.mockRestore()
  })

  test('should not dehydrate mutation if mutation state is set to pause', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const serverAddTodo = jest
      .fn()
      .mockImplementation(() => Promise.reject('offline'))

    const queryClient = createQueryClient()

    queryClient.setMutationDefaults(['addTodo'], {
      mutationFn: serverAddTodo,
      retry: 1,
      retryDelay: 20,
    })

    executeMutation(queryClient, {
      mutationKey: ['addTodo'],
      variables: { text: 'text' },
    }).catch(() => undefined)

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

  test('should set the fetchStatus to idle in all cases when dehydrating', async () => {
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

    await queryClient.prefetchQuery(['string'], () => customFetchData())

    queryClient.refetchQueries(['string'])

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
    expect(hydrationCache.find(['string'])?.state.fetchStatus).toBe('idle')
  })
})
