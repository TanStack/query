import { describe, expect, test, vi } from 'vitest'
import { Query, QueryCache, hashKey } from '@tanstack/query-core'
import {
  PERSISTER_KEY_PREFIX,
  experimental_createPersister,
} from '../createPersister'
import { sleep } from './utils'
import type { StoragePersisterOptions } from '../createPersister'
import type { QueryKey } from '@tanstack/query-core'

function getFreshStorage() {
  const storage = new Map()
  return {
    getItem: (key: string) => Promise.resolve(storage.get(key)),
    setItem: async (key: string, value: unknown) => {
      storage.set(key, value)
    },
    removeItem: async (key: string) => {
      storage.delete(key)
    },
  }
}

function setupPersister(
  queryKey: QueryKey,
  persisterOptions: StoragePersisterOptions,
) {
  const context = {
    meta: { foo: 'bar' },
    queryKey,
    // @ts-ignore
    signal: undefined as AbortSignal,
  }
  const queryHash = hashKey(queryKey)
  const storageKey = `${PERSISTER_KEY_PREFIX}-${queryHash}`

  const queryFn = vi.fn()

  const persisterFn = experimental_createPersister(persisterOptions)

  const query = new Query({
    cache: new QueryCache(),
    queryHash,
    queryKey,
  })

  return {
    context,
    persisterFn,
    query,
    queryFn,
    queryHash,
    queryKey,
    storageKey,
  }
}

describe('createPersister', () => {
  test('should fetch if storage is not provided', async () => {
    const { context, persisterFn, query, queryFn } = setupPersister(['foo'], {
      storage: undefined,
    })

    await persisterFn(queryFn, context, query)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should fetch if there is no stored data', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn } = setupPersister(['foo'], {
      storage,
    })

    await persisterFn(queryFn, context, query)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should fetch if query already has data', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn } = setupPersister(['foo'], {
      storage,
    })
    query.state.data = 'baz'

    await persisterFn(queryFn, context, query)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should fetch if deserialization fails', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
      },
    )

    await storage.setItem(storageKey, '{invalid[item')

    await persisterFn(queryFn, context, query)

    expect(await storage.getItem(storageKey)).toBeUndefined()

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should remove stored item if `dataUpdatedAt` is empty', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
      },
    )

    await storage.setItem(
      storageKey,
      JSON.stringify({
        buster: '',
        state: { dataUpdatedAt: undefined },
      }),
    )

    await persisterFn(queryFn, context, query)

    expect(await storage.getItem(storageKey)).toBeUndefined()

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should remove stored item if its expired', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
        maxAge: 100,
      },
    )

    await storage.setItem(
      storageKey,
      JSON.stringify({
        buster: '',
        state: { dataUpdatedAt: Date.now() - 200 },
      }),
    )

    await persisterFn(queryFn, context, query)

    expect(await storage.getItem(storageKey)).toBeUndefined()

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should remove stored item if its busted', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
      },
    )

    await storage.setItem(
      storageKey,
      JSON.stringify({
        buster: 'bust',
        state: { dataUpdatedAt: Date.now() },
      }),
    )

    await persisterFn(queryFn, context, query)

    expect(await storage.getItem(storageKey)).toBeUndefined()

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)
  })

  test('should restore item from the storage and set proper `updatedAt` values', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
      },
    )

    const dataUpdatedAt = Date.now()

    await storage.setItem(
      storageKey,
      JSON.stringify({
        buster: '',
        state: { dataUpdatedAt },
      }),
    )

    await persisterFn(queryFn, context, query)
    query.state.dataUpdatedAt = 0
    query.fetch = vi.fn()
    expect(query.state.dataUpdatedAt).toEqual(0)

    await sleep(0)

    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(query.fetch).toHaveBeenCalledTimes(0)
    expect(query.state.dataUpdatedAt).toEqual(dataUpdatedAt)
  })

  test('should restore item from the storage and refetch when `stale`', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
      },
    )

    await storage.setItem(
      storageKey,
      JSON.stringify({
        buster: '',
        state: { dataUpdatedAt: Date.now() },
      }),
    )

    await persisterFn(queryFn, context, query)
    query.state.isInvalidated = true
    query.fetch = vi.fn()

    await sleep(0)

    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(query.fetch).toHaveBeenCalledTimes(1)
  })

  test('should store item after successfull fetch', async () => {
    const storage = getFreshStorage()
    const {
      context,
      persisterFn,
      query,
      queryFn,
      queryHash,
      queryKey,
      storageKey,
    } = setupPersister(['foo'], {
      storage,
    })

    await persisterFn(queryFn, context, query)
    query.setData('baz')

    await sleep(0)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith(context)

    expect(JSON.parse(await storage.getItem(storageKey))).toMatchObject({
      buster: '',
      queryHash,
      queryKey,
      state: {
        data: 'baz',
      },
    })
  })

  test('should skip stored item if not matched by filters', async () => {
    const storage = getFreshStorage()
    const { context, persisterFn, query, queryFn, storageKey } = setupPersister(
      ['foo'],
      {
        storage,
        filters: {
          predicate: () => {
            return false
          },
        },
      },
    )

    const dataUpdatedAt = Date.now()

    await storage.setItem(
      storageKey,
      JSON.stringify({
        buster: '',
        state: { dataUpdatedAt },
      }),
    )

    await persisterFn(queryFn, context, query)
    query.fetch = vi.fn()

    await sleep(0)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(query.fetch).toHaveBeenCalledTimes(0)
  })
})
