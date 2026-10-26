import { act, render } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, noop, useQuery } from '@tanstack/preact-query'
import { persistQueryClientSave } from '@tanstack/query-persist-client-core'
import { PersistQueryClientProvider } from '../PersistQueryClientProvider'
import type { UseQueryResult } from '@tanstack/preact-query'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'

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
    vi.useRealTimers()
  })

  it('should restore cache from persister and refetch', async () => {
    const key = createKey()
    const states: Array<UseQueryResult<string>> = []

    const queryClient = new QueryClient()
    void queryClient
      .query({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'hydrated'),
      })
      .catch(noop)
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
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.getByText('hydrated')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11)
    })
    expect(rendered.getByText('fetched')).toBeInTheDocument()

    expect(states.length).toBeGreaterThanOrEqual(3)
    expect(states[0]).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })

    expect(
      states.some(
        (state) =>
          state.fetchStatus === 'fetching' && state.data === 'hydrated',
      ),
    ).toBe(true)

    expect(states.at(-1)).toMatchObject({
      status: 'success',
      fetchStatus: 'idle',
      data: 'fetched',
    })
  })
})
