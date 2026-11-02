import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'

describe('setQueryData no-op skip (#12443)', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should skip success event for structurally identical manual write', () => {
    const client = new QueryClient()
    const events: Array<{ type: string; event: { type: string; manual?: boolean } }> = []

    client.getQueryCache().subscribe((cacheEvent) => {
      if (cacheEvent.type === 'event') {
        events.push(cacheEvent)
      }
    })

    const base = { id: '1', name: 'item', meta: { tag: 'a', n: 1 } }

    // Initial write
    client.setQueryData(['item', '1'], base)

    // 10 no-op manual writes with same content, new reference
    for (let i = 0; i < 10; i++) {
      client.setQueryData(['item', '1'], (old) => ({ ...old, ...JSON.parse(JSON.stringify(base)) }))
    }

    const successEvents = events.filter(e => e.event.type === 'success')
    const manualSuccessEvents = successEvents.filter(e => e.event.manual === true)

    // Only the first write should dispatch a success event
    expect(manualSuccessEvents.length).toBe(1)
    
    // dataUpdateCount should only be 1 (initial write)
    const query = client.getQueryCache().find({ queryKey: ['item', '1'] })
    expect(query?.state.dataUpdateCount).toBe(1)
  })

  it('should NOT skip non-manual writes (fetch path)', () => {
    const client = new QueryClient()
    const events: Array<{ type: string; event: { type: string; manual?: boolean } }> = []

    client.getQueryCache().subscribe((cacheEvent) => {
      if (cacheEvent.type === 'event') {
        events.push(cacheEvent)
      }
    })

    const base = { id: '1', name: 'item', meta: { tag: 'a', n: 1 } }

    // Initial write
    client.setQueryData(['item', '1'], base)

    // Simulate a fetch write (manual: false)
    const query = client.getQueryCache().find({ queryKey: ['item', '1'] })
    query?.setData(base, { manual: false })

    const successEvents = events.filter(e => e.event.type === 'success')
    const fetchSuccessEvents = successEvents.filter(e => e.event.manual !== true)

    // Fetch writes should still dispatch success events
    expect(fetchSuccessEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('should NOT skip when explicit updatedAt is provided', () => {
    const client = new QueryClient()
    const events: Array<{ type: string; event: { type: string; manual?: boolean; dataUpdatedAt?: number } }] = []

    client.getQueryCache().subscribe((cacheEvent) => {
      if (cacheEvent.type === 'event') {
        events.push(cacheEvent)
      }
    })

    const base = { id: '1', name: 'item', meta: { tag: 'a', n: 1 } }
    client.setQueryData(['item', '1'], base)

    // Write with explicit updatedAt - should dispatch
    client.setQueryData(['item', '1'], { ...base }, { updatedAt: Date.now() })

    const successEvents = events.filter(e => e.event.type === 'success')
    const manualSuccessEvents = successEvents.filter(e => e.event.manual === true)

    // Should have 2 manual success events (initial + explicit updatedAt)
    expect(manualSuccessEvents.length).toBe(2)
  })

  it('should work with setQueriesData', () => {
    const client = new QueryClient()
    const events: Array<{ type: string; event: { type: string; manual?: boolean } }> = []

    client.getQueryCache().subscribe((cacheEvent) => {
      if (cacheEvent.type === 'event') {
        events.push(cacheEvent)
      }
    })

    const base = { id: '1', name: 'item', meta: { tag: 'a', n: 1 } }

    client.setQueryData(['item', '1'], base)

    // setQueriesData with no-op
    client.setQueriesData({ queryKey: ['item', '1'] }, (old) => ({ ...old, ...JSON.parse(JSON.stringify(base)) }))

    const successEvents = events.filter(e => e.event.type === 'success')
    const manualSuccessEvents = successEvents.filter(e => e.event.manual === true)

    expect(manualSuccessEvents.length).toBe(1)
  })
})