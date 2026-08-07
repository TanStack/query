---
name: lifecycle/prefetch-and-remove-request-waterfalls
description: >
  Use this when flattening request waterfalls with prefetchQuery,
  prefetchInfiniteQuery, ensureQueryData, fetchQuery, usePrefetchQuery,
  usePrefetchInfiniteQuery, route loaders, TanStack Router loaders, Start routes,
  Suspense prefetching, and query-function prefetching.
type: lifecycle
library: TanStack Query
library_version: '5.101.0'
requires:
  - core/design-query-keys-and-options
  - core/fetch-and-observe-queries
  - core/tune-defaults-freshness-retries-and-refetching
sources:
  - TanStack/query:docs/framework/react/guides/prefetching.md
  - TanStack/query:docs/framework/react/guides/request-waterfalls.md
  - TanStack/query:docs/framework/react/reference/usePrefetchQuery.md
  - TanStack/query:docs/framework/react/reference/usePrefetchInfiniteQuery.md
  - TanStack/query:docs/reference/QueryClient.md
  - TanStack/query:examples/react/react-router/src/routes/root.tsx
  - TanStack/query:examples/react/react-router/src/routes/contact.tsx
---

## Setup

```ts
import { QueryClient, queryOptions } from '@tanstack/react-query'

const queryClient = new QueryClient()

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: async () => [{ id: 1, title: 'Ship' }],
  staleTime: 60_000,
})

export function preloadTodos() {
  return queryClient.prefetchQuery(todosOptions)
}
```

## Core Patterns

### Use loaders for route-critical data

```ts
import { QueryClient, queryOptions } from '@tanstack/react-query'

const queryClient = new QueryClient()
const contactOptions = (contactId: string) =>
  queryOptions({
    queryKey: ['contact', contactId],
    queryFn: async () => ({ id: contactId, name: 'Ada' }),
  })

export function contactLoader(contactId: string) {
  return queryClient.ensureQueryData(contactOptions(contactId))
}
```

### Prefetch before Suspense can suspend

```tsx
import { Suspense } from 'react'
import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query'

const commentsOptions = {
  queryKey: ['comments'],
  queryFn: async () => [{ id: 1 }],
}

function Comments() {
  const { data } = useSuspenseQuery(commentsOptions)
  return <pre>{JSON.stringify(data)}</pre>
}

export function CommentsSection() {
  usePrefetchQuery(commentsOptions)
  return (
    <Suspense fallback={<p>Loading</p>}>
      <Comments />
    </Suspense>
  )
}
```

### Pick the right client method

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function getTodo(id: string) {
  return queryClient.fetchQuery({
    queryKey: ['todo', id],
    queryFn: async () => ({ id }),
  })
}
```

Use `fetchQuery` when the caller needs data or thrown errors; use `prefetchQuery` when it only needs to warm the cache.

## Common Mistakes

### HIGH Expecting prefetchQuery to return data

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
const data = await queryClient.prefetchQuery({
  queryKey: ['todo', 1],
  queryFn: async () => ({ id: 1 }),
})
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
const data = await queryClient.fetchQuery({
  queryKey: ['todo', 1],
  queryFn: async () => ({ id: 1 }),
})
```

`prefetchQuery` returns void and swallows errors; `fetchQuery` returns data and throws.

Source: TanStack/query:docs/framework/react/guides/prefetching.md

### HIGH Prefetch staleTime only set on prefetch

Wrong:

```ts
import { QueryClient, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient()
await queryClient.prefetchQuery({
  queryKey: ['todos'],
  queryFn: async () => [{ id: 1 }],
  staleTime: 60_000,
})
export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
}
```

Correct:

```ts
import { QueryClient, queryOptions, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient()
const options = queryOptions({
  queryKey: ['todos'],
  queryFn: async () => [{ id: 1 }],
  staleTime: 60_000,
})
await queryClient.prefetchQuery(options)
export function useTodos() {
  return useQuery(options)
}
```

Prefetch call options do not automatically configure the later observer.

Source: TanStack/query:docs/framework/react/guides/prefetching.md

### HIGH Suspense prefetch after suspension

Wrong:

```tsx
import * as React from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'

export function Article() {
  const queryClient = useQueryClient()
  const article = useSuspenseQuery({
    queryKey: ['article'],
    queryFn: async () => ({ id: 1 }),
  })
  React.useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['comments'],
      queryFn: async () => [],
    })
  }, [queryClient])
  return <pre>{JSON.stringify(article.data)}</pre>
}
```

Correct:

```tsx
import { Suspense } from 'react'
import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query'

function Article() {
  const article = useSuspenseQuery({
    queryKey: ['article'],
    queryFn: async () => ({ id: 1 }),
  })
  return <pre>{JSON.stringify(article.data)}</pre>
}

export function ArticleRoute() {
  usePrefetchQuery({ queryKey: ['comments'], queryFn: async () => [] })
  return (
    <Suspense fallback={<p>Loading</p>}>
      <Article />
    </Suspense>
  )
}
```

Effects do not run until after a suspenseful query resolves, so they cannot flatten that waterfall.

Source: TanStack/query:docs/framework/react/guides/prefetching.md

See also: `compositions/compose-query-with-tanstack-router-and-start` for Router and Start loader prefetching.
