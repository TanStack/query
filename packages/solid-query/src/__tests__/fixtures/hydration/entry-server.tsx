/**
 * SSR entry for the hydration tests. Runs in a plain node subprocess so that
 * `solid-js` resolves to its server build. Renders the fixture app and prints
 * a JSON report (HTML with embedded hydration scripts, fetch counts, and the
 * dehydrated-ish query states) on stdout.
 */
import { renderToStream } from '@solidjs/web'
import { QueryClient } from '@tanstack/solid-query'
import { App } from './App'
import type { FetchCounts } from './App'

const client = new QueryClient()
const counts: FetchCounts = { fresh: 0, stale: 0, placeholder: 0 }

// Fully-settled single-string render. Collected through pipe() rather than
// the thenable form so the fixture builds against any solid-js 2 beta
// (renderToStringAsync was removed after beta.29).
const html = await new Promise<string>((resolve) => {
  let out = ''
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

const queries = client
  .getQueryCache()
  .getAll()
  .map((query) => ({
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    state: query.state,
  }))

console.log(JSON.stringify({ html, counts, queries }))
