import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { QueryClient, useQuery, UseQueryResult } from '../..'
import { queryKey } from '../../reactjs/tests/utils'
import { sleep } from '../../core/utils'
import { PersistedClient, Persister, persistQueryClientSave } from '../persist'
import { PersistQueryClientProvider } from '../PersistQueryClientProvider'

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    async persistClient(persistClient: PersistedClient) {
      storedState = persistClient
    },
    async restoreClient() {
      return storedState
    },
    removeClient() {
      storedState = undefined
    },
  }
}

describe('PersistQueryClientProvider', () => {
  test('restores cache from persister', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    const queryClient = new QueryClient()
    await queryClient.prefetchQuery(key, () => Promise.resolve('prefetched'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    const initialData = jest.fn().mockReturnValue('initial')

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          initialData,
        }
      )

      states.push(state)

      return (
        <div>
          <h1>{state.data}</h1>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
        loading="loading"
      >
        <Page />
      </PersistQueryClientProvider>
    )

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('prefetched'))
    await waitFor(() => rendered.getByText('test'))

    expect(states).toHaveLength(2)

    expect(states[0]).toMatchObject({
      status: 'success',
      isFetching: true,
      data: 'prefetched',
    })

    expect(states[1]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: 'test',
    })

    expect(initialData).toHaveBeenCalledTimes(0)
  })
  test('should not refetch after restoring when data is fresh', async () => {
    const key = queryKey()
    const states: UseQueryResult<string>[] = []

    const queryClient = new QueryClient()
    await queryClient.prefetchQuery(key, () => Promise.resolve('prefetched'))

    const persister = createMockPersister()

    await persistQueryClientSave({ queryClient, persister })

    queryClient.clear()

    function Page() {
      const state = useQuery(
        key,
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          staleTime: Infinity,
        }
      )

      states.push(state)

      return (
        <div>
          <h1>{state.data}</h1>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
        loading="loading"
      >
        <Page />
      </PersistQueryClientProvider>
    )

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('prefetched'))

    expect(states).toHaveLength(1)

    expect(states[0]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: 'prefetched',
    })
  })
})
