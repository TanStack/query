/**
 * React useTransition + Suspense parity for `useSuspenseQuery`.
 *
 * Per React's useTransition contract (ReactSuspense*-test "transition does not
 * show fallback when refetching the same boundary"): once a transition is
 * showing previously-committed content, React keeps it on screen until the new
 * query resolves — it does NOT flash the Suspense fallback, even though the
 * query observer's notification (and thus the re-render that re-suspends on the
 * new fetch) arrives asynchronously at URGENT priority (query-core's
 * notifyManager schedules on a setTimeout(0) macrotask).
 *
 * Before the octane fix this flashed the @pending fallback during the move; the
 * runtime now continues the transition hold across the urgent re-suspend.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/octane-query'
import { act } from 'octane'
import { mount, nextPaint } from '../_helpers'
import { TransitionSuspenseApp } from '../_fixtures/transition-suspense.tsrx'

let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.mount()
})

// Drain query-core's macrotask scheduler (setTimeout(0)) AND octane's passive
// effects several times so the observer's async notifications land.
async function flush() {
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 0))
    await nextPaint()
  }
}

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('useSuspenseQuery — transition keeps prior content, no fallback flash (React parity)', () => {
  it('value=1 committed; transition to value=2 holds value=1 until value=2 resolves', async () => {
    // Per-value controlled promises. value=1 resolves immediately so the first
    // query commits content; value=2 stays pending until we resolve it.
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    const promises: Record<number, Promise<string>> = {
      1: d1.promise,
      2: d2.promise,
    }
    const queryFn = (v: number) => promises[v]

    let setValue!: (v: number) => void
    const bindSetValue = (fn: (v: number) => void) => {
      setValue = fn
    }

    const r = mount(TransitionSuspenseApp, { client, queryFn, bindSetValue })

    // First render suspends → fallback while value=1's query is in flight.
    expect(r.find('#fallback').textContent).toBe('loading')

    d1.resolve('one')
    await flush()
    // value=1 content committed.
    expect(r.find('#data').textContent).toBe('data:one')
    expect(r.findAll('#fallback')).toHaveLength(0)
    expect(r.find('#pending').textContent).toBe('idle')

    // Transition to value=2: the reader re-renders under key ['…', 2] and the
    // new query is in flight. The observer notifies asynchronously (macrotask)
    // so the re-suspend re-render is URGENT — but because the boundary is
    // transition-held, value=1 content STAYS and the fallback NEVER appears.
    //
    // The flash (pre-fix) is TRANSIENT — it shows only across the macrotask
    // window between the observer's async notify and the eventual resolve, so
    // asserting only after a full `flush()` would miss it. Watch the DOM with a
    // MutationObserver so any momentary appearance of #fallback (or the loss of
    // the value=1 content) is recorded for the whole in-flight window.
    let fallbackEverSeen = false
    let contentEverLost = false
    const mo = new MutationObserver(() => {
      if (r.container.querySelector('#fallback')) fallbackEverSeen = true
      if (!r.container.querySelector('#data')) contentEverLost = true
    })
    mo.observe(r.container, { childList: true, subtree: true })

    await act(() => setValue(2))
    await flush()
    mo.disconnect()

    expect(fallbackEverSeen).toBe(false) // <- pre-fix this FLASHED (true)
    expect(contentEverLost).toBe(false) // value=1 content never removed
    expect(r.find('#data').textContent).toBe('data:one') // OLD content held
    expect(r.findAll('#fallback')).toHaveLength(0)
    expect(r.find('#pending').textContent).toBe('pending')

    // Resolve value=2 → the held boundary commits the new content all at once
    // and isPending returns to idle. The fallback never showed at any point.
    d2.resolve('two')
    await flush()
    expect(r.find('#data').textContent).toBe('data:two')
    expect(r.findAll('#fallback')).toHaveLength(0)
    expect(r.find('#pending').textContent).toBe('idle')

    r.unmount()
  })

  it('an URGENT key change while held re-suspends the query without flashing the fallback', async () => {
    // This is the exact failing shape from the hacker-news example: a transition
    // changes the key and the boundary HOLDS on the new page's in-flight fetch;
    // then the query observer notifies ASYNCHRONOUSLY (a setTimeout(0) macrotask)
    // so a SUBSEQUENT re-render that re-suspends on a DIFFERENT in-flight query
    // runs at URGENT priority. React keeps the prior content on screen; pre-fix
    // octane flashed the @pending fallback on that urgent re-suspend.
    //
    // We model the urgent macrotask re-render by changing the key to value=3
    // urgently (NOT wrapped in a transition) WHILE the boundary is still held on
    // value=2 — exactly the priority the observer notify lands at.
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    const d3 = deferred<string>()
    const promises: Record<number, Promise<string>> = {
      1: d1.promise,
      2: d2.promise,
      3: d3.promise,
    }
    const queryFn = (v: number) => promises[v]

    let setValue!: (v: number) => void
    let setValueUrgent!: (v: number) => void
    const bindSetValue = (fn: (v: number) => void) => {
      setValue = fn
    }
    const bindSetValueUrgent = (fn: (v: number) => void) => {
      setValueUrgent = fn
    }

    const r = mount(TransitionSuspenseApp, {
      client,
      queryFn,
      bindSetValue,
      bindSetValueUrgent,
    })
    expect(r.find('#fallback').textContent).toBe('loading')
    d1.resolve('one')
    await flush()
    expect(r.find('#data').textContent).toBe('data:one')
    expect(r.find('#pending').textContent).toBe('idle')

    // Watch the DOM through the whole move so a transient fallback flash (or any
    // removal of the value=1 content) is caught — the flash is not visible at a
    // settled checkpoint.
    let fallbackEverSeen = false
    let contentEverLost = false
    const mo = new MutationObserver(() => {
      if (r.container.querySelector('#fallback')) fallbackEverSeen = true
      if (!r.container.querySelector('#data')) contentEverLost = true
    })
    mo.observe(r.container, { childList: true, subtree: true })

    // Transition to value=2 → boundary HOLDS content-one on the value=2 fetch.
    await act(() => setValue(2))
    await flush()
    expect(r.find('#data').textContent).toBe('data:one')
    expect(fallbackEverSeen).toBe(false)

    // While STILL held, an URGENT key change to value=3 re-renders the reader
    // under key ['…', 3] and re-suspends on the value=3 fetch — a DIFFERENT
    // thenable, at urgent priority. React holds; pre-fix octane flashed here.
    await act(() => setValueUrgent(3))
    await flush()
    expect(r.find('#data').textContent).toBe('data:one') // OLD content still held
    expect(fallbackEverSeen).toBe(false) // <- pre-fix this FLASHED (true)
    expect(r.find('#pending').textContent).toBe('pending')

    // Resolve the value=3 fetch → the held boundary commits content-three all at
    // once and isPending returns to idle.
    d2.resolve('two')
    d3.resolve('three')
    await flush()
    mo.disconnect()

    expect(fallbackEverSeen).toBe(false) // never flashed at any point
    expect(contentEverLost).toBe(false) // value=1 content was never removed
    expect(r.find('#data').textContent).toBe('data:three')
    expect(r.findAll('#fallback')).toHaveLength(0)
    expect(r.find('#pending').textContent).toBe('idle')

    r.unmount()
  })
})
