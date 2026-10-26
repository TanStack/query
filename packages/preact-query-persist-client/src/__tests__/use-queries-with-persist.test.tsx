import { act, render } from '@testing-library/preact'
import { useCallback } from 'preact/hooks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, useQueries } from '@tanstack/preact-query'
import { PersistQueryClientProvider } from '@tanstack/preact-query-persist-client'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import type { QueryObserverResult } from '@tanstack/preact-query'

describe('useQueries with persist and memoized combine (preact)', () => {
  const storage: Record<string, string> = {}

  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => {
          storage[key] = value
        },
        removeItem: (key: string) => {
          delete storage[key]
        },
        clear: () => {
          Object.keys(storage).forEach((key) => delete storage[key])
        },
      },
      writable: true,
    })
  })

  afterEach(() => {
    Object.keys(storage).forEach((key) => delete storage[key])
    vi.useRealTimers()
  })

  it('should update UI when combine is memoized with persisted results', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30000,
          gcTime: 24 * 60 * 60 * 1000,
        },
      },
    })

    const persister: Persister = {
      persistClient: (client: PersistedClient) => {
        storage.REACT_QUERY_OFFLINE_CACHE = JSON.stringify(client)
        return Promise.resolve()
      },
      restoreClient: async () => {
        const stored = storage.REACT_QUERY_OFFLINE_CACHE
        if (stored) {
          return sleep(10).then(() => JSON.parse(stored) as PersistedClient)
        }

        return undefined
      },
      removeClient: () => {
        delete storage.REACT_QUERY_OFFLINE_CACHE
        return Promise.resolve()
      },
    }

    const persistedData: PersistedClient = {
      timestamp: Date.now(),
      buster: '',
      clientState: {
        mutations: [],
        queries: [1, 2, 3].map((id) => ({
          queryHash: `["post",${id}]`,
          queryKey: ['post', id],
          dehydratedAt: Date.now(),
          state: {
            data: id,
            dataUpdateCount: 1,
            dataUpdatedAt: Date.now() - 1000,
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            isInvalidated: false,
            status: 'success' as const,
            fetchStatus: 'idle' as const,
          },
        })),
      },
    }

    storage.REACT_QUERY_OFFLINE_CACHE = JSON.stringify(persistedData)

    function TestComponent() {
      const combinedQueries = useQueries({
        queries: [1, 2, 3].map((id) => ({
          queryKey: ['post', id],
          queryFn: () => sleep(100).then(() => id),
          staleTime: 30000,
        })),
        combine: useCallback(
          (results: Array<QueryObserverResult<number, Error>>) => ({
            data: results.map((result) => result.data),
            isPending: results.some((result) => result.isPending),
          }),
          [],
        ),
      })

      return (
        <div>
          <div data-testid="pending">{String(combinedQueries.isPending)}</div>
          <div data-testid="data">
            {combinedQueries.data
              .filter((value) => value !== undefined)
              .join(',')}
          </div>
        </div>
      )
    }

    const rendered = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <TestComponent />
      </PersistQueryClientProvider>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(rendered.getByTestId('pending').textContent).toBe('false')
    expect(rendered.getByTestId('data').textContent).toBe('1,2,3')
  })
})
