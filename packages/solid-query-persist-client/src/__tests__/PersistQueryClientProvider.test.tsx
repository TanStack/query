import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { QueryClient, useQueries, useQuery } from '@tanstack/solid-query'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { createEffect, createSignal, onMount } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { PersistQueryClientProvider } from '../PersistQueryClientProvider'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'

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
        await sleep(10)
        throw error
      },
      removeClient,
    },
  ]
}

describe('PersistQueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('restores cache from persister', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))
      createEffect(() =>
        states.push({
          status: state.status,
          fetchStatus: state.fetchStatus,
          data: state.data,
        }),
      )

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>
    ))

    expect(screen.getByText('fetchStatus: idle')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()

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

  test('should also put useQueries into idle state', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    function Page() {
      const [state] = useQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'fetched'),
          },
        ],
      }))

      createEffect(() =>
        states.push({
          status: state.status,
          fetchStatus: state.fetchStatus,
          data: state.data,
        }),
      )

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>
    ))

    expect(screen.getByText('fetchStatus: idle')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()

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

  test('should show initialData while restoring', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
        initialData: 'initial',
        // make sure that initial data is older than the hydration data
        // otherwise initialData would be newer and takes precedence
        initialDataUpdatedAt: 1,
      }))

      createEffect(() =>
        states.push({
          status: state.status,
          fetchStatus: state.fetchStatus,
          data: state.data,
        }),
      )

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>
    ))

    expect(screen.getByText('initial')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()

    expect(states).toHaveLength(3)

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
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should not refetch after restoring when data is fresh', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    let fetched = false

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            fetched = true
            return 'fetched'
          }),
        staleTime: Infinity,
      }))

      createEffect(() =>
        states.push({
          status: state.status,
          fetchStatus: state.fetchStatus,
          data: state.data,
        }),
      )

      return (
        <div>
          <h1>data: {state.data ?? 'null'}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>
    ))

    expect(screen.getByText('data: null')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('data: hydrated')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('data: hydrated')).toBeInTheDocument()

    expect(fetched).toBe(false)

    expect(states).toHaveLength(2)

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
    const key = queryKey()

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const onSuccess = vi.fn()

    render(() => (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
        onSuccess={onSuccess}
      >
        <Page />
      </PersistQueryClientProvider>
    ))

    expect(onSuccess).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()
  })

  test('should remove cache after non-successful restoring', async () => {
    const key = queryKey()

    const onErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const queryClient = new QueryClient()
    const removeClient = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    const [error, persister] = createMockErrorPersister(removeClient)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
        onSuccess={onSuccess}
        onError={onError}
      >
        <Page />
      </PersistQueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)
    expect(onError).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()

    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock).toHaveBeenNthCalledWith(1, error)
    onErrorMock.mockRestore()
  })

  test('should be able to persist into multiple clients', async () => {
    const key = queryKey()
    const states: Array<{
      status: string
      fetchStatus: string
      data: string | undefined
    }> = []

    const queryClient = new QueryClient()
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'hydrated'),
    })
    await vi.advanceTimersByTimeAsync(10)

    const persister = createMockPersister()

    persistQueryClientSave({ queryClient, persister })
    await vi.advanceTimersByTimeAsync(0)

    queryClient.clear()

    const onSuccess = vi.fn()

    const queryFn1 = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'queryFn1'))
    const queryFn2 = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'queryFn2'))

    function App() {
      const [client, setClient] = createSignal(
        new QueryClient({
          defaultOptions: {
            queries: {
              queryFn: queryFn1,
            },
          },
        }),
      )

      onMount(() => {
        setClient(
          new QueryClient({
            defaultOptions: {
              queries: {
                queryFn: queryFn2,
              },
            },
          }),
        )
      })

      return (
        <PersistQueryClientProvider
          client={client()}
          persistOptions={{ persister }}
          onSuccess={onSuccess}
        >
          <Page />
        </PersistQueryClientProvider>
      )
    }

    function Page() {
      const state = useQuery(() => ({ queryKey: key }))

      createEffect(() =>
        states.push({
          status: state.status,
          fetchStatus: state.fetchStatus,
          data: state.data as string | undefined,
        }),
      )

      return (
        <div>
          <h1>{String(state.data)}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => <App />)

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('queryFn2')).toBeInTheDocument()

    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(1)

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
      data: 'queryFn2',
    })
  })
})
