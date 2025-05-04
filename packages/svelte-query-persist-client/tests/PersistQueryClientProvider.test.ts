import { render, waitFor } from '@testing-library/svelte'
import { describe, expect, test, vi } from 'vitest'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { get, writable } from 'svelte/store'
import AwaitOnSuccess from './AwaitOnSuccess/Provider.svelte'
import FreshData from './FreshData/Provider.svelte'
import OnSuccess from './OnSuccess/Provider.svelte'
import InitialData from './InitialData/Provider.svelte'
import RemoveCache from './RemoveCache/Provider.svelte'
import RestoreCache from './RestoreCache/Provider.svelte'
import UseQueries from './UseQueries/Provider.svelte'
import { createQueryClient, sleep } from './utils.js'

import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import type { Writable } from 'svelte/store'
import type { StatusResult } from './utils.js'

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      await sleep(5)
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
        await sleep(5)
        throw error
      },
      removeClient,
    },
  ]
}

describe('PersistQueryClientProvider', () => {
  test('restores cache from persister', async () => {
    const statesStore: Writable<Array<StatusResult<string>>> = writable([])

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
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('fetchStatus: idle'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    const states = get(statesStore)
    expect(states).toHaveLength(5)

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
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[3]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[4]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should also put useQueries into idle state', async () => {
    const statesStore: Writable<Array<StatusResult<string>>> = writable([])

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
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('fetchStatus: idle'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    const states = get(statesStore)

    expect(states).toHaveLength(5)

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
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[3]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[4]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should show initialData while restoring', async () => {
    const statesStore: Writable<Array<StatusResult<string>>> = writable([])

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
        states: statesStore,
      },
    })

    await waitFor(() => rendered.getByText('initial'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    const states = get(statesStore)
    expect(states).toHaveLength(5)

    expect(states[0]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'initial',
    })

    expect(states[1]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[2]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[3]).toMatchObject({
      status: 'success',
      fetchStatus: 'fetching',
      data: 'hydrated',
    })

    expect(states[4]).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should not refetch after restoring when data is fresh', async () => {
    const statesStore: Writable<Array<StatusResult<string>>> = writable([])

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const fetched = writable(false)

    const rendered = render(FreshData, {
      props: {
        queryClient,
        persistOptions: { persister },
        states: statesStore,
        fetched,
      },
    })

    await waitFor(() => rendered.getByText('data: undefined'))
    await waitFor(() => rendered.getByText('data: hydrated'))

    const states = get(statesStore)
    expect(states).toHaveLength(2)

    expect(get(fetched)).toBe(false)

    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states[1]).toMatchObject({
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

    const statesStore: Writable<Array<string>> = writable([])

    const rendered = render(AwaitOnSuccess, {
      props: {
        queryClient,
        persistOptions: { persister },
        states: statesStore,
        onSuccess: async () => {
          statesStore.update((s) => [...s, 'onSuccess'])
          await sleep(20)
          statesStore.update((s) => [...s, 'onSuccess done'])
        },
      },
    })

    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    const states = get(statesStore)

    expect(states).toEqual([
      'onSuccess',
      'onSuccess done',
      'fetching',
      'fetched',
    ])
  })

  test('should remove cache after non-successful restoring', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    consoleMock.mockImplementation(() => undefined)

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
