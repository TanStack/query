import '@testing-library/jest-dom'

import { render, screen, waitFor } from 'solid-testing-library'
import { QueryClient, createQueries, createQuery } from '@tanstack/solid-query'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { createEffect, createSignal, on, onMount } from 'solid-js'

import { PersistQueryClientProvider } from '../PersistQueryClientProvider'
import { createQueryClient, mockLogger, queryKey, sleep } from './utils'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'

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
    const states: {
      status: string
      fetchStatus: string
      data: string | undefined
    }[] = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery(key(), () => Promise.resolve('hydrated'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = createQuery(key, async () => {
        await sleep(10)
        return 'fetched'
      })

      createEffect(
        on(
          [() => state.status, () => state.fetchStatus, () => state.data],
          () =>
            states.push({
              status: state.status,
              fetchStatus: state.fetchStatus,
              data: state.data,
            }),
        ),
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

    await waitFor(() => screen.getByText('fetchStatus: idle'))
    await waitFor(() => screen.getByText('hydrated'))
    await waitFor(() => screen.getByText('fetched'))

    expect(states).toHaveLength(3)

    expect(states[0]).toMatchObject({
      status: 'loading',
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
    const states: {
      status: string
      fetchStatus: string
      data: string | undefined
    }[] = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery(key(), () => Promise.resolve('hydrated'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const [state] = createQueries({
        queries: [
          {
            queryKey: key,
            queryFn: async (): Promise<string> => {
              await sleep(10)
              return 'fetched'
            },
          },
        ] as const,
      })

      createEffect(
        on(
          [() => state.status, () => state.fetchStatus, () => state.data],
          () =>
            states.push({
              status: state.status,
              fetchStatus: state.fetchStatus,
              data: state.data,
            }),
        ),
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

    await waitFor(() => screen.getByText('fetchStatus: idle'))
    await waitFor(() => screen.getByText('hydrated'))
    await waitFor(() => screen.getByText('fetched'))

    expect(states).toHaveLength(3)

    expect(states[0]).toMatchObject({
      status: 'loading',
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
    const states: {
      status: string
      fetchStatus: string
      data: string | undefined
    }[] = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery(key(), () => Promise.resolve('hydrated'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = createQuery(
        key,
        async () => {
          await sleep(10)
          return 'fetched'
        },
        {
          initialData: 'initial',
          // make sure that initial data is older than the hydration data
          // otherwise initialData would be newer and takes precedence
          initialDataUpdatedAt: 1,
        },
      )

      createEffect(
        on(
          [() => state.status, () => state.fetchStatus, () => state.data],
          () =>
            states.push({
              status: state.status,
              fetchStatus: state.fetchStatus,
              data: state.data,
            }),
        ),
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

    await waitFor(() => screen.getByText('initial'))
    await waitFor(() => screen.getByText('hydrated'))
    await waitFor(() => screen.getByText('fetched'))

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
    const states: {
      status: string
      fetchStatus: string
      data: string | undefined
    }[] = []

    const queryClient = createQueryClient()
    await queryClient.prefetchQuery(key(), () => Promise.resolve('hydrated'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    let fetched = false

    function Page() {
      const state = createQuery(
        key,
        async () => {
          fetched = true
          await sleep(10)
          return 'fetched'
        },
        {
          staleTime: Infinity,
        },
      )

      createEffect(
        on(
          [() => state.status, () => state.fetchStatus, () => state.data],
          () =>
            states.push({
              status: state.status,
              fetchStatus: state.fetchStatus,
              data: state.data,
            }),
        ),
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

    await waitFor(() => screen.getByText('data: null'))
    await waitFor(() => screen.getByText('data: hydrated'))

    expect(states).toHaveLength(2)

    expect(fetched).toBe(false)

    expect(states[0]).toMatchObject({
      status: 'loading',
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
    await queryClient.prefetchQuery(key(), () => Promise.resolve('hydrated'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = createQuery(key, async () => {
        await sleep(10)
        return 'fetched'
      })

      return (
        <div>
          <h1>{state.data}</h1>
          <h2>fetchStatus: {state.fetchStatus}</h2>
        </div>
      )
    }

    const onSuccess = jest.fn()

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

    await waitFor(() => screen.getByText('hydrated'))
    expect(onSuccess).toHaveBeenCalledTimes(1)
    await waitFor(() => screen.getByText('fetched'))
  })

  test('should remove cache after non-successful restoring', async () => {
    const key = queryKey()
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    const queryClient = createQueryClient()
    const removeClient = jest.fn()

    const [error, persister] = createMockErrorPersister(removeClient)

    function Page() {
      const state = createQuery(key, async () => {
        await sleep(10)
        return 'fetched'
      })

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

    await waitFor(() => screen.getByText('fetched'))
    expect(removeClient).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledTimes(2)
    expect(mockLogger.error).toHaveBeenNthCalledWith(2, error)
  })

  // test('should be able to persist into multiple clients', async () => {
  //   const key = queryKey()
  //   const states: {
  //     status: string
  //     fetchStatus: string
  //     data: string | undefined
  //   }[] = []

  //   const queryClient = createQueryClient()
  //   await queryClient.prefetchQuery(key(), () => Promise.resolve('hydrated'))

  //   const persister = createMockPersister()

  //   await persistQueryClientSave({ queryClient, persister })

  //   queryClient.clear()

  //   const onSuccess = jest.fn()

  //   const queryFn1 = jest.fn().mockImplementation(async () => {
  //     await sleep(10)
  //     return 'queryFn1'
  //   })
  //   const queryFn2 = jest.fn().mockImplementation(async () => {
  //     await sleep(10)
  //     return 'queryFn2'
  //   })

  //   function App() {
  //     const [client, setClient] = createSignal(
  //       new QueryClient({
  //         defaultOptions: {
  //           queries: {
  //             queryFn: queryFn1,
  //           },
  //         },
  //       }),
  //     )

  //     onMount(() => {
  //       setClient(
  //         new QueryClient({
  //           defaultOptions: {
  //             queries: {
  //               queryFn: queryFn2,
  //             },
  //           },
  //         }),
  //       )
  //     })

  //     return (
  //       <PersistQueryClientProvider
  //         client={client()}
  //         persistOptions={{ persister }}
  //         onSuccess={onSuccess}
  //       >
  //         <Page />
  //       </PersistQueryClientProvider>
  //     )
  //   }

  //   function Page() {
  //     const state = createQuery(key)

  //     createEffect(
  //       on(
  //         [() => state.status, () => state.fetchStatus, () => state.data],
  //         () =>
  //           states.push({
  //             status: state.status,
  //             fetchStatus: state.fetchStatus,
  //             data: state.data as string | undefined,
  //           }),
  //       ),
  //     )

  //     return (
  //       <div>
  //         <h1>{String(state.data)}</h1>
  //         <h2>fetchStatus: {state.fetchStatus}</h2>
  //       </div>
  //     )
  //   }

  //   render(() => <App />)

  //   await waitFor(() => screen.getByText('hydrated'))
  //   await waitFor(() => screen.getByText('queryFn2'))

  //   expect(queryFn1).toHaveBeenCalledTimes(0)
  //   expect(queryFn2).toHaveBeenCalledTimes(1)
  //   expect(onSuccess).toHaveBeenCalledTimes(1)

  //   expect(states).toHaveLength(5)

  //   expect(states[0]).toMatchObject({
  //     status: 'loading',
  //     fetchStatus: 'idle',
  //     data: undefined,
  //   })

  //   expect(states[1]).toMatchObject({
  //     status: 'loading',
  //     fetchStatus: 'idle',
  //     data: undefined,
  //   })

  //   expect(states[2]).toMatchObject({
  //     status: 'success',
  //     fetchStatus: 'fetching',
  //     data: 'hydrated',
  //   })

  //   expect(states[3]).toMatchObject({
  //     status: 'success',
  //     fetchStatus: 'fetching',
  //     data: 'hydrated',
  //   })

  //   expect(states[4]).toMatchObject({
  //     status: 'success',
  //     fetchStatus: 'idle',
  //     data: 'queryFn2',
  //   })
  // })
})
