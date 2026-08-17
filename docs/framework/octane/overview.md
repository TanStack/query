---
id: overview
title: Overview
---

`@tanstack/octane-query` is the official Octane adapter for TanStack Query. It
uses `@tanstack/query-core` unchanged and binds Query observers to Octane's
hooks, context, Suspense, and component lifecycle.

Most binding-level code can move from React Query by changing the import. The
adapter includes queries, infinite queries, parallel queries, mutations,
prefetch hooks, cache status hooks, Suspense hooks, error reset boundaries,
restoration state, and hydration. It also re-exports every Query Core API.

```tsrx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/octane-query'

const queryClient = new QueryClient()

function Todos() @{
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  @if (query.isPending) {
    <span>{'Loading'}</span>
  } @else if (query.isError) {
    <span>{query.error.message}</span>
  } @else {
    <ul>{query.data as unknown}</ul>
  }
}

function App() @{
  <QueryClientProvider client={queryClient}>
    <Todos />
  </QueryClientProvider>
}
```

Octane hooks receive compiler-injected call-site slots. The adapter derives
stable sub-slots for the Query observer, subscription, and effects, so call the
hooks normally and let the Octane compiler transform them.

Start with [Installation](./installation.md), then [Quick Start](./quick-start.md).
See [Suspense and Error Boundaries](./guides/suspense.md) and [Server Rendering
and Hydration](./guides/ssr.md) for the framework-specific behavior.
