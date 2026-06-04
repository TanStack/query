---
name: compositions/compose-query-with-tanstack-router-and-start
description: >
  Use this when combining TanStack Query with TanStack Router or TanStack Start:
  router context QueryClient, createFileRoute loaders, ensureQueryData,
  @tanstack/react-router-ssr-query, setupRouterSsrQueryIntegration, SSR hydration,
  streaming, redirects, and Start server functions.
type: composition
library: TanStack Query
library_version: "5.101.0"
requires:
  - lifecycle/setup-query-client-and-providers
  - core/design-query-keys-and-options
  - lifecycle/prefetch-and-remove-request-waterfalls
sources:
  - https://tkdodo.eu/blog/tan-stack-router-and-query
  - TanStack/router:https://tanstack.com/router/latest/docs/integrations/query
  - TanStack/router:https://tanstack.com/router/latest/docs/how-to/setup-ssr
  - TanStack/start:https://tanstack.com/start/latest/docs/framework/react/overview
  - TanStack/query:docs/framework/react/guides/prefetching.md
  - TanStack/query:docs/framework/react/guides/ssr.md
---

## Setup

```tsx
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

const postsQuery = {
  queryKey: ['posts'],
  queryFn: async () => [{ id: 1, title: 'Router first' }],
}

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: PostsPage,
})

function PostsPage() {
  const { data } = useSuspenseQuery(postsQuery)
  return <pre>{JSON.stringify(data)}</pre>
}

const router = createRouter({ routeTree, context: { queryClient } })

export function App() {
  return <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>
}
```

## Core Integration Patterns

### Put QueryClient in router context

```ts
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreloadStaleTime: 0,
})
```

Set `defaultPreloadStaleTime: 0` when Query owns server-state freshness. Router still preloads and runs loaders, but Query is the cache authority.

### Use loader ensureQueryData for route data

```ts
import { createFileRoute } from '@tanstack/react-router'

const todoQuery = (todoId: string) => ({
  queryKey: ['todo', todoId],
  queryFn: async () => ({ id: todoId, title: 'Loaded' }),
})

export const Route = createFileRoute('/todos/$todoId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(todoQuery(params.todoId)),
})
```

Treat loaders as event handlers that prime the Query cache. Components should still call `useQuery` or `useSuspenseQuery` so the route has an active Query observer.

### Prefer Router SSR Query integration for Router SSR

```ts
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree, context: { queryClient } })

setupRouterSsrQueryIntegration({ router, queryClient })
```

## Common Mistakes

### CRITICAL Component-only Query creates route waterfall

Wrong:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/posts')({ component: PostsPage })
function PostsPage() {
  const { data } = useSuspenseQuery({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] })
  return <pre>{JSON.stringify(data)}</pre>
}
```

Correct:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

const postsQuery = { queryKey: ['posts'], queryFn: async () => [{ id: 1 }] }
export const Route = createFileRoute('/posts')({ loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery), component: PostsPage })
function PostsPage() {
  const { data } = useSuspenseQuery(postsQuery)
  return <pre>{JSON.stringify(data)}</pre>
}
```

The router can load route-critical data before component render.

Source: TanStack/router:https://tanstack.com/router/latest/docs/integrations/query

### CRITICAL Hand-rolled Router hydration

Wrong:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })
export function App() { return <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider> }
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree, context: { queryClient } })
setupRouterSsrQueryIntegration({ router, queryClient })
```

The Router SSR Query integration handles dehydration, hydration, streamed query results, redirects, and provider wrapping.

Source: TanStack/router:https://tanstack.com/router/latest/docs/integrations/query

### HIGH Next.js mental model copied into Start

Wrong:

```tsx
export default async function Page() {
  const posts = await Promise.resolve([{ id: 1 }])
  return <pre>{JSON.stringify(posts)}</pre>
}
```

Correct:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] }),
  component: () => <p>Posts loaded by the route</p>,
})
```

Start is powered by TanStack Router; use file routes, loaders, server functions, and Router SSR before Next-specific app/pages APIs.

Source: TanStack/start:https://tanstack.com/start/latest/docs/framework/react/overview

### HIGH Reading loader data instead of observing Query

Wrong:

```tsx
import { createFileRoute, useLoaderData } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: PostsPage,
})

function PostsPage() {
  const posts = useLoaderData({ from: '/posts' })
  return <pre>{JSON.stringify(posts)}</pre>
}
```

Correct:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

function PostsPage() {
  const { data } = useSuspenseQuery(postsQuery)
  return <pre>{JSON.stringify(data)}</pre>
}
```

The loader primes the cache. The component still needs an active Query observer for refetch triggers, invalidation, and garbage collection semantics.

Source: https://tkdodo.eu/blog/tan-stack-router-and-query

See also: `lifecycle/ssr-hydration-and-streaming` for framework SSR recipes.
