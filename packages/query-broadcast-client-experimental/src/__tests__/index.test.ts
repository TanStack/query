import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { broadcastQueryClient } from '..'
import type { QueryCache } from '@tanstack/query-core'

describe('broadcastQueryClient', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache
  let unsubscribe: () => void

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  it('should subscribe to the query cache', async () => {
    unsubscribe = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
    expect(queryCache.hasListeners()).toBe(true)
  })

  it('should not have any listeners after cleanup', async () => {
    unsubscribe()
    expect(queryCache.hasListeners()).toBe(false)
  })
})
