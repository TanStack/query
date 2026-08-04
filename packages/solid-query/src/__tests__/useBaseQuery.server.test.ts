// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

vi.mock('solid-js/web', () => ({
  isServer: true,
}))

const { hydratableObserverResult } = await import('../useBaseQuery')

describe('hydratableObserverResult', () => {
  it('omits the pending promise for disabled idle queries during SSR', () => {
    const promise = new Promise(() => {})
    const query = {
      state: { status: 'pending', fetchStatus: 'idle' },
      queryKey: ['disabled'],
      queryHash: '["disabled"]',
      meta: undefined,
    } as any
    const result = {
      status: 'pending',
      fetchStatus: 'idle',
      isEnabled: false,
      data: undefined,
      refetch: () => undefined,
      promise,
    } as any

    const hydratable = hydratableObserverResult(query, result)

    expect(hydratable.promise).toBeUndefined()
    expect(hydratable.refetch).toBeUndefined()
    expect(hydratable.hydrationData).toMatchObject({
      state: query.state,
      queryKey: query.queryKey,
      queryHash: query.queryHash,
    })
  })

  it('keeps the promise for active SSR queries that are still fetching', () => {
    const promise = new Promise(() => {})
    const query = {
      state: { status: 'pending', fetchStatus: 'fetching' },
      queryKey: ['active'],
      queryHash: '["active"]',
      meta: undefined,
    } as any
    const result = {
      status: 'pending',
      fetchStatus: 'fetching',
      isEnabled: true,
      data: undefined,
      refetch: () => undefined,
      promise,
    } as any

    const hydratable = hydratableObserverResult(query, result)

    expect(hydratable.promise).toBe(promise)
  })
})
