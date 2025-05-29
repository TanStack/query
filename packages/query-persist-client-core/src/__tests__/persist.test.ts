import { describe, expect, test, vi } from 'vitest'
import { QueriesObserver, QueryClient } from '@tanstack/query-core'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '../persist'
import { createMockPersister, createSpyPersister } from './utils'

describe('persistQueryClientSubscribe', () => {
  test('should persist mutations', async () => {
    const queryClient = new QueryClient()

    const persister = createMockPersister()

    const unsubscribe = persistQueryClientSubscribe({
      queryClient,
      persister,
      dehydrateOptions: { shouldDehydrateMutation: () => true },
    })

    queryClient.getMutationCache().create(queryClient, {
      mutationFn: (text: string) => Promise.resolve(text),
    })

    const result = await persister.restoreClient()

    expect(result?.clientState.mutations).toHaveLength(1)

    unsubscribe()
  })
})

describe('persistQueryClientSave', () => {
  test('should not be triggered on observer type events', () => {
    const queryClient = new QueryClient()

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
})

describe('persistQueryClientRestore', () => {
  test('should rethrow exceptions in `restoreClient`', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    const queryClient = new QueryClient()

    const restoreError = new Error('Error restoring client')

    const persister = createSpyPersister()

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

  test('should rethrow exceptions in `removeClient` before `restoreClient`', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    const queryClient = new QueryClient()

    const restoreError = new Error('Error restoring client')
    const removeError = new Error('Error removing client')

    const persister = createSpyPersister()

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

  test('should rethrow error in `removeClient`', async () => {
    const queryClient = new QueryClient()

    const persister = createSpyPersister()
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
})
