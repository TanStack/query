/**
 * SSR entry for the hydration tests. Runs in a plain node subprocess so that
 * `solid-js` resolves to its server build. Renders the fixture app and prints
 * a JSON report (HTML with embedded hydration scripts, fetch counts, and the
 * dehydrated-ish query states) on stdout.
 */
import { renderToStream } from '@solidjs/web'
import { QueryClient } from '@tanstack/solid-query'
import { App } from './App'
import type { Query } from '@tanstack/solid-query'
import type { FetchCounts } from './App'

interface QuerySnapshot {
  queryKey: unknown
  queryHash: string
  state: unknown
}

/**
 * The provider clears the cache when the render disposes (the SSR
 * teardown), so query states are recorded live off cache events rather
 * than read back after completion. States are immutable objects in
 * query-core; keeping the latest per hash is an accurate snapshot.
 */
function trackSnapshots(client: QueryClient): Map<string, QuerySnapshot> {
  const snapshots = new Map<string, QuerySnapshot>()
  const record = (query: Query<any, any, any, any>) => {
    snapshots.set(query.queryHash, {
      queryKey: query.queryKey,
      queryHash: query.queryHash,
      state: query.state,
    })
  }
  client.getQueryCache().subscribe((event) => {
    if (event.type !== 'removed') record(event.query)
  })
  return snapshots
}

function renderApp(client: QueryClient, counts: FetchCounts): Promise<string> {
  return new Promise<string>((resolve) => {
    let out = ''
    // Collected through pipe() rather than the thenable form so the fixture
    // builds against any solid-js 2 beta (renderToStringAsync was removed
    // after beta.29).
    renderToStream(() => (
      <App client={client} source="server" counts={counts} />
    )).pipe({
      write(payload: string) {
        out += payload
      },
      end() {
        resolve(out)
      },
    })
  })
}

const client = new QueryClient()
const counts: FetchCounts = {
  fresh: 0,
  stale: 0,
  placeholder: 0,
  prefetched: 0,
}
const snapshots = trackSnapshots(client)
const html = await renderApp(client, counts)

// The dispose-time teardown must have emptied the per-request cache.
const cacheEmptyAfterDispose = client.getQueryCache().getAll().length === 0

// Second pass: same app on a client whose standard dehydrate filter
// excludes the stale query — its registry entry must stay off the wire
// while the others still ship.
const filteredClient = new QueryClient({
  defaultOptions: {
    dehydrate: {
      shouldDehydrateQuery: (query) => query.queryKey[0] !== 'stale',
    },
  },
})
const filteredCounts: FetchCounts = {
  fresh: 0,
  stale: 0,
  placeholder: 0,
  prefetched: 0,
}
const filteredHtml = await renderApp(filteredClient, filteredCounts)

console.log(
  JSON.stringify({
    html,
    counts,
    queries: [...snapshots.values()],
    cacheEmptyAfterDispose,
    filteredHtml,
  }),
)
