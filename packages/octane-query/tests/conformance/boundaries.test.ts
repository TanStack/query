/**
 * IsRestoringProvider / useIsRestoring and QueryErrorResetBoundary /
 * useQueryErrorResetBoundary — the persistence-restore gate and the
 * error-boundary reset coordinator.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/octane-query'
import { mount, nextPaint } from '../_helpers'
import { ResetApp, RestoringApp } from '../_fixtures/boundaries.tsrx'

let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.mount()
})

async function flush() {
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 0))
    await nextPaint()
  }
}

describe('IsRestoring', () => {
  it('does NOT subscribe/fetch while restoring', async () => {
    let called = 0
    const queryFn = () => {
      called++
      return Promise.resolve('x')
    }
    const r = mount(RestoringApp, { client, restoring: true, queryFn })
    await flush()
    expect(called).toBe(0)
    expect(r.find('#status').textContent).toBe('pending')
    r.unmount()
  })

  it('fetches normally when not restoring', async () => {
    let called = 0
    const queryFn = () => {
      called++
      return Promise.resolve('y')
    }
    const r = mount(RestoringApp, { client, restoring: false, queryFn })
    await flush()
    expect(called).toBeGreaterThan(0)
    expect(r.find('#status').textContent).toBe('data:y')
    r.unmount()
  })
})

describe('QueryErrorResetBoundary', () => {
  it('reset() lets the query retry instead of re-throwing', async () => {
    let calls = 0
    const queryFn = () => {
      calls++
      return calls === 1
        ? Promise.reject(new Error('boom'))
        : Promise.resolve('recovered')
    }
    const r = mount(ResetApp, { client, queryFn })
    await flush()
    // First fetch errored → @catch/<ErrorBoundary> fallback (the retry button).
    expect(r.find('#retry').textContent).toBe('retry')
    r.click('#retry')
    await flush()
    expect(r.find('#data').textContent).toBe('data:recovered')
    r.unmount()
  })
})
