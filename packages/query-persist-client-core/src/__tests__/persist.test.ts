import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MutationObserver,
  QueriesObserver,
  QueryClient,
  dehydrate,
} from '@tanstack/query-core'
import {
  persistQueryClient,
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '../persist'
import { createMockPersister, createSpyPersister } from './utils'

describe('persist', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('persistQueryClientSubscribe', () => {
    it('should persist mutations', async () => {
      const persister = createMockPersister()

      const unsubscribe = persistQueryClientSubscribe({
        queryClient,
        persister,
        dehydrateOptions: { shouldDehydrateMutation: () => true },
      })

      queryClient.getMutationCache().build(queryClient, {
        mutationFn: (text: string) => Promise.resolve(text),
      })

      const result = await persister.restoreClient()

      expect(result?.clientState.mutations).toHaveLength(1)

      unsubscribe()
    })
  })

  describe('persistQueryClientSave', () => {
    it('should not be triggered on observer type events', () => {
      const persister = createSpyPersister()

      const unsubscribe = persistQueryClientSubscribe({
        queryClient,
        persister,
      })

      const queryKey = ['test']
      const queryFn = vi.fn().mockReturnValue(1)
      const observer = new QueriesObserver(queryClient, [{ queryKey, queryFn }])
      const unsubscribeObserver = observer.subscribe(vi.fn())
      observer
        .getObservers()[0]
        ?.setOptions({ queryKey, refetchOnWindowFocus: false })
      unsubscribeObserver()

      queryClient.setQueryData(queryKey, 2)

      // persistClient should be called 3 times:
      // 1. When query is added
      // 2. When queryFn is resolved
      // 3. When setQueryData is called
      // All events fired by manipulating observers are ignored
      expect(persister.persistClient).toHaveBeenCalledTimes(3)

      unsubscribe()
    })

    it('should not be triggered on mutation observer type events', () => {
      const persister = createSpyPersister()

      const unsubscribe = persistQueryClientSubscribe({
        queryClient,
        persister,
      })

      const observer = new MutationObserver(queryClient, {
        mutationFn: () => Promise.resolve('data'),
      })
      const unsubscribeObserver = observer.subscribe(vi.fn())
      observer.setOptions({ mutationKey: ['test'] })
      unsubscribeObserver()

      // Events fired by manipulating the mutation observer are not cache
      // events, so they must not trigger a persist.
      expect(persister.persistClient).not.toHaveBeenCalled()

      unsubscribe()
    })
  })

  describe('persistQueryClientRestore', () => {
    let persister: ReturnType<typeof createSpyPersister>

    beforeEach(() => {
      persister = createSpyPersister()
    })

    it('should rethrow exceptions in `restoreClient`', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined)

      const restoreError = new Error('Error restoring client')

      persister.restoreClient = () => Promise.reject(restoreError)

      await expect(
        persistQueryClientRestore({
          queryClient,
          persister,
        }),
      ).rejects.toBe(restoreError)

      expect(consoleMock).toHaveBeenCalledTimes(1)
      expect(consoleWarn).toHaveBeenCalledTimes(1)
      expect(consoleMock).toHaveBeenNthCalledWith(1, restoreError)

      consoleMock.mockRestore()
      consoleWarn.mockRestore()
    })

    it('should rethrow exceptions in `removeClient` before `restoreClient`', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined)

      const restoreError = new Error('Error restoring client')
      const removeError = new Error('Error removing client')

      persister.restoreClient = () => Promise.reject(restoreError)
      persister.removeClient = () => Promise.reject(removeError)

      await expect(
        persistQueryClientRestore({
          queryClient,
          persister,
        }),
      ).rejects.toBe(removeError)

      expect(consoleMock).toHaveBeenCalledTimes(1)
      expect(consoleWarn).toHaveBeenCalledTimes(1)
      expect(consoleMock).toHaveBeenNthCalledWith(1, restoreError)

      consoleMock.mockRestore()
      consoleWarn.mockRestore()
    })

    it('should rethrow error in `removeClient`', async () => {
      const removeError = new Error('Error removing client')

      persister.removeClient = () => Promise.reject(removeError)
      persister.restoreClient = () => {
        return Promise.resolve({
          buster: 'random-buster',
          clientState: {
            mutations: [],
            queries: [],
          },
          timestamp: new Date().getTime(),
        })
      }

      await expect(
        persistQueryClientRestore({
          queryClient,
          persister,
        }),
      ).rejects.toBe(removeError)
    })

    it('should hydrate the query client when the persisted cache is valid', async () => {
      const sourceClient = new QueryClient()
      sourceClient.setQueryData(['key'], 'data')

      persister.restoreClient = () =>
        Promise.resolve({
          buster: '',
          clientState: dehydrate(sourceClient),
          timestamp: Date.now(),
        })

      await persistQueryClientRestore({
        queryClient,
        persister,
      })

      expect(persister.removeClient).not.toHaveBeenCalled()
      expect(queryClient.getQueryData(['key'])).toBe('data')
    })

    it('should remove the client when the persisted cache is expired', async () => {
      persister.restoreClient = () =>
        Promise.resolve({
          buster: '',
          clientState: { mutations: [], queries: [] },
          timestamp: Date.now() - 1000,
        })

      await persistQueryClientRestore({
        queryClient,
        persister,
        maxAge: 100,
      })

      expect(persister.removeClient).toHaveBeenCalledTimes(1)
    })

    it('should remove the client when the buster does not match', async () => {
      persister.restoreClient = () =>
        Promise.resolve({
          buster: 'old-buster',
          clientState: { mutations: [], queries: [] },
          timestamp: Date.now(),
        })

      await persistQueryClientRestore({
        queryClient,
        persister,
        buster: 'new-buster',
      })

      expect(persister.removeClient).toHaveBeenCalledTimes(1)
    })

    it('should remove the client when the persisted cache has no timestamp', async () => {
      persister.restoreClient = () =>
        Promise.resolve({
          buster: '',
          clientState: { mutations: [], queries: [] },
          timestamp: 0,
        })

      await persistQueryClientRestore({
        queryClient,
        persister,
      })

      expect(persister.removeClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('persistQueryClient', () => {
    it('should subscribe to the query cache after a successful restore', async () => {
      const persister = createSpyPersister()
      persister.restoreClient = () => Promise.resolve(undefined)

      const [unsubscribe, restorePromise] = persistQueryClient({
        queryClient,
        persister,
      })
      await restorePromise

      queryClient.setQueryData(['key'], 'data')

      expect(persister.persistClient).toHaveBeenCalled()

      unsubscribe()
    })

    it('should not subscribe when unsubscribed before the restore completes', async () => {
      const persister = createSpyPersister()
      let resolveRestore: () => void
      persister.restoreClient = () =>
        new Promise((resolve) => {
          resolveRestore = () => resolve(undefined)
        })

      const [unsubscribe, restorePromise] = persistQueryClient({
        queryClient,
        persister,
      })
      // Unsubscribe before the restore resolves
      unsubscribe()
      resolveRestore!()
      await restorePromise

      queryClient.setQueryData(['key'], 'data')

      expect(persister.persistClient).not.toHaveBeenCalled()
    })
  })
})
