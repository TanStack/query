---
name: lifecycle/ssr-hydration-and-streaming
description: >
  Use this when implementing SSR, hydration, dehydrate, hydrate,
  HydrationBoundary, TanStack Start, TanStack Router SSR Query, Next.js app
  router, Next.js pages router, React Server Components, SvelteKit, Nuxt,
  SolidStart, Lit SSR, ReactQueryStreamedHydration, or streamedQuery.
type: lifecycle
library: TanStack Query
library_version: "5.101.0"
requires:
  - lifecycle/setup-query-client-and-providers
  - lifecycle/prefetch-and-remove-request-waterfalls
sources:
  - TanStack/query:docs/framework/react/guides/ssr.md
  - TanStack/query:docs/framework/react/guides/advanced-ssr.md
  - TanStack/query:docs/framework/react/reference/hydration.md
  - TanStack/query:docs/reference/environmentManager.md
  - TanStack/query:docs/reference/streamedQuery.md
  - TanStack/query:docs/framework/vue/guides/ssr.md
  - TanStack/query:docs/framework/svelte/ssr.md
  - TanStack/query:docs/framework/solid/guides/ssr.md
  - TanStack/query:docs/framework/lit/guides/ssr.md
---

## Setup

```tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export async function PostsPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] })
  return <HydrationBoundary state={dehydrate(queryClient)}><Posts /></HydrationBoundary>
}

function Posts() {
  return <p>Hydrated posts render here</p>
}
```

## Core Patterns

### Put TanStack Start and Router first

```ts
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree, context: { queryClient } })

setupRouterSsrQueryIntegration({ router, queryClient })
```

### Use per-request clients

```ts
import { QueryClient } from '@tanstack/react-query'

export function createSsrQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })
}
```

### Hydrate only prefetched data

```tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['profile'], queryFn: async () => ({ name: 'Tanner' }) })
  return <HydrationBoundary state={dehydrate(queryClient)}><main>Profile</main></HydrationBoundary>
}
```

## Common Mistakes

### CRITICAL RSC renders fetched data twice

Wrong:

```tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export async function Page() {
  const queryClient = new QueryClient()
  const posts = await queryClient.fetchQuery({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] })
  return <><p>{posts.length}</p><HydrationBoundary state={dehydrate(queryClient)}><main>Posts</main></HydrationBoundary></>
}
```

Correct:

```tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] })
  return <HydrationBoundary state={dehydrate(queryClient)}><main>Posts</main></HydrationBoundary>
}
```

Server-rendered derived data can desynchronize from client-refetched Query data.

Source: TanStack/query:docs/framework/react/guides/advanced-ssr.md

### CRITICAL Suspense query not prefetched on server

Wrong:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

export function Posts() {
  const { data } = useSuspenseQuery({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] })
  return <pre>{JSON.stringify(data)}</pre>
}
```

Correct:

```tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: async () => [{ id: 1 }] })
  return <HydrationBoundary state={dehydrate(queryClient)}><main>Posts</main></HydrationBoundary>
}
```

A suspense query that is not prefetched can fetch on the server, fail to hydrate, then fetch again on the client.

Source: TanStack/query:docs/framework/react/guides/ssr.md

### HIGH SvelteKit query runs after SSR response

Wrong:

```ts
import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient()
```

Correct:

```ts
import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: browser } },
})
```

SvelteKit SSR needs browser-gated default query execution unless server data is explicitly prefetched.

Source: TanStack/query:docs/framework/svelte/ssr.md

See also: `compositions/compose-query-with-tanstack-router-and-start` for TanStack-owned SSR routing.
