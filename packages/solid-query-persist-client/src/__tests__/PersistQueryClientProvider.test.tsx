// Ported to the 2.0-native read layer: `data` is an async computation, so a
// query with nothing cached suspends into <Loading> for the whole restore
// window instead of rendering a pending snapshot. These tests assert the
// user-visible transitions (fallback -> restored value -> refreshed value)
// and the fetch/callback bookkeeping around them; the pre-rewrite suite
// snapshotted observer result objects on every notification, which the
// rewrite no longer produces.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import { QueryClient, useQueries, useQuery } from '@tanstack/solid-query'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { Loading, createSignal } from 'solid-js'
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

/**
 * Seeds a persister with a settled `'hydrated'` entry for `key` and hands
 * back an empty client to restore it into.
 */
async function setup() {
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

  return { key, queryClient, persister }
}

describe('PersistQueryClientProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restores cache from persister', async () => {
    const { key, queryClient, persister } = await setup()

    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'fetched'))

    function Page() {
      const state = useQuery(() => ({ queryKey: key, queryFn }))

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <Loading fallback={<span>loading</span>}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <Page />
        </PersistQueryClientProvider>
      </Loading>
    ))

    // Nothing is cached yet and no fetch may start while restoring, so the
    // read has nothing to settle on and the boundary holds.
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(0)

    // The restored entry lands, the boundary resolves, and the now-stale
    // query refetches in the background.
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()
    expect(screen.getByText('fetchStatus: idle')).toBeInTheDocument()
  })

  it('should also put useQueries into idle state', async () => {
    const { key, queryClient, persister } = await setup()

    const queryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'fetched'))

    function Page() {
      const [state] = useQueries(() => ({
        queries: [{ queryKey: key, queryFn }],
      }))

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <Loading fallback={<span>loading</span>}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <Page />
        </PersistQueryClientProvider>
      </Loading>
    ))

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()
    expect(screen.getByText('fetchStatus: idle')).toBeInTheDocument()
  })

  it('should show initialData while restoring', async () => {
    const { key, queryClient, persister } = await setup()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
        initialData: 'initial',
        // make sure that initial data is older than the hydration data
        // otherwise initialData would be newer and takes precedence
        initialDataUpdatedAt: 1,
      }))

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <Loading fallback={<span>loading</span>}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <Page />
        </PersistQueryClientProvider>
      </Loading>
    ))

    // `initialData` settles the read synchronously, so the boundary never
    // falls back — this is the one restore path that renders content at t=0.
    expect(screen.getByText('initial')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()
  })

  it('should not refetch after restoring when data is fresh', async () => {
    const { key, queryClient, persister } = await setup()

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

      return (
        <div>
          <h1>data: {state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <Loading fallback={<span>loading</span>}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <Page />
        </PersistQueryClientProvider>
      </Loading>
    ))

    expect(screen.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('data: hydrated')).toBeInTheDocument()

    // Restored data is fresh forever, so the mount policy leaves it alone.
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('data: hydrated')).toBeInTheDocument()
    expect(screen.getByText('fetchStatus: idle')).toBeInTheDocument()
    expect(fetched).toBe(false)
  })

  it('should call onSuccess after successful restoring', async () => {
    const { key, queryClient, persister } = await setup()

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
      <Loading>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
          onSuccess={onSuccess}
        >
          <Page />
        </PersistQueryClientProvider>
      </Loading>
    ))

    expect(onSuccess).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('hydrated')).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(screen.getByText('fetched')).toBeInTheDocument()
  })

  it('should remove cache after non-successful restoring', async () => {
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
      <Loading>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
          onSuccess={onSuccess}
          onError={onError}
        >
          <Page />
        </PersistQueryClientProvider>
      </Loading>
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

  it('should be able to persist into multiple clients', async () => {
    const { key, persister } = await setup()

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

      queueMicrotask(() => {
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

      return (
        <div>
          <h1>{String(state.data)}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    render(() => (
      <Loading fallback={<span>loading</span>}>
        <App />
      </Loading>
    ))

    // The read follows the reactive client accessor, so it is already
    // pointed at the second client before the restore lands. The restore
    // still runs exactly once, against the client the provider started
    // with, so the swapped-in client fetches its own value.
    await vi.advanceTimersByTimeAsync(20)
    expect(screen.getByText('queryFn2')).toBeInTheDocument()
    expect(screen.getByText('fetchStatus: idle')).toBeInTheDocument()

    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
