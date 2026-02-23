/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import '@testing-library/jest-dom/vitest'

import type { PersistedClient, Persister } from '../../../query-persist-client-core/src'
import { persistQueryClientSave } from '../../../query-persist-client-core/src'
import { notifyManager } from '../../../query-core/src'
import { act, cleanup, render } from '@testing-library/preact'
import type { UseQueryResult } from '../../../preact-query/src'
import {
  QueryClient,
  useQuery,
} from '../../../preact-query/src'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { PersistQueryClientProvider } from './testPersistProvider'
import { queryKey, sleep } from './testUtils'

notifyManager.setNotifyFunction((fn) => {
  act(fn)
})

const createMockPersister = (): Persister => {
  let storedState: PersistedClient | undefined

  return {
    persistClient(persistClient: PersistedClient) {
      storedState = persistClient
      return Promise.resolve()
    },
    async restoreClient() {
      return sleep(10).then(() => storedState)
    },
    removeClient() {
      storedState = undefined
      return Promise.resolve()
    },
  }
}

describe('PersistQueryClientProvider (preact)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  test('restores cache from persister and refetches', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<string>> = []

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
      const state = useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
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

    expect(rendered.getByText('fetchStatus: idle')).toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    expect(rendered.getByText('hydrated')).toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(11) })
    expect(rendered.getByText('fetched')).toBeInTheDocument()

    expect(states.length).toBeGreaterThanOrEqual(3)
    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(
      states.some(
        (state) => state.fetchStatus === 'fetching' && state.data === 'hydrated',
      ),
    ).toBe(true)

    expect(states.at(-1)).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })
})
