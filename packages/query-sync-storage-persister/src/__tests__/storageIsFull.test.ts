import {
  MutationCache,
  QueryCache,
  QueryClient,
  dehydrate,
} from '@tanstack/query-core'
import { removeOldestQuery } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '../index'
import { sleep } from './utils'

function getMockStorage(limitSize?: number) {
  const dataSet = new Map<string, string>()
  return {
    getItem(key: string): string | null {
      const value = dataSet.get(key)
      return value === undefined ? null : value
    },

    setItem(key: string, value: string) {
      if (typeof limitSize !== 'undefined') {
        const currentSize = Array.from(dataSet.entries()).reduce(
          (n, d) => d[0].length + d[1].length + n,
          0,
        )
        if (
          currentSize - (dataSet.get(key)?.length || 0) + value.length >
          limitSize
        ) {
          throw Error(
            `Failed to execute 'setItem' on 'Storage': Setting the value of '${key}' exceeded the quota.`,
          )
        }
      }
      return dataSet.set(key, value)
    },
    removeItem(key: string) {
      return dataSet.delete(key)
    },
  } as any as Storage
}

describe('createpersister ', () => {
  test('basic store and recover', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const storage = getMockStorage()
    const persister = createSyncStoragePersister({
      throttleTime: 0,
      storage,
    })

    await queryClient.prefetchQuery(['string'], () => Promise.resolve('string'))
    await queryClient.prefetchQuery(['number'], () => Promise.resolve(1))
    await queryClient.prefetchQuery(['boolean'], () => Promise.resolve(true))
    await queryClient.prefetchQuery(['null'], () => Promise.resolve(null))
    await queryClient.prefetchQuery(['array'], () =>
      Promise.resolve(['string', 0]),
    )

    const persistClient = {
      buster: 'test-buster',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    persister.persistClient(persistClient)
    await sleep(1)
    const restoredClient = await persister.restoreClient()
    expect(restoredClient).toEqual(persistClient)
  })

  test('should clean the old queries when storage full', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const N = 2000
    const storage = getMockStorage(N * 5) // can save 4 items;
    const persister = createSyncStoragePersister({
      throttleTime: 0,
      storage,
      retry: removeOldestQuery,
    })

    await queryClient.prefetchQuery(['A'], () => Promise.resolve('A'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery(['B'], () => Promise.resolve('B'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery(['C'], () => Promise.resolve('C'.repeat(N)))
    await sleep(1)
    await queryClient.prefetchQuery(['D'], () => Promise.resolve('D'.repeat(N)))

    await sleep(1)
    await queryClient.prefetchQuery(['E'], () => Promise.resolve('E'.repeat(N)))

    const persistClient = {
      buster: 'test-limit',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    persister.persistClient(persistClient)
    await sleep(10)
    const restoredClient = await persister.restoreClient()
    expect(restoredClient?.clientState.queries.length).toEqual(4)
    expect(
      restoredClient?.clientState.queries.find((q) => q.queryKey[0] === 'A'),
    ).toBeUndefined()
    expect(
      restoredClient?.clientState.queries.find((q) => q.queryKey[0] === 'B'),
    ).not.toBeUndefined()

    // update query Data
    await queryClient.prefetchQuery(['A'], () => Promise.resolve('a'.repeat(N)))
    const updatedPersistClient = {
      buster: 'test-limit',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    persister.persistClient(updatedPersistClient)
    await sleep(10)
    const restoredClient2 = await persister.restoreClient()
    expect(restoredClient2?.clientState.queries.length).toEqual(4)
    expect(
      restoredClient2?.clientState.queries.find((q) => q.queryKey[0] === 'A'),
    ).toHaveProperty('state.data', 'a'.repeat(N))
    expect(
      restoredClient2?.clientState.queries.find((q) => q.queryKey[0] === 'B'),
    ).toBeUndefined()
  })
  test('should clear storage as default error handling', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const N = 2000
    const storage = getMockStorage(0)
    const persister = createSyncStoragePersister({
      throttleTime: 0,
      storage,
      retry: removeOldestQuery,
    })

    await queryClient.prefetchQuery(['A'], () => Promise.resolve('A'.repeat(N)))
    await sleep(1)

    const persistClient = {
      buster: 'test-limit',
      timestamp: Date.now(),
      clientState: dehydrate(queryClient),
    }
    persister.persistClient(persistClient)
    await sleep(10)
    const restoredClient = await persister.restoreClient()
    expect(restoredClient).toEqual(undefined)
  })
})
