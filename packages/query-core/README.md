# @tanstack/query-core

The ESM query and mutation cache for JavaScript and TypeScript. Use it directly or through the Angular, Lit, Preact, React, Solid, Svelte, and Vue adapters.

Create a `QueryClient` and pass it as the first argument to each operation. This example fetches a list of titles, then marks the matching cached queries stale.

```ts
import { QueryClient, query, invalidateQueries } from '@tanstack/query-core'

const client = new QueryClient()

const titles = await query(client, {
  queryKey: ['books', 'featured'],
  queryFn: async (): Promise<string[]> => {
    const response = await fetch('/api/featured-titles')
    if (!response.ok) throw new Error('Could not load featured titles')
    return response.json()
  },
})

await invalidateQueries(client, { queryKey: ['books'] })
```

Import `infiniteQuery` for pagination, `refetchInterval` for observer polling, or `getMutationCache` to access the client's mutation cache. Pass the same client to the React adapter's `QueryClientProvider` to share cached data between direct calls and components.

Use `findCachedQuery(cache, filters)` to look up a key, `findCachedQueries(cache, filters)` to filter a cache, and `clearQueryCache(cache)` to remove its queries. The predicates `isQueryActive(query)`, `isQueryDisabled(query)`, `isQueryStatic(query)`, and `isQueryStale(query)` inspect individual queries. Import `fetchOptimistic(client, observer, options)` when an observer needs a result as soon as data becomes available during a fetch.

For code that already holds a cache entry, import the operation that takes that entry directly.

| v6 method                   | Treeshakable import            | Effect                                                                        |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| `entry.invalidate()`        | `invalidateCachedQuery(entry)` | Marks the entry invalidated and notifies its observers.                       |
| `entry.reset()`             | `resetCachedQuery(entry)`      | Cancels any active fetch and restores the entry's initial state.              |
| `entry.getObserversCount()` | `getQueryObserverCount(entry)` | Counts subscribed observers, including disabled observers.                    |
| `entry.isFetched()`         | `isQueryFetched(entry)`        | Checks for a data or error update. Manual cache writes count as data updates. |

The filtered client operations `invalidateQueries(client, filters)` and `resetQueries(client, filters)` also refetch eligible active matches by default.

## Register application types

Augment `Register` on `@tanstack/query-core` to configure default errors, query and mutation keys, or metadata across the treeshakable package pair.

```ts
import '@tanstack/query-core'

declare module '@tanstack/query-core' {
  interface Register {
    queryMeta: { requestId?: string }
  }
}
```
