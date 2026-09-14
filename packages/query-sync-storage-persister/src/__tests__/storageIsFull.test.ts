import { describe, expect, it } from 'vitest'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  dehydrate,
  noop,
} from '@tanstack/query-core'
import { removeOldestQuery } from '@tanstack/query-persist-client-core'
import { sleep } from '@tanstack/query-test-utils'
import { createSyncStoragePersister } from '../index'

function getMockStorage(limitSize?: number) {
  const dataSet = new Map<string, string>()
  return {
    getItem(key: string): string | null {
      const value = dataSet.get(key)
      return value === undefined ? null : value
    },

    setItem(key: string, value: string) {
      if (limitSize !== undefined) {
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

describe('create persister', () => {
  it('basic store and recover', async () => {
    const queryCache = new QueryCache()
    const mutationCache = new MutationCache()
    const queryClient = new QueryClient({ queryCache, mutationCache })

    const storage = getMockStorage()
    const persister = createSyncStoragePersister({
      throttleTime: 0,
      storage,
    })

    await queryClient
      .query({
        queryKey: ['string'],
        queryFn: () => Promise.resolve('string'),
      })
      .catch(noop)
    await queryClient
      .query({
        queryKey: ['number'],
        queryFn: () => Promise.resolve(1),
      })
      .catch(noop)
    await queryClient
      .query({
        queryKey: ['boolean'],
        queryFn: () => Promise.resolve(true),
      })
      .catch(noop)
    await queryClient
      .query({
        queryKey: ['null'],
        queryFn: () => Promise.resolve(null),
      })
      .catch(noop)
    await queryClient
      .query({
        queryKey: ['array'],
        queryFn: () => Promise.resolve(['string', 0]),
      })
      .catch(noop)

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

  it('should clean the old queries when storage full', async () => {
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

    await queryClient
      .query({
        queryKey: ['A'],
        queryFn: () => Promise.resolve('A'.repeat(N)),
      })
      .catch(noop)
    await sleep(1)
    await queryClient
      .query({
        queryKey: ['B'],
        queryFn: () => Promise.resolve('B'.repeat(N)),
      })
      .catch(noop)
    await sleep(1)
    await queryClient
      .query({
        queryKey: ['C'],
        queryFn: () => Promise.resolve('C'.repeat(N)),
      })
      .catch(noop)
    await sleep(1)
    await queryClient
      .query({
        queryKey: ['D'],
        queryFn: () => Promise.resolve('D'.repeat(N)),
      })
      .catch(noop)

    await sleep(1)
    await queryClient
      .query({
        queryKey: ['E'],
        queryFn: () => Promise.resolve('E'.repeat(N)),
      })
      .catch(noop)

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
    await queryClient
      .query({
        queryKey: ['A'],
        queryFn: () => Promise.resolve('a'.repeat(N)),
      })
      .catch(noop)
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
  it('should clear storage as default error handling', async () => {
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

    await queryClient
      .query({
        queryKey: ['A'],
        queryFn: () => Promise.resolve('A'.repeat(N)),
      })
      .catch(noop)
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
