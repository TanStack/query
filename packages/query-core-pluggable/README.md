# @tanstack/query-core-pluggable

An experimental ESM query and mutation cache for JavaScript and TypeScript. It provides the runtime for `@tanstack/react-query-pluggable` and can also be used directly.

Create a `QueryClient` and pass it as the first argument to each operation. This example fetches a list of titles, then marks the matching cached queries stale.

```ts
import {
  QueryClient,
  fetchQuery,
  invalidateQueries,
} from '@tanstack/query-core-pluggable'

const client = new QueryClient()

const titles = await fetchQuery(client, {
  queryKey: ['books', 'featured'],
  queryFn: async (): Promise<string[]> => {
    const response = await fetch('/api/featured-titles')
    if (!response.ok) throw new Error('Could not load featured titles')
    return response.json()
  },
})

await invalidateQueries(client, { queryKey: ['books'] })
```

Import `fetchInfiniteQuery` for pagination, `refetchInterval` for observer polling, or `getMutationCache` to access the client's mutation cache. Pass the same client to the React adapter's `QueryClientProvider` to share cached data between direct calls and components.

## Register application types

Augment `Register` on `@tanstack/query-core-pluggable` to configure default errors, query and mutation keys, or metadata across the pluggable package pair.

```ts
import '@tanstack/query-core-pluggable'

declare module '@tanstack/query-core-pluggable' {
  interface Register {
    queryMeta: { requestId?: string }
  }
}
```
