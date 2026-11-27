import { CancelledError, onlineManager } from '@tanstack/query-core'
import { describe, expect, it } from 'vitest'
import { QueryClient, cancelQueries } from '..'
import {
  clearQueryClient,
  fetchQuery,
  getQueryState,
  mountQueryClient,
  unmountQueryClient,
} from '../runtime/queryClient'

describe('shared query-core runtime', () => {
  it('pauses when core goes offline and resumes when core reconnects', async () => {
    const client = new QueryClient()
    const wasOnline = onlineManager.isOnline()
    mountQueryClient(client)
    try {
      onlineManager.setOnline(false)
      const queryKey = ['connection']
      const pending = fetchQuery(client, { queryKey, queryFn: () => 'online' })
      expect(getQueryState(client, queryKey)?.fetchStatus).toBe('paused')
      onlineManager.setOnline(true)
      await expect(pending).resolves.toBe('online')
    } finally {
      unmountQueryClient(client)
      onlineManager.setOnline(wasOnline)
      clearQueryClient(client)
    }
  })

  it('rejects cancelled queries with the core cancellation error', async () => {
    const client = new QueryClient()
    const queryKey = ['cancel']
    const pending = fetchQuery(client, {
      queryKey,
      queryFn: () => new Promise<void>(() => {}),
    })
    await Promise.all([
      expect(pending).rejects.toBeInstanceOf(CancelledError),
      cancelQueries(client, { queryKey }),
    ])
    clearQueryClient(client)
  })
})
