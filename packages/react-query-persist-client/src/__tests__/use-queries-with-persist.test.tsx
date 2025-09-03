import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { QueryClient, useQueries } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core'
import type { QueryObserverResult } from '@tanstack/react-query'

describe('useQueries with persist and memoized combine', () => {
  const storage: { [key: string]: string } = {}

  beforeEach(() => {
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
  })

  it('should update UI when combine is memoized with persist', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 1000 * 60 * 60 * 24,
        },
      },
    })

    const persister: Persister = {
      persistClient: (client: PersistedClient) => {
        storage['REACT_QUERY_OFFLINE_CACHE'] = JSON.stringify(client)
        return Promise.resolve()
      },
      restoreClient: async () => {
        const stored = storage['REACT_QUERY_OFFLINE_CACHE']
        if (stored) {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return JSON.parse(stored) as PersistedClient
        }
        return undefined
      },
      removeClient: () => {
        delete storage['REACT_QUERY_OFFLINE_CACHE']
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

    storage['REACT_QUERY_OFFLINE_CACHE'] = JSON.stringify(persistedData)

    function TestComponent() {
      const combinedQueries = useQueries({
        queries: [1, 2, 3].map((id) => ({
          queryKey: ['post', id],
          queryFn: () => Promise.resolve(id),
          staleTime: 30_000,
        })),
        combine: React.useCallback(
          (results: Array<QueryObserverResult<number, Error>>) => ({
            data: results.map((r) => r.data),
            isPending: results.some((r) => r.isPending),
          }),
          [],
        ),
      })

      return (
        <div>
          <div data-testid="pending">{String(combinedQueries.isPending)}</div>
          <div data-testid="data">
            {combinedQueries.data.filter((d) => d !== undefined).join(',')}
          </div>
        </div>
      )
    }

    const { getByTestId } = render(
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <TestComponent />
      </PersistQueryClientProvider>,
    )

    await waitFor(() => {
      expect(getByTestId('pending').textContent).toBe('false')
      expect(getByTestId('data').textContent).toBe('1,2,3')
    })
  })
})
