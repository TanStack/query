import { sleep } from '../../react/tests/utils'
import { QueryCache, QueryClient } from '../..'
import { dehydrate, hydrate } from '../hydration'

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 0)
  return value
}

describe('dehydration and rehydration', () => {
  test('should work with serializeable values', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string'))
    await client.prefetchQuery('number', () => fetchData(1))
    await client.prefetchQuery('boolean', () => fetchData(true))
    await client.prefetchQuery('null', () => fetchData(null))
    await client.prefetchQuery('array', () => fetchData(['string', 0]))
    await client.prefetchQuery('nested', () =>
      fetchData({ key: [{ nestedKey: 1 }] })
    )
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    hydrate(hydrationCache, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string')
    expect(hydrationCache.find('number')?.state.data).toBe(1)
    expect(hydrationCache.find('boolean')?.state.data).toBe(true)
    expect(hydrationCache.find('null')?.state.data).toBe(null)
    expect(hydrationCache.find('array')?.state.data).toEqual(['string', 0])
    expect(hydrationCache.find('nested')?.state.data).toEqual({
      key: [{ nestedKey: 1 }],
    })

    const fetchDataAfterHydration = jest.fn()
    const hydrationClient = new QueryClient({ cache: hydrationCache })
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

    cache.clear()
    hydrationCache.clear()
  })

  test('should schedule garbage collection, measured from hydration', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string'), {
      cacheTime: 50,
    })
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)

    await sleep(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    hydrate(hydrationCache, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string')
    await sleep(30)
    expect(hydrationCache.find('string')).toBeTruthy()
    await sleep(30)
    expect(hydrationCache.find('string')).toBeFalsy()

    cache.clear()
    hydrationCache.clear()
  })

  test('should serialize the cacheTime correctly', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string'), {
      cacheTime: Infinity,
    })
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    hydrate(hydrationCache, parsed)
    expect(hydrationCache.find('string')?.cacheTime).toBe(Infinity)
    cache.clear()
    hydrationCache.clear()
  })

  test('should be able to provide default options for the hydrated queries', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string'))
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    hydrate(hydrationCache, parsed, { defaultOptions: { retry: 10 } })
    expect(hydrationCache.find('string')?.options.retry).toBe(10)
    cache.clear()
    hydrationCache.clear()
  })

  test('should work with complex keys', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery(['string', { key: ['string'], key2: 0 }], () =>
      fetchData('string')
    )
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    hydrate(hydrationCache, parsed)
    expect(
      hydrationCache.find(['string', { key: ['string'], key2: 0 }])?.state.data
    ).toBe('string')

    const fetchDataAfterHydration = jest.fn()
    const hydrationClient = new QueryClient({ cache: hydrationCache })
    await hydrationClient.prefetchQuery(
      ['string', { key: ['string'], key2: 0 }],
      fetchDataAfterHydration,
      { staleTime: 10 }
    )
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    cache.clear()
    hydrationCache.clear()
  })

  test('should only hydrate successful queries by default', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('success', () => fetchData('success'))
    client.prefetchQuery('loading', () => fetchData('loading', 10000))
    await client.prefetchQuery('error', () => {
      throw new Error()
    })
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    hydrate(hydrationCache, parsed)

    expect(hydrationCache.find('success')).toBeTruthy()
    expect(hydrationCache.find('loading')).toBeFalsy()
    expect(hydrationCache.find('error')).toBeFalsy()

    cache.clear()
    hydrationCache.clear()
    consoleMock.mockRestore()
  })

  test('should filter queries via shouldDehydrate', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string'))
    await client.prefetchQuery('number', () => fetchData(1))
    const dehydrated = dehydrate(cache, {
      shouldDehydrate: query => query.queryKey !== 'string',
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
    hydrate(hydrationCache, parsed)
    expect(hydrationCache.find('string')).toBeUndefined()
    expect(hydrationCache.find('number')?.state.data).toBe(1)

    cache.clear()
    hydrationCache.clear()
  })

  test('should not overwrite query in cache if hydrated query is older', async () => {
    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string-older', 5))
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ cache: hydrationCache })
    await hydrationClient.prefetchQuery('string', () =>
      fetchData('string-newer', 5)
    )

    hydrate(hydrationCache, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string-newer')

    cache.clear()
    hydrationCache.clear()
  })

  test('should overwrite query in cache if hydrated query is newer', async () => {
    const hydrationCache = new QueryCache()
    const hydrationClient = new QueryClient({ cache: hydrationCache })
    await hydrationClient.prefetchQuery('string', () =>
      fetchData('string-older', 5)
    )

    // ---

    const cache = new QueryCache()
    const client = new QueryClient({ cache })
    await client.prefetchQuery('string', () => fetchData('string-newer', 5))
    const dehydrated = dehydrate(cache)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    hydrate(hydrationCache, parsed)
    expect(hydrationCache.find('string')?.state.data).toBe('string-newer')

    cache.clear()
    hydrationCache.clear()
  })
})
