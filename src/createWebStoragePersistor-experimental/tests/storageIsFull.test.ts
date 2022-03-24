import { dehydrate, MutationCache, QueryCache, QueryClient } from '../../core'
import { sleep } from '../../react/tests/utils'
import { createWebStoragePersistor } from '../index'

function getMockStorage(limitSize?: number) {
  const dataSet = new Map<string, string>()
  return ({
    getItem(key: string): string | null {
      const value = dataSet.get(key)
      return value === undefined ? null : value
    },

    setItem(key: string, value: string) {
      if (limitSize) {
        const currentSize = Array.from(dataSet.entries()).reduce(
          (n, d) => d[0].length + d[1].length + n,
          0
        )
        if (
          currentSize - (dataSet.get(key)?.length || 0) + value.length >
          limitSize
        ) {
          throw Error(
            ` Failed to execute 'setItem' on 'Storage': Setting the value of '${key}' exceeded the quota.`
          )
        }
      }
      return dataSet.set(key, value)
    },
    removeItem(key: string) {
      return dataSet.delete(key)
    },
  } as any) as Storage
}

describe('createWebStoragePersistor ', () => {
  test('basic store and recover', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const storage = getMockStorage()
    const webStoragePersistor = createWebStoragePersistor({
      throttleTime: 0,
      storage,
    })

    await queryClient.prefetchQuery('string', () => Promise.resolve('string'))
    await queryClient.prefetchQuery('number', () => Promise.resolve(1))
    await queryClient.prefetchQuery('boolean', () => Promise.resolve(true))
    await queryClient.prefetchQuery('null', () => Promise.resolve(null))
    await queryClient.prefetchQuery('array', () =>
      Promise.resolve(['string', 0])
    )

    const persistClient = {
      buster: 'test-buster',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    webStoragePersistor.persistClient(persistClient)
    await sleep(1)
    const restoredClient = await webStoragePersistor.restoreClient()
    expect(restoredClient).toEqual(persistClient)
  })

  test('should clean the old queries when storage full', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const N = 2000
    const storage = getMockStorage(N * 5) // can save 4 items;
    const webStoragePersistor = createWebStoragePersistor({
      throttleTime: 0,
      storage,
    })

    await queryClient.prefetchQuery('A', () => Promise.resolve('A'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery('B', () => Promise.resolve('B'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery('C', () => Promise.resolve('C'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery('D', () => Promise.resolve('D'.repeat(N)))

    await sleep(1)
    await queryClient.prefetchQuery('E', () => Promise.resolve('E'.repeat(N)))

    const persistClient = {
      buster: 'test-limit',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    webStoragePersistor.persistClient(persistClient)
    await sleep(10)
    const restoredClient = await webStoragePersistor.restoreClient()
    expect(restoredClient?.clientState.queries.length).toEqual(4)
    expect(
      restoredClient?.clientState.queries.find(q => q.queryKey === 'A')
    ).toBeUndefined()
    expect(
      restoredClient?.clientState.queries.find(q => q.queryKey === 'B')
    ).not.toBeUndefined()

    // update query Data
    await queryClient.prefetchQuery('A', () => Promise.resolve('a'.repeat(N)))
    const updatedPersistClient = {
      buster: 'test-limit',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    webStoragePersistor.persistClient(updatedPersistClient)
    await sleep(10)
    const restoredClient2 = await webStoragePersistor.restoreClient()
    expect(restoredClient2?.clientState.queries.length).toEqual(4)
    expect(
      restoredClient2?.clientState.queries.find(q => q.queryKey === 'A')
    ).toHaveProperty('state.data', 'a'.repeat(N))
    expect(
      restoredClient2?.clientState.queries.find(q => q.queryKey === 'B')
    ).toBeUndefined()
  })

  test('should clean queries before mutations when storage full', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const N = 2000
    const storage = getMockStorage(N * 5) // can save 4 items;
    const webStoragePersistor = createWebStoragePersistor({
      throttleTime: 0,
      storage,
    })

    mutationCache.build(
      queryClient,
      {
        mutationKey: 'MUTATIONS',
        mutationFn: () => Promise.resolve('M'.repeat(N)),
      },
      {
        error: null,
        context: '',
        failureCount: 1,
        isPaused: true,
        status: 'success',
        variables: '',
        data: 'M'.repeat(N),
      }
    )
    await sleep(1)
    await queryClient.prefetchQuery('A', () => Promise.resolve('A'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery('B', () => Promise.resolve('B'.repeat(N)))
    await queryClient.prefetchQuery('C', () => Promise.resolve('C'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery('D', () => Promise.resolve('D'.repeat(N)))

    const persistClient = {
      buster: 'test-limit-mutations',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    webStoragePersistor.persistClient(persistClient)
    await sleep(10)
    const restoredClient = await webStoragePersistor.restoreClient()
    expect(restoredClient?.clientState.mutations.length).toEqual(1)
    expect(restoredClient?.clientState.queries.length).toEqual(3)
    expect(
      restoredClient?.clientState.queries.find(q => q.queryKey === 'A')
    ).toBeUndefined()
  })
})
