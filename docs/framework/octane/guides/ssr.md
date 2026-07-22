---
id: ssr
title: Server Rendering and Hydration
---

Octane Query supports both prefetched hydration and render-time Suspense on the
server. The binding re-exports Query Core's `dehydrate` and `hydrate` functions,
and `HydrationBoundary` accepts dehydrated queries, including pending queries
that resolve in a later stream chunk.

## Per-request clients

Create a new `QueryClient` for every server request. Never share one server
client between users.

```ts
import { QueryClient, dehydrate, hydrate } from '@tanstack/octane-query'

export async function loadQueryState() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 },
    },
  })

  await queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return {
    queryClient,
    state: dehydrate(queryClient),
  }
}

export function restoreQueryState(state: unknown) {
  const queryClient = new QueryClient()
  hydrate(queryClient, state)
  return queryClient
}
```

Serialize the dehydrated state through the application's SSR pipeline, restore
it before the browser renders query consumers, and provide the browser client
with `QueryClientProvider`. Use `HydrationBoundary` when only a subtree owns a
dehydrated state payload.

The adapter owns Query's Octane binding and hydration behavior. Routing,
serialization, and response streaming remain responsibilities of the
application's TanStack Start or other SSR pipeline.

## Render-time Suspense

Suspense hooks can start a query during server rendering. Octane tracks each
thenable with the compiler-provided hook slot, so sequential suspense calls and
streamed continuations resume at the correct call site. Wrap those consumers in
an Octane Suspense boundary and let the SSR renderer stream the resolved
content.

For persisted browser caches, wrap consumers in `IsRestoringProvider` while the
restore is in progress. Query observers will avoid fetching until restoration
finishes.
