/**
 * End-to-end SSR → hydration tests for solid-query.
 *
 * The fixture app in `fixtures/hydration/` is built with vite (server,
 * streaming-server, and hydratable client bundles). SSR runs in a node
 * subprocess so `solid-js` resolves to its server build; the resulting HTML
 * (including Solid's serialized hydration payload) is then hydrated in this
 * jsdom process with the real `hydrate()` from `@solidjs/web`.
 */
import { hydrate as hydrateQueryClient } from '@tanstack/query-core'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  applyChunks,
  bootstrapHydrationGlobals,
  buildFixture,
  cleanupFixture,
  microtasks,
  tick,
} from './hydration-utils'
import type { ClientBundle, Harness } from './hydration-utils'

let harness: Harness
let bundle: ClientBundle

beforeAll(async () => {
  harness = buildFixture()
  bundle = (await import(
    /* @vite-ignore */ harness.clientBundleUrl
  )) as ClientBundle
}, 180_000)

afterAll(() => {
  cleanupFixture(harness)
})

describe('SSR hydration', () => {
  it('server render produces data and per-node hydration payloads', () => {
    const { string } = harness.report
    // The placeholder query must NOT fetch during SSR: the data compute
    // serves the placeholder before the fetch-pull branch, so the
    // placeholder itself is the render output.
    expect(string.counts).toEqual({ fresh: 1, stale: 1, placeholder: 0 })
    expect(string.html).toContain('fresh-server')
    expect(string.html).toContain('stale-server')
    // The node payload is the transport: each data projection serializes
    // its settled root ({ value, t }) under its own hydration id — `t`
    // (dataUpdatedAt) is what lets the hydrating client reconstruct the
    // cache entry with staleness intact. There is no second, cache-level
    // dehydration channel...
    expect(string.html).toMatch(/\{value:"fresh-server",t:\d+\}/)
    expect(string.html).toMatch(/\{value:"stale-server",t:\d+\}/)
    expect(string.html).not.toContain('dehydratedAt')
    // ...and the per-observer-result hydrationData copy is gone.
    expect(string.html).not.toContain('hydrationData')

    // Meta guards serialize SETTLED state only (status|isFetching|isSuccess|
    // isFetchedAfterMount from the fixture's #meta span). Boundaries hold
    // until async settles; meta must honor the same contract — a transient
    // 'pending'/'fetching'/isFetchedAfterMount-true here would contradict
    // what the hydrating client computes from the primed cache.
    const meta = /<span id="meta"[^>]*>(.*?)<\/span>/.exec(string.html)![1]!
    expect(meta.replace(/<!--[^>]*-->/g, '')).toBe('success|false|true|false')

    // Cross-cache aggregates (useIsFetching) serialize the hydration-time
    // truth: the hydrating client's own fetches are held inside the window
    // and primed entries land settled, so it can only ever compute 0 at
    // claim time — any other serialized value is a structural mismatch in
    // waiting (a server-side in-flight count does not transfer).
    const global = /<span id="global"[^>]*>(.*?)<\/span>/.exec(string.html)![1]!
    expect(global.replace(/<!--[^>]*-->/g, '')).toBe('0')

    // Placeholder serializes AS the placeholder (data|isPlaceholderData|
    // status): no boundary hold, the status face masks to 'success' on
    // both sides, and the hydrating client computes the identical
    // placeholder from its unprimed cache — no mismatch, no undermining
    // of the streamed payload (a placeholder derive settles synchronously,
    // so its node serializes nothing and the client fetches after its
    // window closes).
    const ph = /<span id="ph"[^>]*>(.*?)<\/span>/.exec(string.html)![1]!
    expect(ph.replace(/<!--[^>]*-->/g, '')).toBe(
      'placeholder-value|true|success',
    )
  })

  it('hydration primes the query cache and refetches only per staleness rules', async () => {
    const { string } = harness.report
    const app = bundle.createApp()
    const container = document.createElement('div')
    document.body.appendChild(container)
    bootstrapHydrationGlobals()
    container.innerHTML = string.html

    // jsdom does not execute scripts inserted via innerHTML; replay them in
    // document order the way a browser would.
    for (const script of Array.from(container.querySelectorAll('script'))) {
      if (script.textContent) {
        window.eval(script.textContent)
      }
      script.remove()
    }

    const dispose = app.mount(container)

    try {
      // Cache must be warm within microtasks of hydration (each hook
      // primes from its own node entry at setup, before a browser would
      // paint): same data and the server's dataUpdatedAt — `t` rides the
      // serialized root, and priming goes through hydrate() newer-wins
      // semantics.
      await microtasks()
      const serverFresh = string.queries.find(
        (q) => q.queryHash === '["fresh"]',
      )!
      const freshState = app.queryClient.getQueryState(['fresh'])
      expect(freshState?.data).toBe('fresh-server')
      expect(freshState?.dataUpdatedAt).toBe(serverFresh.state.dataUpdatedAt)

      const staleState = app.queryClient.getQueryState(['stale'])
      expect(staleState?.data).toBe('stale-server')

      // The DOM keeps showing the server-rendered fresh data.
      expect(container.querySelector('#fresh')?.textContent).toBe(
        'fresh-server',
      )

      // The immediately-stale query refetches on mount (normal staleness
      // rules) and updates the DOM with client data.
      await vi.waitFor(() => {
        expect(app.counts.stale).toBe(1)
        expect(container.querySelector('#stale')?.textContent).toBe(
          'stale-client',
        )
      })

      // ...while the fresh query was never fetched again.
      expect(app.counts.fresh).toBe(0)
      expect(container.querySelector('#fresh')?.textContent).toBe(
        'fresh-server',
      )

      // The placeholder query hydrated showing its placeholder (identical
      // to the server HTML), then fetched for real once its window closed
      // (its node had no serialized entry) and swapped in data.
      await vi.waitFor(() => {
        expect(app.counts.placeholder).toBe(1)
        expect(container.querySelector('#ph')?.textContent).toContain(
          'placeholder-resolved-client',
        )
      })

      // The serialized observer results no longer carry a hydrationData
      // copy at all — the node payload is the only transport.
      const registry = (globalThis as any)._$HY.r as Record<string, any>
      const lingering = Object.values(registry).filter((entry) => {
        const value = entry != null && entry.s === 1 ? entry.v : entry
        return (
          value != null && typeof value === 'object' && 'hydrationData' in value
        )
      })
      expect(lingering).toEqual([])
    } finally {
      dispose()
      container.remove()
    }
  })

  it('applies cache writes that land between priming and subscriber attach', async () => {
    const { string } = harness.report
    const app = bundle.createApp()
    const container = document.createElement('div')
    document.body.appendChild(container)
    bootstrapHydrationGlobals()
    container.innerHTML = string.html
    for (const script of Array.from(container.querySelectorAll('script'))) {
      if (script.textContent) window.eval(script.textContent)
      script.remove()
    }

    const dispose = app.mount(container)
    try {
      // Synchronously after hydrate() returns — before the subscriber attach
      // microtask has run — write newer data into the cache, the way an
      // already-live component (or a settling mutation) would.
      app.queryClient.setQueryData(['fresh'], 'updated-client')

      // The hydrated component must pick the write up when its subscriber
      // attaches, without any refetch.
      await vi.waitFor(() => {
        expect(container.querySelector('#fresh')?.textContent).toBe(
          'updated-client',
        )
      })
      expect(app.counts.fresh).toBe(0)
    } finally {
      dispose()
      container.remove()
    }
  })

  it('coexists with a host that primes the cache through its own hydrate() channel', async () => {
    // TanStack Start-style hosts apply a dehydrated QueryClient via
    // query-core hydrate() before Solid's DOM hydrate() runs. The hooks'
    // own node priming then re-applies the same entries; pin that the
    // second application is silent (hydrate() only writes strictly-newer
    // data, so equal dataUpdatedAt is a no-op with no observer
    // notification) and that attach coordination still resolves.
    const { string } = harness.report
    const app = bundle.createApp()
    const container = document.createElement('div')
    document.body.appendChild(container)
    bootstrapHydrationGlobals()
    container.innerHTML = string.html
    for (const script of Array.from(container.querySelectorAll('script'))) {
      if (script.textContent) window.eval(script.textContent)
      script.remove()
    }

    // The host's channel primes first, with the exact server states.
    hydrateQueryClient(app.queryClient, {
      queries: string.queries.map((q) => ({
        queryKey: q.queryKey,
        queryHash: q.queryHash,
        state: q.state,
        dehydratedAt: q.state.dataUpdatedAt,
      })),
      mutations: [],
    })

    // Record every cache update from here on: the provider channel's
    // re-priming must not produce any for the already-primed fresh query.
    const updatedHashes: Array<string> = []
    const unsubscribe = app.queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated') updatedHashes.push(event.query.queryHash)
    })

    const dispose = app.mount(container)
    try {
      // Attach coordination is not deadlocked by the pre-primed cache: the
      // channel still yields, waiters resolve, the observer subscribes.
      await vi.waitFor(() => {
        expect(
          app.queryClient
            .getQueryCache()
            .find({ queryKey: ['fresh'] })
            ?.getObserversCount(),
        ).toBe(1)
      })

      // Double-priming was silent: no state write, no observer churn, no
      // refetch of the fresh query. (The stale query's mount refetch per
      // normal staleness rules is the only update source.)
      expect(updatedHashes.filter((hash) => hash === '["fresh"]')).toEqual([])
      expect(app.counts.fresh).toBe(0)
      expect(container.querySelector('#fresh')?.textContent).toBe(
        'fresh-server',
      )
      await vi.waitFor(() => {
        expect(app.counts.stale).toBe(1)
      })

      // And the component is live afterwards.
      app.queryClient.setQueryData(['fresh'], 'updated-client')
      await vi.waitFor(() => {
        expect(container.querySelector('#fresh')?.textContent).toBe(
          'updated-client',
        )
      })
    } finally {
      unsubscribe()
      dispose()
      container.remove()
    }
  })
})

