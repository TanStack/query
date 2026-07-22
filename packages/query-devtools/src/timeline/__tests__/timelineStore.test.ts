import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import {
  clearTimeline,
  formatDuration,
  getSpans,
  handleMutationCacheEvent,
  handleQueryCacheEvent,
  resetTimelineStore,
} from '../timelineStore'
import type {
  MutationCacheNotifyEvent,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'

describe('timelineStore', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    resetTimelineStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  afterEach(() => {
    queryClient.clear()
    resetTimelineStore()
    vi.useRealTimers()
  })

  it('opens a pending query span on fetch and closes it on success', async () => {
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe(handleQueryCacheEvent)

    const promise = queryClient.fetchQuery({
      queryKey: ['posts'],
      queryFn: () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('ok'), 100)
        }),
    })

    expect(getSpans()).toHaveLength(1)
    expect(getSpans()[0]).toMatchObject({
      kind: 'query',
      keyLabel: '["posts"]',
      status: 'pending',
    })

    await vi.advanceTimersByTimeAsync(100)
    await promise

    expect(getSpans()).toHaveLength(1)
    expect(getSpans()[0]?.status).toBe('success')
    expect(getSpans()[0]?.durationMs).toBe(100)
    expect(getSpans()[0]?.endedAt).toBeDefined()

    unsubscribe()
  })

  it('closes a query span as error on fetch failure', async () => {
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe(handleQueryCacheEvent)

    const promise = queryClient
      .fetchQuery({
        queryKey: ['fail'],
        queryFn: () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('boom')), 50)
          }),
      })
      .catch(() => undefined)

    await vi.advanceTimersByTimeAsync(50)
    await promise

    expect(getSpans()[0]?.status).toBe('error')
    expect(getSpans()[0]?.durationMs).toBe(50)

    unsubscribe()
  })

  it('records parallel query spans', async () => {
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe(handleQueryCacheEvent)

    const p1 = queryClient.fetchQuery({
      queryKey: ['a'],
      queryFn: () =>
        new Promise((resolve) => setTimeout(() => resolve('a'), 100)),
    })
    const p2 = queryClient.fetchQuery({
      queryKey: ['b'],
      queryFn: () =>
        new Promise((resolve) => setTimeout(() => resolve('b'), 100)),
    })

    expect(getSpans()).toHaveLength(2)
    expect(getSpans().map((s) => s.keyLabel).sort()).toEqual([
      '["a"]',
      '["b"]',
    ])

    await vi.advanceTimersByTimeAsync(100)
    await Promise.all([p1, p2])

    expect(getSpans().every((s) => s.status === 'success')).toBe(true)

    unsubscribe()
  })

  it('records successive fetches for the same key as separate spans', async () => {
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe(handleQueryCacheEvent)

    await queryClient.fetchQuery({
      queryKey: ['overlap'],
      queryFn: () => Promise.resolve('1'),
    })

    await queryClient.fetchQuery({
      queryKey: ['overlap'],
      queryFn: () => Promise.resolve('2'),
    })

    expect(getSpans()).toHaveLength(2)
    expect(getSpans()[0]?.id).not.toBe(getSpans()[1]?.id)
    expect(getSpans().every((s) => s.status === 'success')).toBe(true)
    expect(getSpans().every((s) => s.keyLabel === '["overlap"]')).toBe(true)

    unsubscribe()
  })

  it('records mutation spans from pending to success', async () => {
    const cache = queryClient.getMutationCache()
    const unsubscribe = cache.subscribe(handleMutationCacheEvent)

    const mutation = cache.build(queryClient, {
      mutationKey: ['add'],
      mutationFn: () =>
        new Promise((resolve) => setTimeout(() => resolve('ok'), 80)),
    })

    const promise = mutation.execute({})
    expect(getSpans()).toHaveLength(1)
    expect(getSpans()[0]).toMatchObject({
      kind: 'mutation',
      keyLabel: '["add"]',
      status: 'pending',
    })

    await vi.advanceTimersByTimeAsync(80)
    await promise

    expect(getSpans()[0]?.status).toBe('success')
    expect(getSpans()[0]?.durationMs).toBe(80)

    unsubscribe()
  })

  it('updates status on pause and continue', () => {
    const query = { queryHash: '["paused"]' }

    handleQueryCacheEvent({
      type: 'updated',
      query,
      action: { type: 'fetch' },
    } as unknown as QueryCacheNotifyEvent)

    expect(getSpans()[0]?.status).toBe('pending')

    handleQueryCacheEvent({
      type: 'updated',
      query,
      action: { type: 'pause' },
    } as unknown as QueryCacheNotifyEvent)

    expect(getSpans()[0]?.status).toBe('paused')

    handleQueryCacheEvent({
      type: 'updated',
      query,
      action: { type: 'continue' },
    } as unknown as QueryCacheNotifyEvent)

    expect(getSpans()[0]?.status).toBe('pending')
  })

  it('ignores non-network cache updates', () => {
    handleQueryCacheEvent({
      type: 'updated',
      query: { queryHash: '["x"]' },
      action: { type: 'invalidate' },
    } as unknown as QueryCacheNotifyEvent)

    handleQueryCacheEvent({
      type: 'added',
      query: { queryHash: '["x"]' },
    } as unknown as QueryCacheNotifyEvent)

    expect(getSpans()).toHaveLength(0)
  })

  it('clears all spans', async () => {
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe(handleQueryCacheEvent)

    await queryClient.fetchQuery({
      queryKey: ['clear-me'],
      queryFn: () => Promise.resolve(1),
    })

    expect(getSpans().length).toBeGreaterThan(0)
    clearTimeline()
    expect(getSpans()).toHaveLength(0)

    unsubscribe()
  })

  it('caps history at 200 spans', () => {
    for (let i = 0; i < 205; i++) {
      handleQueryCacheEvent({
        type: 'updated',
        query: { queryHash: `["q-${i}"]` },
        action: { type: 'fetch' },
      } as unknown as QueryCacheNotifyEvent)
      handleQueryCacheEvent({
        type: 'updated',
        query: { queryHash: `["q-${i}"]` },
        action: { type: 'success' },
      } as unknown as QueryCacheNotifyEvent)
    }

    expect(getSpans()).toHaveLength(200)
    expect(getSpans()[0]?.keyLabel).toBe('["q-5"]')
  })

  it('formats durations', () => {
    expect(formatDuration(12)).toBe('12ms')
    expect(formatDuration(1500)).toBe('1.50s')
    expect(formatDuration(12_000)).toBe('12.0s')
    expect(formatDuration(65_000)).toBe('1m 5s')
  })

  it('handles mutation pause and continue', () => {
    const mutation = {
      mutationId: 1,
      options: { mutationKey: ['m'] },
      state: { submittedAt: Date.now() },
    }

    handleMutationCacheEvent({
      type: 'updated',
      mutation,
      action: { type: 'pending' },
    } as unknown as MutationCacheNotifyEvent)

    handleMutationCacheEvent({
      type: 'updated',
      mutation,
      action: { type: 'pause' },
    } as unknown as MutationCacheNotifyEvent)

    expect(getSpans()[0]?.status).toBe('paused')

    handleMutationCacheEvent({
      type: 'updated',
      mutation,
      action: { type: 'continue' },
    } as unknown as MutationCacheNotifyEvent)

    expect(getSpans()[0]?.status).toBe('pending')
  })
})
