import { render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, noop } from '@tanstack/svelte-query'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { sleep } from '@tanstack/query-test-utils'
import AwaitOnSuccess from './AwaitOnSuccess/Provider.svelte'
import FreshData from './FreshData/Provider.svelte'
import OnSuccess from './OnSuccess/Provider.svelte'
import InitialData from './InitialData/Provider.svelte'
import RemoveCache from './RemoveCache/Provider.svelte'
import RestoreCache from './RestoreCache/Provider.svelte'
import UseQueries from './UseQueries/Provider.svelte'
import BroadcastQueryClientProvider from './BroadcastQueryClientProvider/Provider.svelte'
import { StatelessRef } from './utils.svelte.js'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import type { StatusResult } from './utils.svelte.js'

const mockBroadcastState = vi.hoisted(() => {
  let resolveRestore: (() => void) | undefined

  return {
    resolveRestore: () => resolveRestore?.(),
    restore: vi.fn(() => {
      const restorePromise = new Promise<void>((resolve) => {
        resolveRestore = resolve
      })
      return [vi.fn(), restorePromise] as const
    }),
  }
})

vi.mock('@tanstack/query-broadcast-client-experimental', () => ({
  broadcastQueryClientRestore: mockBroadcastState.restore,
}))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      return sleep(10).then(() => storedState)
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
        return sleep(10).then(() => Promise.reject(error))
      },
      removeClient,
    },
  ]
}

describe('PersistQueryClientProvider', () => {
  it('restores cache from persister', async () => {
    const states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: ['test'],
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    const rendered = render(RestoreCache, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()

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

  it('should also put useQueries into idle state', async () => {
    const states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: ['test'],
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    const rendered = render(UseQueries, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()

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

  it('should show initialData while restoring', async () => {
    const states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: ['test'],
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    const rendered = render(InitialData, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
      },
    })

    expect(rendered.getByText('initial')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()

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

  it('should not refetch after restoring when data is fresh', async () => {
    const states = new StatelessRef<Array<StatusResult<string>>>([])

    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: ['test'],
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    let fetched = false

    const rendered = render(FreshData, {
      props: {
        queryClient,
        persistOptions: { persister },
        states,
        onFetch: () => {
          fetched = true
        },
      },
    })

    expect(rendered.getByText('data: null')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: hydrated')).toBeInTheDocument()

    expect(states.current).toHaveLength(2)

    expect(fetched).toBe(false)

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

  it('BroadcastQueryClientProvider holds a fresh query until bootstrap completes', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['broadcast-bootstrap'], 'from-cache')
    const onFetch = vi.fn()

    const rendered = render(BroadcastQueryClientProvider, {
      props: { queryClient, onFetch },
    })

    expect(rendered.getByText('from-cache')).toBeInTheDocument()
    expect(onFetch).not.toHaveBeenCalled()
    expect(mockBroadcastState.restore).toHaveBeenCalledWith({
      broadcastChannel: 'test-channel',
      queryClient,
    })

    mockBroadcastState.resolveRestore()
    await Promise.resolve()

    expect(rendered.getByText('from-cache')).toBeInTheDocument()
    expect(onFetch).not.toHaveBeenCalled()

    rendered.unmount()
  })

  it('BroadcastQueryClientProvider refetches a stale query after bootstrap completes', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['broadcast-bootstrap'], 'stale', {
      updatedAt: 0,
    })
    const onFetch = vi.fn()

    const rendered = render(BroadcastQueryClientProvider, {
      props: { queryClient, onFetch, staleTime: 0 },
    })

    expect(onFetch).not.toHaveBeenCalled()
    mockBroadcastState.resolveRestore()
    await tick()
    await tick()

    expect(onFetch).toHaveBeenCalledOnce()
    rendered.unmount()
  })

  it('should call onSuccess after successful restoring', async () => {
    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: ['test'],
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

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
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()
  })

  it('should await onSuccess after successful restoring', async () => {
    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: ['test'],
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    const states = new StatelessRef<Array<string>>([])

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

    await vi.advanceTimersByTimeAsync(15)
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()

    expect(states.current).toEqual([
      'onSuccess',
      'onSuccess done',
      'fetching',
      'fetched',
    ])
  })

  it('should remove cache after non-successful restoring', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    const queryClient = new QueryClient()
    const removeClient = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    const [error, persister] = createMockErrorPersister(removeClient)

    const rendered = render(RemoveCache, {
      props: { queryClient, persistOptions: { persister }, onError, onSuccess },
    })

    await vi.advanceTimersByTimeAsync(10)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenNthCalledWith(1, error)
    consoleMock.mockRestore()
    consoleWarn.mockRestore()
  })
})
