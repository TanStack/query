import { sleep } from '../../react/tests/utils'
import { QueryCache, Environment, prefetchQuery, findQuery } from '../..'
import { dehydrate, hydrate } from '../hydration'

async function fetchData<TData>(value: TData, ms?: number): Promise<TData> {
  await sleep(ms || 0)
  return value
}

describe('dehydration and rehydration', () => {
  test('should work with serializeable values', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string'),
    })
    await prefetchQuery(environment, {
      queryKey: 'number',
      queryFn: () => fetchData(1),
    })
    await prefetchQuery(environment, {
      queryKey: 'boolean',
      queryFn: () => fetchData(true),
    })
    await prefetchQuery(environment, {
      queryKey: 'null',
      queryFn: () => fetchData(null),
    })
    await prefetchQuery(environment, {
      queryKey: 'array',
      queryFn: () => fetchData(['string', 0]),
    })
    await prefetchQuery(environment, {
      queryKey: 'nested',
      queryFn: () => fetchData({ key: [{ nestedKey: 1 }] }),
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed)
    expect(findQuery(hydrationEnvironment, 'string')?.state.data).toBe('string')
    expect(findQuery(hydrationEnvironment, 'number')?.state.data).toBe(1)
    expect(findQuery(hydrationEnvironment, 'boolean')?.state.data).toBe(true)
    expect(findQuery(hydrationEnvironment, 'null')?.state.data).toBe(null)
    expect(findQuery(hydrationEnvironment, 'array')?.state.data).toEqual([
      'string',
      0,
    ])
    expect(findQuery(hydrationEnvironment, 'nested')?.state.data).toEqual({
      key: [{ nestedKey: 1 }],
    })

    const fetchDataAfterHydration = jest.fn()
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'string',
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'number',
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'boolean',
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'null',
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'array',
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'nested',
      queryFn: fetchDataAfterHydration,
      staleTime: 1000,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should schedule garbage collection, measured from hydration', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string'),
      cacheTime: 50,
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)

    await sleep(20)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed)
    expect(findQuery(hydrationEnvironment, 'string')?.state.data).toBe('string')
    await sleep(30)
    expect(findQuery(hydrationEnvironment, 'string')).toBeTruthy()
    await sleep(30)
    expect(findQuery(hydrationEnvironment, 'string')).toBeFalsy()

    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should serialize the cacheTime correctly', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string'),
      cacheTime: Infinity,
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed)
    expect(findQuery(hydrationEnvironment, 'string')?.cacheTime).toBe(Infinity)
    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should be able to provide default options for the hydrated queries', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string'),
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)
    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed, { defaultOptions: { retry: 10 } })
    expect(findQuery(hydrationEnvironment, 'string')?.options.retry).toBe(10)
    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should work with complex keys', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: ['string', { key: ['string'], key2: 0 }],
      queryFn: () => fetchData('string'),
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed)
    expect(
      findQuery(hydrationEnvironment, ['string', { key: ['string'], key2: 0 }])
        ?.state.data
    ).toBe('string')

    const fetchDataAfterHydration = jest.fn()
    await prefetchQuery(hydrationEnvironment, {
      queryKey: ['string', { key: ['string'], key2: 0 }],
      queryFn: fetchDataAfterHydration,
      staleTime: 10,
    })
    expect(fetchDataAfterHydration).toHaveBeenCalledTimes(0)

    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should only hydrate successful queries by default', async () => {
    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'success',
      queryFn: () => fetchData('success'),
    })
    prefetchQuery(environment, {
      queryKey: 'loading',
      queryFn: () => fetchData('loading', 10000),
    })
    await prefetchQuery(environment, {
      queryKey: 'error',
      queryFn: () => {
        throw new Error()
      },
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed)

    expect(findQuery(hydrationEnvironment, 'success')).toBeTruthy()
    expect(findQuery(hydrationEnvironment, 'loading')).toBeFalsy()
    expect(findQuery(hydrationEnvironment, 'error')).toBeFalsy()

    environment.clear()
    hydrationEnvironment.clear()
    consoleMock.mockRestore()
  })

  test('should filter queries via shouldDehydrateQuery', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string'),
    })
    await prefetchQuery(environment, {
      queryKey: 'number',
      queryFn: () => fetchData(1),
    })
    const dehydrated = dehydrate(environment, {
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
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    hydrate(hydrationEnvironment, parsed)
    expect(findQuery(hydrationEnvironment, 'string')).toBeUndefined()
    expect(findQuery(hydrationEnvironment, 'number')?.state.data).toBe(1)

    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should not overwrite query in cache if hydrated query is older', async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string-older', 5),
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'string',
      queryFn: () => fetchData('string-newer', 5),
    })

    hydrate(hydrationEnvironment, parsed)
    expect(findQuery(hydrationEnvironment, 'string')?.state.data).toBe(
      'string-newer'
    )

    environment.clear()
    hydrationEnvironment.clear()
  })

  test('should overwrite query in cache if hydrated query is newer', async () => {
    const hydrationEnvironment = new Environment({
      queryCache: new QueryCache(),
    })
    await prefetchQuery(hydrationEnvironment, {
      queryKey: 'string',
      queryFn: () => fetchData('string-older', 5),
    })

    // ---

    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, {
      queryKey: 'string',
      queryFn: () => fetchData('string-newer', 5),
    })
    const dehydrated = dehydrate(environment)
    const stringified = JSON.stringify(dehydrated)

    // ---

    const parsed = JSON.parse(stringified)
    hydrate(hydrationEnvironment, parsed)
    expect(findQuery(hydrationEnvironment, 'string')?.state.data).toBe(
      'string-newer'
    )

    environment.clear()
    hydrationEnvironment.clear()
  })
})
