/**
 * Streaming SSR entry for the hydration window tests. Renders StreamApp with
 * renderToStream, capturing each written chunk with a timestamp so the test
 * can replay the stream in phases (shell + fast boundary first, slow boundary
 * later) and probe the window in between.
 */
import { renderToStream } from '@solidjs/web'
import { QueryClient } from '@tanstack/solid-query'
import { StreamApp } from './StreamApp'
import type { Query } from '@tanstack/solid-query'
import type { StreamCounts } from './StreamApp'

const client = new QueryClient()
const counts: StreamCounts = { header: 0, feed: 0 }

// The provider clears the cache when the render disposes (the SSR
// teardown), so query states are recorded live off cache events rather
// than read back after completion.
const snapshots = new Map<
  string,
  { queryKey: unknown; queryHash: string; state: unknown }
>()
client.getQueryCache().subscribe((event) => {
  if (event.type === 'removed') return
  const query: Query<any, any, any, any> = event.query
  snapshots.set(query.queryHash, {
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    state: query.state,
  })
})

const start = Date.now()
const chunks: Array<{ t: number; payload: string }> = []

await new Promise<void>((resolve) => {
  renderToStream(() => (
    <StreamApp client={client} source="server" counts={counts} />
  )).pipe({
    write(payload: string) {
      chunks.push({ t: Date.now() - start, payload })
    },
    end() {
      resolve()
    },
  })
})

const cacheEmptyAfterDispose = client.getQueryCache().getAll().length === 0

console.log(
  JSON.stringify({
    chunks,
    counts,
    queries: [...snapshots.values()],
    cacheEmptyAfterDispose,
  }),
)