describe('streaming SSR hydration', () => {
  function splitStream() {
    const { chunks } = harness.report.stream
    const idx = chunks.findIndex((c) => c.payload.includes('feed-server'))
    expect(idx).toBeGreaterThan(0)
    return {
      phase1: chunks.slice(0, idx).map((c) => c.payload),
      phase2: chunks.slice(idx).map((c) => c.payload),
    }
  }

  it('primes shell-flush entries at shell hydration, not at stream end', async () => {
    const { phase1, phase2 } = splitStream()
    const app = bundle.createStreamApp()
    const container = document.createElement('div')
    document.body.appendChild(container)
    bootstrapHydrationGlobals()

    // Deliver only the first flush; the stream stays open (phase2 is never
    // applied until later), so anything observable now provably did not
    // wait for stream end.
    applyChunks(container, phase1)
    const dispose = app.mount(container)

    try {
      // The header query settled before the first flush, so its node
      // entry rides the same chunks — the hook primes from it within
      // microtasks of shell hydration, with the server's dataUpdatedAt
      // intact (`t` on the serialized root).
      await microtasks()
      const serverHeader = harness.report.stream.queries.find(
        (q) => q.queryHash === '["header"]',
      )!
      const headerState = app.queryClient.getQueryState(['header'])
      expect(headerState?.data).toBe('header-server')
      expect(headerState?.dataUpdatedAt).toBe(serverHeader.state.dataUpdatedAt)
      // Fresh (staleTime 60s) hydrated data — no mount refetch.
      expect(app.counts.header).toBe(0)
      // The observer attached (per-query, not at hydration end): the query
      // is active while the stream is still open.
      expect(
        app.queryClient
          .getQueryCache()
          .find({ queryKey: ['header'] })
          ?.getObserversCount(),
      ).toBe(1)

      // The feed entry rides the second flush; it must not be primed early.
      expect(app.queryClient.getQueryState(['feed'])).toBeUndefined()

      // When the boundary's flush arrives, its entry arrives with it.
      applyChunks(container, phase2)
      await vi.waitFor(() => {
        expect(app.queryClient.getQueryState(['feed'])?.data).toBe(
          'feed-server',
        )
        expect(container.querySelector('#feed')?.textContent).toBe(
          'feed-server',
        )
      })
      expect(app.counts.feed).toBe(0)
      await tick(30)
    } finally {
      dispose()
      container.remove()
    }
  })

  it('primes everything when hydration starts after the whole stream arrived (buffered replay)', async () => {
    // Hydration long after the stream completed (slow client / late
    // script): every node entry is already settled in the registry when
    // the components mount, so each hook primes synchronously at setup
    // from its own entry. All entries primed, all observers attached, no
    // refetches — and the takeover recompute at hydration end must not
    // race ahead of a not-yet-primed hook (the `primed` gate).
    const { chunks } = harness.report.stream
    const app = bundle.createStreamApp()
    const container = document.createElement('div')
    document.body.appendChild(container)
    bootstrapHydrationGlobals()

    // Deliver the ENTIRE stream before mounting.
    applyChunks(
      container,
      chunks.map((c) => c.payload),
    )
    const dispose = app.mount(container)

    try {
      await microtasks()
      // Both queries primed with the server's exact states, from the single
      // conflated snapshot.
      for (const key of ['header', 'feed'] as const) {
        const server = harness.report.stream.queries.find(
          (q) => q.queryHash === `["${key}"]`,
        )!
        const state = app.queryClient.getQueryState([key])
        expect(state?.data).toBe(`${key}-server`)
        expect(state?.dataUpdatedAt).toBe(server.state.dataUpdatedAt)
      }
      // Both observers attach (the done snapshot was not dropped, waiters
      // resolved) and neither fresh query refetches.
      await vi.waitFor(() => {
        expect(
          app.queryClient
            .getQueryCache()
            .find({ queryKey: ['header'] })
            ?.getObserversCount(),
        ).toBe(1)
        expect(
          app.queryClient
            .getQueryCache()
            .find({ queryKey: ['feed'] })
            ?.getObserversCount(),
        ).toBe(1)
      })
      expect(app.counts).toEqual({ header: 0, feed: 0 })

      // And the late-hydrated components are live.
      app.queryClient.setQueryData(['feed'], 'updated-client')
      await vi.waitFor(() => {
        expect(container.querySelector('#feed')?.textContent).toBe(
          'updated-client',
        )
      })
    } finally {
      dispose()
      container.remove()
    }
  })

  // The data node has default ('server') hydration semantics: the
  // serialized server value owns the DOM for the whole hydration window,
  // and a latched node that recomputes mid-stream (a cache write landed)
  // arms the engine's hydration-end takeover — the change commits when the
  // stream closes, deferred rather than lost. Network activity is NOT
  // deferred: observers attach per-query as the channel primes, so
  // mid-stream invalidations refetch immediately.
  it('cache writes during the open stream commit when hydration completes', async () => {
    const { phase1, phase2 } = splitStream()
    const app = bundle.createStreamApp()
    const container = document.createElement('div')
    document.body.appendChild(container)
    bootstrapHydrationGlobals()

    // Deliver the shell and the fast boundary only; the slow boundary keeps
    // the page in "hydration in progress" state.
    applyChunks(container, phase1)
    const dispose = app.mount(container)

    try {
      expect(container.querySelector('#header')?.textContent).toBe(
        'header-server',
      )
      // The slow section still shows its fallback.
      expect(container.querySelector('#feed')).toBeNull()

      // A write while the stream is open reaches the CACHE immediately but
      // not the DOM — the serialized server value holds the document.
      app.queryClient.setQueryData(['header'], 'updated-client')
      await tick(30)
      expect(app.queryClient.getQueryData(['header'])).toBe('updated-client')
      expect(container.querySelector('#header')?.textContent).toBe(
        'header-server',
      )

      // An invalidation while the stream is open refetches immediately
      // (the observer is subscribed — network is not deferred), but the
      // result is held with the rest.
      void app.queryClient.invalidateQueries({ queryKey: ['header'] })
      await vi.waitFor(() => {
        expect(app.counts.header).toBe(1)
      })
      expect(container.querySelector('#header')?.textContent).toBe(
        'header-server',
      )

      // The late boundary hydrates, closing the stream — the divergence
      // takeover re-runs the latched node and the held state commits.
      applyChunks(container, phase2)
      await vi.waitFor(() => {
        expect(container.querySelector('#feed')?.textContent).toBe(
          'feed-server',
        )
      })
      await vi.waitFor(() => {
        expect(container.querySelector('#header')?.textContent).toBe(
          'header-client',
        )
      })
      expect(app.counts.feed).toBe(0)

      // And fully live from then on.
      app.queryClient.setQueryData(['header'], 'updated-live')
      await vi.waitFor(() => {
        expect(container.querySelector('#header')?.textContent).toBe(
          'updated-live',
        )
      })
    } finally {
      dispose()
      container.remove()
    }
  })
})
