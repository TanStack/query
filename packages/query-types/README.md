# @tanstack/query-types

Shared TypeScript declarations for TanStack Query. Use type-only imports in code that models query state, cached data, results, and options.

```ts
import type { QueryState } from '@tanstack/query-types'

export function lastSuccessfulUpdate(state: QueryState<unknown>) {
  return state.dataUpdatedAt
}
```

The package root describes the public instance methods of the query client, caches, and observers. Each adapter also re-exports the query types with the concrete classes its callbacks receive.

When publishing a callback or options object for use with a particular adapter, use its specialized types. Libraries that support multiple implementations can use the same declaration with each adapter's `QueryRuntime` type parameter.

```ts
import type { QueryOptions } from '@tanstack/query-types/bindings'
import type { QueryRuntime } from '@tanstack/react-query-no-core'

export const bookOptions: QueryOptions<QueryRuntime, string> = {
  queryKey: ['book'],
  queryFn: async ({ client }) => client.getQueryData<string>(['title']) ?? '',
}
```

Augment `Register` in `@tanstack/query-types` to share your application's error, key, or metadata types across installed adapters.
