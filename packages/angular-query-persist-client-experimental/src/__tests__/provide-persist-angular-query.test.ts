import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { describe, expect, test } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { effect } from '@angular/core'
import { providePersistAngularQuery } from '../provide-persist-angular-query'
import { createQueryClient, queryKey } from './utils'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    async persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      await sleep(10)
      return storedState
    },
    removeClient() {
      storedState = undefined
    },
  }
}

const createMockErrorPersister = (
  removeClient: Persister['removeClient'],
): [Error, Persister] => {
  const error = new Error('restore failed')
  return [
    error,
    {
      async persistClient() {
        // noop
      },
      async restoreClient() {
        await sleep(10)
        throw error
      },
      removeClient,
    },
  ]
}

describe('providePersistAngularQuery', () => {
  test('restores cache from persister', async () => {
    const key = queryKey()
    const queryClient = createQueryClient()
    const persister = createMockPersister()

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    TestBed.configureTestingModule({
      providers: [providePersistAngularQuery(queryClient, [{ persister }])],
    })

    const states = TestBed.runInInjectionContext(() => {
      const query = injectQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      }))
      const _states: Array<{
        status: string
        fetchStatus: string
        data: string | undefined
      }> = []

      effect(() => {
        _states.push({
          status: query.status(),
          fetchStatus: query.fetchStatus(),
          data: query.data(),
        })
      })

      return _states
    })

    await sleep(30)

    expect(states).toHaveLength(3)

    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test.todo('should also put useQueries into idle state', async () => {})

  test.todo('should show initialData while restoring', async () => {})

  test.todo(
    'should not refetch after restoring when data is fresh',
    async () => {},
  )

  test.todo('should call onSuccess after successful restoring', async () => {})

  test.todo(
    'should remove cache after non-successful restoring',
    async () => {},
  )

  test.todo('should be able to persist into multiple clients', async () => {})
})
