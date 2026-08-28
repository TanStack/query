/**
 * Client entry for the hydration tests. Bundled with the hydratable DOM
 * transform and imported dynamically by the jsdom test, which then calls
 * `mount()` against the server-rendered markup. Factories return fresh
 * QueryClient/counters per call so multiple tests can share the bundle.
 */
import { hydrate } from '@solidjs/web'
import { createSignal } from 'solid-js'
import { QueryClient } from '@tanstack/solid-query'
import { App } from './App'
import { StreamApp } from './StreamApp'
import type { FetchCounts } from './App'
import type { StreamCounts } from './StreamApp'

export function createApp() {
  const queryClient = new QueryClient()
  const counts: FetchCounts = {
    fresh: 0,
    stale: 0,
    placeholder: 0,
    prefetched: 0,
  }
  const [lateMount, setLateMount] = createSignal(false)
  return {
    queryClient,
    counts,
    /** Mount the subtree the server never rendered (see `LateConsumer`). */
    showLate: () => setLateMount(true),
    mount(container: HTMLElement): () => void {
      return hydrate(
        () => (
          <App
            client={queryClient}
            source="client"
            counts={counts}
            lateMount={lateMount}
          />
        ),
        container,
      )
    },
  }
}

export function createStreamApp() {
  const queryClient = new QueryClient()
  const counts: StreamCounts = { header: 0, feed: 0 }
  return {
    queryClient,
    counts,
    mount(container: HTMLElement): () => void {
      return hydrate(
        () => (
          <StreamApp client={queryClient} source="client" counts={counts} />
        ),
        container,
      )
    },
  }
}
