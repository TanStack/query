/**
 * @tanstack/octane-query conformance — useQuery / useMutation / QueryClientProvider /
 * useQueryClient on octane, driving the REAL @tanstack/query-core (observers +
 * caches reused verbatim). Exercises the async query lifecycle (pending →
 * success / error), context client resolution, and the mutation lifecycle.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/octane-query'
import { mount, nextPaint } from '../_helpers'
import { App, MutApp, ProbeApp } from '../_fixtures/app.tsrx'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: {} },
  })
})

// query-core batches notifications on a macrotask; flush a few cycles + paints.
async function flush() {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0))
    await nextPaint()
  }
}

describe('useQuery lifecycle (via QueryClientProvider)', () => {
  it('pending -> success', async () => {
    let resolveFn: (v: string) => void = () => {}
    const queryFn = () => new Promise<string>((r) => (resolveFn = r))
    const r = mount(App, { client, queryFn })
    expect(r.find('#status').textContent).toBe('pending')
    await flush()
    resolveFn('world')
    await flush()
    expect(r.find('#status').textContent).toBe('data:world')
    r.unmount()
  })

  it('pending -> error (retry disabled)', async () => {
    let rejectFn: (e: Error) => void = () => {}
    const queryFn = () => new Promise<string>((_res, rej) => (rejectFn = rej))
    const r = mount(App, { client, queryFn })
    expect(r.find('#status').textContent).toBe('pending')
    await flush()
    rejectFn(new Error('boom'))
    await flush()
    expect(r.find('#status').textContent).toBe('error:boom')
    r.unmount()
  })
})

describe('useQueryClient', () => {
  it('resolves the client provided by QueryClientProvider', async () => {
    let seen: unknown = null
    const r = mount(ProbeApp, { client, onClient: (c: unknown) => (seen = c) })
    await nextPaint()
    expect(r.find('#probe').textContent).toBe('ok')
    expect(seen).toBe(client)
    r.unmount()
  })
})

describe('useMutation lifecycle', () => {
  it('idle -> pending -> success on mutate()', async () => {
    let resolveFn: (v: string) => void = () => {}
    const mutationFn = () => new Promise<string>((r) => (resolveFn = r))
    const r = mount(MutApp, { client, mutationFn })
    expect(r.find('#mstatus').textContent).toBe('idle')
    r.click('#go')
    await flush()
    expect(r.find('#mstatus').textContent).toBe('pending')
    resolveFn('done')
    await flush()
    expect(r.find('#mstatus').textContent).toBe('data:done')
    r.unmount()
  })
})
