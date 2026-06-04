---
name: core/paginate-and-build-infinite-queries
description: >
  Use this when implementing pagination, lagged queries, placeholderData,
  keepPreviousData migration, useInfiniteQuery, initialPageParam,
  getNextPageParam, getPreviousPageParam, maxPages, pages, or pageParams.
type: core
library: TanStack Query
library_version: "5.101.0"
requires:
  - core/design-query-keys-and-options
  - core/fetch-and-observe-queries
sources:
  - TanStack/query:docs/framework/react/guides/paginated-queries.md
  - TanStack/query:docs/framework/react/guides/infinite-queries.md
  - TanStack/query:docs/framework/react/reference/useInfiniteQuery.md
  - TanStack/query:docs/reference/InfiniteQueryObserver.md
  - TanStack/query:docs/eslint/infinite-query-property-order.md
---

## Setup

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export function useProjects(page: number) {
  return useQuery({
    queryKey: ['projects', page],
    queryFn: async () => ({ page, projects: [{ id: page }] }),
    placeholderData: keepPreviousData,
  })
}
```

## Core Patterns

### Build an infinite query

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => ({ nextCursor: pageParam + 1, items: [{ id: pageParam }] }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
```

### Bound memory with maxPages

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useBoundedFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => ({ nextCursor: pageParam + 1, items: [{ id: pageParam }] }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: 5,
  })
}
```

### Preserve infinite data shape

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

queryClient.setQueryData(['feed'], {
  pages: [{ items: [{ id: 1 }], nextCursor: 2 }],
  pageParams: [1],
})
```

## Common Mistakes

### CRITICAL Missing initialPageParam

Wrong:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useFeed() {
  return useInfiniteQuery({ queryKey: ['feed'], queryFn: async () => ({ items: [] }), getNextPageParam: () => 1 })
}
```

Correct:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useFeed() {
  return useInfiniteQuery({ queryKey: ['feed'], queryFn: async ({ pageParam }) => ({ items: [pageParam] }), initialPageParam: 0, getNextPageParam: () => 1 })
}
```

v5 requires an explicit initial page param so pageParams can be serialized and inferred.

Source: TanStack/query:docs/framework/react/guides/infinite-queries.md

### HIGH Overlapping infinite fetches

Wrong:

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

export function Feed() {
  const query = useInfiniteQuery({ queryKey: ['feed'], queryFn: async ({ pageParam }) => ({ nextCursor: pageParam + 1 }), initialPageParam: 0, getNextPageParam: (page) => page.nextCursor })
  return <button onClick={() => query.fetchNextPage()}>More</button>
}
```

Correct:

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

export function Feed() {
  const query = useInfiniteQuery({ queryKey: ['feed'], queryFn: async ({ pageParam }) => ({ nextCursor: pageParam + 1 }), initialPageParam: 0, getNextPageParam: (page) => page.nextCursor })
  return <button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>More</button>
}
```

Only one ongoing fetch should update an infinite query cache at a time unless explicitly overridden.

Source: TanStack/query:docs/framework/react/guides/infinite-queries.md

### HIGH Broken pages shape

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
queryClient.setQueryData(['feed'], [{ id: 1 }])
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
queryClient.setQueryData(['feed'], { pages: [[{ id: 1 }]], pageParams: [0] })
```

Infinite query data must keep `pages` and `pageParams`; refetches expect that shape.

Source: TanStack/query:docs/framework/react/guides/infinite-queries.md

