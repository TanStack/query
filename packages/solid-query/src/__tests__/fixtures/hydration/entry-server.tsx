/**
 * SSR entry for the hydration tests. Runs in a plain node subprocess so that
 * `solid-js` resolves to its server build. Renders the fixture app and prints
 * a JSON report (HTML with embedded hydration scripts, fetch counts, and the
 * dehydrated-ish query states) on stdout.
 */
import { renderToStringAsync } from '@solidjs/web'
import { QueryClient } from '@tanstack/solid-query'
import { App } from './App'
import type { FetchCounts } from './App'

const client = new QueryClient()
const counts: FetchCounts = { fresh: 0, stale: 0 }

const html = await renderToStringAsync(() => (
  <App client={client} source="server" counts={counts} />
))

const queries = client
  .getQueryCache()
  .getAll()
  .map((query) => ({
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    state: query.state,
  }))

console.log(JSON.stringify({ html, counts, queries }))
