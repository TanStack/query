/**
 * Parity sweep — the behaviors added/fixed to close the audit gaps: the suspense
 * clearReset retry loop, render-prop QueryErrorResetBoundary, HydrationBoundary
 * newer/older/streaming semantics, experimental_prefetchInRender's promise,
 * useQueries combine, skipToken, fetchNextPage, useSuspenseInfiniteQuery,
 * usePrefetchInfiniteQuery, useMutationState filters+select, tracked-props
 * render efficiency, and the isRestoring true→false flip.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient, dehydrate } from '@tanstack/octane-query'
import { mount, nextPaint } from '../_helpers'
import {
  CombineApp,
  FlipRestoringApp,
  HydrationApp,
  InfiniteApp,
  MutationStateApp,
  PrefetchInRenderApp,
  PrefetchInfiniteApp,
  RenderPropResetApp,
  SkipTokenApp,
  SuspenseInfiniteApp,
  SuspenseRetryApp,
  TrackedApp,
  mutationCounter,
  promiseCapture,
  renderPropValues,
  restoreSetter,
  trackedRenders,
} from '../_fixtures/parity.tsrx'

let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.mount()
})

async function flush(n = 6) {
  for (let i = 0; i < n; i++) {
    await new Promise((r) => setTimeout(r, 0))
    await nextPaint()
  }
}

describe('suspense error retry loop (clearReset)', () => {
  it('reset → retry → fail AGAIN re-throws to the boundary (no undefined-data fall-through)', async () => {
    let calls = 0
    const queryFn = () => {
      calls++
      return Promise.reject(new Error('boom-' + calls))
    }
    const r = mount(SuspenseRetryApp, { client, queryFn })
    await flush()

    // First failure reaches the boundary.
    expect(r.find('#sq-msg').textContent).toBe('boom-1')

    // Reset + retry: the refetch fails again — the boundary must re-show the
    // error. Before the clearReset fix, isReset() stayed true at replay so the
    // component fell through and rendered undefined data.
    ;(r.find('#sq-retry') as HTMLElement).click()
    await flush()

    expect(calls).toBeGreaterThanOrEqual(2)
    expect(r.findAll('#sq-data').length).toBe(0)
    expect(r.find('#sq-msg').textContent).toContain('boom')
    r.unmount()
  })
})

describe('QueryErrorResetBoundary render-prop children', () => {
  it('invokes function children with the boundary value', async () => {
    renderPropValues.length = 0
    const r = mount(RenderPropResetApp, { client })
    await flush()

    expect(r.find('#rp-child').textContent).toBe('reset:function')
    const value = renderPropValues[0] as any
    expect(typeof value.reset).toBe('function')
    expect(typeof value.isReset).toBe('function')
    expect(typeof value.clearReset).toBe('function')
    // The provided context value is the same object handed to children.
    expect(value.isReset()).toBe(false)
    value.reset()
    expect(value.isReset()).toBe(true)
    r.unmount()
  })
})

describe('HydrationBoundary', () => {
  // Real dehydrate() payload for `key`, with dataUpdatedAt shifted so the
  // entry is deterministically newer/older than the cache.
  function dehydratedWith(
    key: Array<unknown>,
    data: string,
    dataUpdatedAt: number,
  ) {
    const source = new QueryClient()
    source.setQueryData(key, data)
    const state = dehydrate(source) as any
    state.queries[0].state.dataUpdatedAt = dataUpdatedAt
    return state
  }

  it('hydrates NEWER dehydrated data over the cache, leaves NEWER cache data alone', async () => {
    const key = ['h1']
    client.setQueryData(key, 'cached')
    const cachedAt = client.getQueryCache().find({ queryKey: key })!.state
      .dataUpdatedAt

    // Newer dehydrated entry — wins.
    const r = mount(HydrationApp, {
      client,
      state: dehydratedWith(key, 'newer', cachedAt + 1000),
      queryKey: key,
    })
    await flush()
    expect(r.find('#hydrated').textContent).toBe('newer')
    r.unmount()

    // Older dehydrated entry — must NOT clobber.
    const r2 = mount(HydrationApp, {
      client,
      state: dehydratedWith(key, 'older', cachedAt - 1000),
      queryKey: key,
    })
    await flush()
    expect(r2.find('#hydrated').textContent).toBe('newer')
    r2.unmount()
  })

  it('a dehydrated STREAMING entry (pending promise + later dehydratedAt) re-hydrates a settled query', async () => {
    const key = ['h2']
    client.setQueryData(key, 'settled')

    // A REAL streaming chunk: dehydrate a source whose query is still
    // PENDING, with the documented streaming opt-in (shouldDehydrateQuery
    // including pending) — the payload then carries the in-flight promise +
    // dehydratedAt. Its dataUpdatedAt is 0 (no data yet), so only upstream's
    // streaming condition (promise && dehydratedAt > cache.dataUpdatedAt)
    // applies.
    const source = new QueryClient()
    const inFlight = source.prefetchQuery({
      queryKey: key,
      queryFn: () =>
        new Promise<string>((res) => setTimeout(() => res('streamed'), 5)),
    })
    const chunk = dehydrate(source, {
      shouldDehydrateQuery: () => true,
    }) as any
    expect(chunk.queries[0].promise).toBeTruthy()
    chunk.queries[0].dehydratedAt =
      client.getQueryCache().find({ queryKey: key })!.state.dataUpdatedAt + 1000

    const r = mount(HydrationApp, { client, state: chunk, queryKey: key })
    await inFlight
    await flush()
    expect(r.find('#hydrated').textContent).toBe('streamed')
    r.unmount()
  })

  it('round-trips a real dehydrate() payload', async () => {
    const source = new QueryClient()
    source.setQueryData(['rt'], 'round-trip')
    const state = dehydrate(source)

    const r = mount(HydrationApp, { client, state, queryKey: ['rt'] })
    await flush()
    expect(r.find('#hydrated').textContent).toBe('round-trip')
    r.unmount()
  })
})

describe('experimental_prefetchInRender', () => {
  it('result.promise resolves with the data', async () => {
    promiseCapture.promise = null
    const queryFn = () =>
      new Promise<string>((res) => setTimeout(() => res('pir-data'), 5))
    const r = mount(PrefetchInRenderApp, { client, queryFn })

    expect(promiseCapture.promise).toBeTruthy()
    await expect(promiseCapture.promise).resolves.toBe('pir-data')
    await flush()
    expect(r.find('#pir').textContent).toBe('data:pir-data')
    r.unmount()
  })
})

describe('useQueries combine', () => {
  it('renders the combined aggregate, not the raw results array', async () => {
    const r = mount(CombineApp, { client })
    await flush()
    expect(r.find('#combined').textContent).toBe('3:true')
    r.unmount()
  })
})

describe('skipToken', () => {
  it('disables the query — pending status, idle fetchStatus, no fetch', async () => {
    const r = mount(SkipTokenApp, { client })
    await flush()
    expect(r.find('#skip').textContent).toBe('pending:idle')
    r.unmount()
  })
})

describe('useInfiniteQuery fetchNextPage', () => {
  it('appends pages and reports hasNextPage', async () => {
    const pageFn = (page: number) => Promise.resolve('p' + page)
    const r = mount(InfiniteApp, { client, pageFn })
    await flush()
    expect(r.find('#pages').textContent).toBe('p0')
    expect(r.find('#has-next').textContent).toBe('true')
    ;(r.find('#next') as HTMLElement).click()
    await flush()
    expect(r.find('#pages').textContent).toBe('p0,p1')
    ;(r.find('#next') as HTMLElement).click()
    await flush()
    expect(r.find('#pages').textContent).toBe('p0,p1,p2')
    expect(r.find('#has-next').textContent).toBe('false')
    r.unmount()
  })
})

describe('useSuspenseInfiniteQuery', () => {
  it('suspends then renders the first page', async () => {
    const pageFn = (page: number) =>
      new Promise<string>((res) => setTimeout(() => res('sp' + page), 5))
    const r = mount(SuspenseInfiniteApp, { client, pageFn })
    expect(r.findAll('#sinf-loading').length).toBe(1)
    await flush()
    expect(r.find('#sinf').textContent).toBe('sp0')
    r.unmount()
  })
})

describe('usePrefetchInfiniteQuery', () => {
  it('primes the cache with the first page', async () => {
    const pageFn = (page: number) => Promise.resolve('pf' + page)
    const r = mount(PrefetchInfiniteApp, { client, pageFn })
    await flush()
    const state = client.getQueryState(['pinf']) as any
    expect(state?.data?.pages).toEqual(['pf0'])
    r.unmount()
  })
})

describe('useMutationState filters + select', () => {
  it('selects variables of mutations matching the key filter', async () => {
    mutationCounter.n = 0
    const mutationFn = (v: string) => Promise.resolve(v)
    const r = mount(MutationStateApp, { client, mutationFn })
    await flush()
    expect(r.find('#vars').textContent).toBe('none')
    ;(r.find('#mutate') as HTMLElement).click()
    await flush()
    expect(r.find('#vars').textContent).toBe('v-1')
    ;(r.find('#mutate') as HTMLElement).click()
    await flush()
    expect(r.find('#vars').textContent).toBe('v-1,v-2')
    r.unmount()
  })
})

describe('tracked properties', () => {
  it('a data-only reader does NOT re-render on an isFetching-only change', async () => {
    trackedRenders.count = 0
    const queryFn = () =>
      new Promise<string>((res) => setTimeout(() => res('t'), 2))
    const r = mount(TrackedApp, { client, queryFn })
    await flush()
    expect(r.find('#tracked').textContent).toBe('t')
    const rendersAfterLoad = trackedRenders.count

    // A background refetch resolving to the SAME data flips isFetching
    // true→false but leaves data untouched — the tracked-props subscription
    // must not re-render the component for it.
    await client.refetchQueries({ queryKey: ['tracked'] })
    await flush()
    expect(r.find('#tracked').textContent).toBe('t')
    expect(trackedRenders.count).toBe(rendersAfterLoad)
    r.unmount()
  })
})

describe('isRestoring flip', () => {
  it('true → false starts the fetch that restore was holding back', async () => {
    let calls = 0
    const queryFn = () => {
      calls++
      return Promise.resolve('restored')
    }
    const r = mount(FlipRestoringApp, { client, queryFn })
    await flush()
    expect(calls).toBe(0)
    expect(r.find('#flip').textContent).toBe('pending')

    restoreSetter.set!(false)
    await flush()
    expect(calls).toBeGreaterThan(0)
    expect(r.find('#flip').textContent).toBe('data:restored')
    r.unmount()
  })
})
