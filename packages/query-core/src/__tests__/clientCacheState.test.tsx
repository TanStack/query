import { describe, expect, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { sleep } from '../utils'

describe('Client Cache State', () => {
  it('should prefetch query normally when no client state is provided', async () => {
    const queryClient = new QueryClient()
    const key = ['test']
    const serverData = 'server-data'
    let fetchCount = 0

    const queryFn = async () => {
      fetchCount++
      await sleep(10)
      return serverData
    }

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      staleTime: 5000,
    })

    expect(fetchCount).toBe(1)
  })

  it('should SKIP prefetch when client has fresh data', async () => {
    // 1. Initialize QueryClient with clientCacheState indicating fresh data
    const clientCacheState = {
      '["test-optim"]': Date.now(),
    }
    
    const queryClient = new QueryClient({ clientCacheState })
    
    const key = ['test-optim']
    const serverData = 'server-data'
    let fetchCount = 0

    const queryFn = async () => {
      fetchCount++
      await sleep(10)
      return serverData
    }

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      staleTime: 5000,
    })

    expect(fetchCount).toBe(0)
  })

  it('should SKIP prefetchInfiniteQuery when client has fresh data', async () => {
    const clientCacheState = {
      '["test-infinite-optim"]': Date.now(),
    }
    
    const queryClient = new QueryClient({ clientCacheState })
    
    const key = ['test-infinite-optim']
    const serverData = 'server-data'
    let fetchCount = 0

    const queryFn = async () => {
      fetchCount++
      await sleep(10)
      return serverData
    }

    await queryClient.prefetchInfiniteQuery({
      queryKey: key,
      queryFn,
      initialPageParam: 0,
      getNextPageParam: () => undefined,
      staleTime: 5000,
    })

    expect(fetchCount).toBe(0)
  })
})
