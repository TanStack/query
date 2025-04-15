import { render, waitFor } from '@testing-library/svelte'
import { describe, expect, test, vi } from 'vitest'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import AwaitOnSuccess from './AwaitOnSuccess/Provider.svelte'
import FreshData from './FreshData/Provider.svelte'
import OnSuccess from './OnSuccess/Provider.svelte'
import InitialData from './InitialData/Provider.svelte'
import RemoveCache from './RemoveCache/Provider.svelte'
import RestoreCache from './RestoreCache/Provider.svelte'
import UseQueries from './UseQueries/Provider.svelte'
import { StatelessRef, createQueryClient, sleep } from './utils.svelte'

import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import type { StatusResult } from './utils.svelte.js'

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    async persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      return Promise.resolve(storedState)
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
        return Promise.reject(error)
      },
      removeClient,
    },
  ]
}

describe('PersistQueryClientProvider', () => {
  test('restores cache from persister', async () => {
    let states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const rendered = render(RestoreCache, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    await waitFor(() => rendered.getByText('fetched'))

    expect(states.current).toHaveLength(3)

    expect(states.current[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states.current[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states.current[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test.only('should also put useQueries into idle state', async () => {
    let states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const rendered = render(UseQueries, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    await waitFor(() => rendered.getByText('fetchStatus: idle'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    expect(states.current).toHaveLength(3)

    expect(states.current[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states.current[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states.current[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should show initialData while restoring', async () => {
    let states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const rendered = render(InitialData, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    await waitFor(() => rendered.getByText('fetched'))
    console.log(states.current)

    expect(states.current).toHaveLength(3)

    expect(states.current[0]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'initial',
    })

    expect(states.current[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states.current[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should not refetch after restoring when data is fresh', async () => {
    let states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const rendered = render(FreshData, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    await waitFor(() => rendered.getByText('data: undefined'))
    await waitFor(() => rendered.getByText('data: hydrated'))
    await expect(
      waitFor(() => rendered.getByText('data: fetched'), {
        timeout: 100,
      }),
    ).rejects.toThrowError()

    expect(states.current).toHaveLength(2)

    expect(states.current[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states.current[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'hydrated',
    })
  })

  test('should call onSuccess after successful restoring', async () => {
    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const onSuccess = vi.fn()

    const rendered = render(OnSuccess, {
      props: {
        queryClient,
        persistOptions: { persister },
        onSuccess,
      },
    })

    expect(onSuccess).toHaveBeenCalledTimes(0)
    await waitFor(() => rendered.getByText('hydrated'))
    expect(onSuccess).toHaveBeenCalledTimes(1)
    await waitFor(() => rendered.getByText('fetched'))
  })

  test('should await onSuccess after successful restoring', async () => {
    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    let states = new StatelessRef<Array<string>>([])

    const rendered = render(AwaitOnSuccess, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
        onSuccess: async () => {
          states.current.push('onSuccess')
          await sleep(5)
          states.current.push('onSuccess done')
        },
      },
    })

    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    expect(states.current).toEqual([
      'onSuccess',
      'onSuccess done',
      'fetching',
      'fetched',
    ])
  })

  test('should remove cache after non-successful restoring', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    const queryClient = createQueryClient()
    const removeClient = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    const [error, persister] = createMockErrorPersister(removeClient)

    const rendered = render(RemoveCache, {
      props: { queryClient, persistOptions: { persister }, onError, onSuccess },
    })

    await waitFor(() => rendered.getByText('fetched'))
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenNthCalledWith(1, error)
    consoleMock.mockRestore()
    consoleWarn.mockRestore()
  })
})
