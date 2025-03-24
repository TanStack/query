import { QueryClient, QueryCache } from '@tanstack/query-core'
import { describe, expect, it, beforeEach } from 'vitest'
import { broadcastQueryClient } from '.'

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  it('should subscribe to the query cache', async () => {
    broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
    expect(queryCache.hasListeners()).toBe(true)
  })
})
