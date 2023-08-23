import * as React from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { QueryClient, useQueries, useQuery } from '@tanstack/react-query'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'

import { PersistQueryClientProvider } from '../PersistQueryClientProvider'
import { createQueryClient, queryKey, sleep } from './utils'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import type {
  DefinedUseQueryResult,
  UseQueryResult,
} from '@tanstack/react-query'

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

describe('PersistQueryClientProvider', () => {
  test('restores cache from persister', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      })

      states.push(state)

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('fetchStatus: idle'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    expect(states).toHaveLength(4)

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
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should also put useQueries into idle state', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult> = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const [state] = useQueries({
        queries: [
          {
            queryKey: key,
            queryFn: async (): Promise<string> => {
              await sleep(10)
              return 'fetched'
            },
          },
        ],
      })

      states.push(state)

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('fetchStatus: idle'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    expect(states).toHaveLength(4)

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
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should show initialData while restoring', async () => {
    const key = queryKey()
    const states: Array<DefinedUseQueryResult<string>> = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },

        initialData: 'initial',
        // make sure that initial data is older than the hydration data
        // otherwise initialData would be newer and takes precedence
        initialDataUpdatedAt: 1,
      })

      states.push(state)

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('initial'))
    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))

    expect(states).toHaveLength(4)

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
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })

  test('should not refetch after restoring when data is fresh', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    let fetched = false

    function Page() {
      const state = useQuery({
        queryKey: key,
        queryFn: async () => {
          fetched = true
          await sleep(10)
          return 'fetched'
        },

        staleTime: Infinity,
      })

      states.push(state)

      return (
        <div>
          <h1>data: {state.data ?? 'null'}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('data: null'))
    await waitFor(() => rendered.getByText('data: hydrated'))

    expect(states).toHaveLength(2)

    expect(fetched).toBe(false)

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

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      })

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const onSuccess = vi.fn()

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
        onSuccess={onSuccess}
      >
        <Page />
      </PersistQueryClientProvider>,
    )
    expect(onSuccess).toHaveBeenCalledTimes(0)

    await waitFor(() => rendered.getByText('hydrated'))
    expect(onSuccess).toHaveBeenCalledTimes(1)
    await waitFor(() => rendered.getByText('fetched'))
  })

  test('should await onSuccess after successful restoring', async () => {
    const key = queryKey()

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const states: Array<string> = []

    function Page() {
      const { data, fetchStatus } = useQuery({
        queryKey: key,
        queryFn: async () => {
          states.push('fetching')
          await sleep(10)
          states.push('fetched')
          return 'fetched'
        },
      })

      return (
        <div>
          <h1>{data}</h1>
          <h2>fetchStatus: {fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
        onSuccess={async () => {
          states.push('onSuccess')
          await sleep(20)
          states.push('onSuccess done')
        }}
      >
        <Page />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('fetched'))
    expect(states).toEqual([
      'onSuccess',
      'onSuccess done',
      'fetching',
      'fetched',
    ])
  })

  test('should remove cache after non-successful restoring', async () => {
    const key = queryKey()
    const consoleMock = vi.spyOn(console, 'error')
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    consoleMock.mockImplementation(() => undefined)

    const queryClient = createQueryClient()
    const removeClient = vi.fn()

    const [error, persister] = createMockErrorPersister(removeClient)

    function Page() {
      const state = useQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          return 'fetched'
        },
      })

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Page />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => rendered.getByText('fetched'))
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenNthCalledWith(1, error)
    consoleMock.mockRestore()
    consoleWarn.mockRestore()
  })

  test('should be able to persist into multiple clients', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult> = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('hydrated'),
    })

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const onSuccess = vi.fn()

    const queryFn1 = vi.fn().mockImplementation(async () => {
      await sleep(10)
      return 'queryFn1'
    })
    const queryFn2 = vi.fn().mockImplementation(async () => {
      await sleep(10)
      return 'queryFn2'
    })

    function App() {
      const [client, setClient] = React.useState(
        () =>
          new QueryClient({
            defaultOptions: {
              queries: {
                queryFn: queryFn1,
              },
            },
          }),
      )

      React.useEffect(() => {
        setClient(
          new QueryClient({
            defaultOptions: {
              queries: {
                queryFn: queryFn2,
              },
            },
          }),
        )
      }, [])

      return (
        <PersistQueryClientProvider
          client={client}
          persistOptions={{ persister }}
          onSuccess={onSuccess}
        >
          <Page />
        </PersistQueryClientProvider>
      )
    }

    function Page() {
      const state = useQuery({ queryKey: key })

      states.push(state)

      return (
        <div>
          <h1>{String(state.data)}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const rendered = render(<App />)

    await waitFor(() => rendered.getByText('hydrated'))
    await waitFor(() => rendered.getByText('queryFn2'))

    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(1)

    expect(states).toHaveLength(5)

    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(states[1]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
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
      data: 'queryFn2',
    })
  })
})
