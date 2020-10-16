import { sleep } from '../../react/tests/utils'
import { QueryCache, QueryClient } from '../..'
import { dehydrate, hydrate } from '../hydration'

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 0)
  return value
}

describe('dehydration and rehydration', () => {
  test('should work with serializeable values', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () => fetchData('string'))
    await queryClient.prefetchQuery('number', () => fetchData(1))
    await queryClient.prefetchQuery('boolean', () => fetchData(true))
    await queryClient.prefetchQuery('null', () => fetchData(null))
    await queryClient.prefetchQuery('array', () => fetchData(['string', 0]))
    await queryClient.prefetchQuery('nested', () =>
      fetchData({ key: [{ nestedKey: 1 }] })
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string')
    expect(hydrationCache.find('number')?.state.data).toBe(1)
    expect(hydrationCache.find('boolean')?.state.data).toBe(true)
    expect(hydrationCache.find('null')?.state.data).toBe(null)
    expect(hydrationCache.find('array')?.state.data).toEqual(['string', 0])
    expect(hydrationCache.find('nested')?.state.data).toEqual({
      key: [{ nestedKey: 1 }],
    })

    const fetchDataAfterHydration = jest.fn()
    await hydrationClient.prefetchQuery('string', fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery('number', fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery('boolean', fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery('null', fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery('array', fetchDataAfterHydration, {
      staleTime: 1000,
    })
    await hydrationClient.prefetchQuery('nested', fetchDataAfterHydration, {
      staleTime: 1000,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should schedule garbage collection, measured from hydration', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () => fetchData('string'), {
      cacheTime: 50,
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    await sleep(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string')
    await sleep(30)
    expect(hydrationCache.find('string')).toBeTruthy()
    await sleep(30)
    expect(hydrationCache.find('string')).toBeFalsy()

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should serialize the cacheTime correctly', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () => fetchData('string'), {
      cacheTime: Infinity,
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find('string')?.cacheTime).toBe(Infinity)
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should be able to provide default options for the hydrated queries', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () => fetchData('string'))
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed, { defaultOptions: { retry: 10 } })
    expect(hydrationCache.find('string')?.options.retry).toBe(10)
    queryClient.clear()
    hydrationClient.clear()
  })

  test('should work with complex keys', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery(
      ['string', { key: ['string'], key2: 0 }],
      () => fetchData('string')
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(
      hydrationCache.find(['string', { key: ['string'], key2: 0 }])?.state.data
    ).toBe('string')

    const fetchDataAfterHydration = jest.fn()
    await hydrationClient.prefetchQuery(
      ['string', { key: ['string'], key2: 0 }],
      fetchDataAfterHydration,
      { staleTime: 10 }
    )
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should only hydrate successful queries by default', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('success', () => fetchData('success'))
    queryClient.prefetchQuery('loading', () => fetchData('loading', 10000))
    await queryClient.prefetchQuery('error', () => {
      throw new Error()
    })
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)

    expect(hydrationCache.find('success')).toBeTruthy()
    expect(hydrationCache.find('loading')).toBeFalsy()
    expect(hydrationCache.find('error')).toBeFalsy()

    queryClient.clear()
    hydrationClient.clear()
    consoleMock.mockRestore()
  })

  test('should filter queries via shouldDehydrateQuery', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () => fetchData('string'))
    await queryClient.prefetchQuery('number', () => fetchData(1))
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: query => query.queryKey !== 'string',
    })

    // This is testing implementation details that can change and are not
    // part of the public API, but is important for keeping the payload small
    const dehydratedQuery = dehydrated?.queries.find(
      query => query?.queryKey === 'string'
    )
    expect(dehydratedQuery).toBeUndefined()

    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find('string')).toBeUndefined()
    expect(hydrationCache.find('number')?.state.data).toBe(1)

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should not overwrite query in cache if hydrated query is older', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () =>
      fetchData('string-older', 5)
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    await hydrationClient.prefetchQuery('string', () =>
      fetchData('string-newer', 5)
    )

    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string-newer')

    queryClient.clear()
    hydrationClient.clear()
  })

  test('should overwrite query in cache if hydrated query is newer', async () => {
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ queryCache: hydrationCache })
    await hydrationClient.prefetchQuery('string', () =>
      fetchData('string-older', 5)
    )

    // ---

    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    await queryClient.prefetchQuery('string', () =>
      fetchData('string-newer', 5)
    )
    const dehydrated = dehydrate(queryClient)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    hydrate(hydrationClient, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string-newer')

    queryClient.clear()
    hydrationClient.clear()
  })
})
