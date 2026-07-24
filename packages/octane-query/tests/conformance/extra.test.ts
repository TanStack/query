/**
 * Additional conformance driven by the port review: query-key change → refetch,
 * unmount → observer unsubscribe, the explicit-client (no-provider) path, and the
 * provider mounting/unmounting the client.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/octane-query'
import { mount, nextPaint } from '../_helpers'
import { KeyedApp } from '../_fixtures/extra.tsrx'
import { App } from '../_fixtures/app.tsrx'
import { Todo } from '../_fixtures/smoke.tsrx'

let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.mount()
})

async function flush() {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0))
    await nextPaint()
  }
}

describe('query-key change', () => {
  it('swaps the query and refetches when the key changes', async () => {
    const r = mount(KeyedApp, { client, k: 1 })
    await flush()
    expect(r.find('#status').textContent).toBe('data:v1')
    r.update(KeyedApp, { client, k: 2 })
    await flush()
    expect(r.find('#status').textContent).toBe('data:v2')
    r.unmount()
  })
})

describe('unmount unsubscribes the observer', () => {
  it('drops the query observer on unmount (no leak)', async () => {
    let resolveFn: (v: string) => void = () => {}
    const queryFn = () => new Promise<string>((res) => (resolveFn = res))
    const r = mount(App, { client, queryFn })
    await flush()
    resolveFn('x')
    await flush()
    const query = client.getQueryCache().find({ queryKey: ['k'] })!
    expect(query.observers.length).toBeGreaterThan(0)
    r.unmount()
    await flush()
    expect(query.observers.length).toBe(0)
  })
})

describe('explicit client (no provider)', () => {
  it('useQuery(options, client) resolves the passed client', async () => {
    let resolveFn: (v: string) => void = () => {}
    const queryFn = () => new Promise<string>((res) => (resolveFn = res))
    const r = mount(Todo, { client, queryFn })
    expect(r.find('#status').textContent).toBe('pending')
    await flush()
    resolveFn('direct')
    await flush()
    expect(r.find('#status').textContent).toBe('data:direct')
    r.unmount()
  })
})

describe('QueryClientProvider mounts/unmounts the client', () => {
  it('calls client.mount() on mount and client.unmount() on unmount', async () => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let mounts = 0
    let unmounts = 0
    const realMount = c.mount.bind(c)
    const realUnmount = c.unmount.bind(c)
    c.mount = () => {
      mounts++
      return realMount()
    }
    c.unmount = () => {
      unmounts++
      return realUnmount()
    }
    const r = mount(App, { client: c, queryFn: () => Promise.resolve('x') })
    await flush()
    expect(mounts).toBe(1)
    r.unmount()
    await flush()
    expect(unmounts).toBe(1)
  })
})
