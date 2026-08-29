import { describe, expect, it } from 'vitest'
import { QueryClient } from '../QueryClient'
import { dehydrateSettled } from '../dehydrateSettled'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('dehydrateSettled', () => {
  it('waits for in-flight fetches instead of snapshotting mid-fetch', async () => {
    const client = new QueryClient()
    // Fire-and-forget, the way loaders hint prefetches.
    void client.prefetchQuery({
      queryKey: ['slow'],
      queryFn: async () => {
        await sleep(20)
        return 'slow-data'
      },
    })

    const state = await dehydrateSettled(client)

    const query = state.queries.find((q) => q.queryHash === '["slow"]')
    expect(query?.state.data).toBe('slow-data')
    expect(query?.state.status).toBe('success')
  })

  it('chases fetches dispatched by earlier settlements to quiescence', async () => {
    const client = new QueryClient()
    void client.prefetchQuery({
      queryKey: ['first'],
      queryFn: async () => {
        await sleep(10)
        // A dependent fetch that only exists once the first one lands.
        void client.prefetchQuery({
          queryKey: ['second'],
          queryFn: async () => {
            await sleep(10)
            return 'second-data'
          },
        })
        return 'first-data'
      },
    })

    const state = await dehydrateSettled(client)

    expect(state.queries.map((q) => q.queryHash).sort()).toEqual([
      '["first"]',
      '["second"]',
    ])
    expect(
      state.queries.find((q) => q.queryHash === '["second"]')?.state.data,
    ).toBe('second-data')
  })

  it('settles failures without rejecting and forwards dehydrate options', async () => {
    const client = new QueryClient()
    void client.prefetchQuery({
      queryKey: ['ok'],
      queryFn: async () => {
        await sleep(5)
        return 'ok-data'
      },
    })
    void client.prefetchQuery({
      queryKey: ['boom'],
      retry: false,
      queryFn: async () => {
        await sleep(5)
        throw new Error('nope')
      },
    })

    const state = await dehydrateSettled(client, {
      shouldDehydrateQuery: (query) => query.state.status === 'success',
    })

    expect(state.queries.map((q) => q.queryHash)).toEqual(['["ok"]'])
  })
})
