import { QueryClient, type QueryCache, type QueryState } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache
  const broadcastChannel = 'test_channel'

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  it('should subscribe to the query cache', () => {
    broadcastQueryClient({
      queryClient,
      broadcastChannel,
    })
    expect(queryCache.hasListeners()).toBe(true)
  })

  it('should not have any listeners after cleanup', () => {
    const unsubscribe = broadcastQueryClient({
      queryClient,
      broadcastChannel,
    })
    unsubscribe()
    expect(queryCache.hasListeners()).toBe(false)
  })

  it('should sync initial query state when query is added from another tab', async () => {
    const receiverClient = new QueryClient()
    const senderClient = new QueryClient()

    const senderUnsubscribe = broadcastQueryClient({
      queryClient: senderClient,
      broadcastChannel,
    })
    const receiverUnsubscribe = broadcastQueryClient({
      queryClient: receiverClient,
      broadcastChannel,
    })

    const seededData = { value: 'seeded' }
    const seededState: QueryState<typeof seededData> = {
      data: seededData,
      dataUpdateCount: 1,
      dataUpdatedAt: Date.now(),
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchMeta: null,
      isInvalidated: false,
      status: 'success',
      fetchStatus: 'idle',
    }

    senderClient.getQueryCache().build(
      senderClient,
      { queryKey: ['seeded-query'] },
      seededState,
    )

    const findState = () =>
      receiverClient.getQueryCache().find({ queryKey: ['seeded-query'] })?.state

    await vi.waitFor(() => {
      expect(findState()).toMatchObject(seededState)
    })

    senderUnsubscribe()
    receiverUnsubscribe()
  })
})
