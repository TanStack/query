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

  // This test describes the DESIRED behavior, which is currently NOT implemented.
  // It is expected to FAIL until we implement the changes.
  it('should SKIP prefetch when client has fresh data (Simulated)', async () => {
    // 1. Simulate hypothetical QueryClient with clientCacheState
    // We haven't implemented the types yet, so we cast to any or expect it to be ignored for now.
    const clientCacheState = {
      '["test-optim"]': Date.now(), // Client has fresh data right now
    }
    
    // @ts-ignore - API not implemented yet
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
      staleTime: 5000, // 5 seconds stale time
    })

    // CURRENT BEHAVIOR: fetchCount is 1 (Server fetches anyway)
    // DESIRED BEHAVIOR: fetchCount should be 0 (Server skips because client has it)
    
    // We expect this to equal 0 if our feature is working.
    // For now, let's assert 0 and see it fail, proving the need for the feature.
    expect(fetchCount).toBe(0)
  })
})
