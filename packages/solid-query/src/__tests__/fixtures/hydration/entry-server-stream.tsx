/**
 * Streaming SSR entry for the hydration window tests. Renders StreamApp with
 * renderToStream, capturing each written chunk with a timestamp so the test
 * can replay the stream in phases (shell + fast boundary first, slow boundary
 * later) and probe the window in between.
 */
import { renderToStream } from '@solidjs/web'
import { QueryClient } from '@tanstack/solid-query'
import { StreamApp } from './StreamApp'
import type { StreamCounts } from './StreamApp'

const client = new QueryClient()
const counts: StreamCounts = { header: 0, feed: 0 }

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

const queries = client
  .getQueryCache()
  .getAll()
  .map((query) => ({
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    state: query.state,
  }))

console.log(JSON.stringify({ chunks, counts, queries }))
