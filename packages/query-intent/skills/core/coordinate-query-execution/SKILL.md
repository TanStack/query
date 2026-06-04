---
name: core/coordinate-query-execution
description: >
  Use this when coordinating enabled, skipToken, dependent queries, useQueries,
  parallel queries, disabled queries, background fetching indicators, isFetching,
  fetchStatus, and declarative refetch behavior.
type: core
library: TanStack Query
library_version: "5.101.0"
requires:
  - core/fetch-and-observe-queries
  - core/tune-defaults-freshness-retries-and-refetching
sources:
  - TanStack/query:docs/framework/react/guides/dependent-queries.md
  - TanStack/query:docs/framework/react/guides/parallel-queries.md
  - TanStack/query:docs/framework/react/guides/disabling-queries.md
  - TanStack/query:docs/framework/react/guides/background-fetching-indicators.md
  - TanStack/query:docs/framework/react/reference/useQueries.md
---

## Setup

```tsx
import { useQuery } from '@tanstack/react-query'

export function Projects(props: { userId?: string }) {
  const projects = useQuery({
    queryKey: ['projects', props.userId],
    queryFn: async () => [{ id: 'p1', userId: props.userId }],
    enabled: Boolean(props.userId),
  })

  return <pre>{JSON.stringify(projects.data ?? [])}</pre>
}
```

## Core Patterns

### Gate by dependency

```ts
import { useQuery } from '@tanstack/react-query'

export function useUserProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => [{ id: 'p1', userId }],
    enabled: userId !== undefined,
  })
}
```

### Run dynamic parallel queries

```ts
import { useQueries } from '@tanstack/react-query'

export function useMessages(ids: Array<string>) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['message', id],
      queryFn: async () => ({ id, text: 'Hello' }),
    })),
  })
}
```

### Show background refresh separately

```tsx
import { useIsFetching } from '@tanstack/react-query'

export function GlobalRefreshIndicator() {
  const count = useIsFetching()
  return count > 0 ? <p>Refreshing</p> : null
}
```

## Common Mistakes

### HIGH Imperative disabled query

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useSearch(term: string) {
  return useQuery({ queryKey: ['search'], queryFn: async () => [term], enabled: false })
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useSearch(term: string) {
  return useQuery({ queryKey: ['search', term], queryFn: async () => [term], enabled: term.length > 0 })
}
```

Permanent disabling opts out of normal invalidation and dependency-driven cache behavior.

Source: TanStack/query:docs/framework/react/guides/disabling-queries.md

### HIGH Duplicate useQueries keys

Wrong:

```ts
import { useQueries } from '@tanstack/react-query'

export function useUsers(ids: Array<string>) {
  return useQueries({ queries: ids.map((id) => ({ queryKey: ['user'], queryFn: async () => ({ id }) })) })
}
```

Correct:

```ts
import { useQueries } from '@tanstack/react-query'

export function useUsers(ids: Array<string>) {
  return useQueries({ queries: ids.map((id) => ({ queryKey: ['user', id], queryFn: async () => ({ id }) })) })
}
```

Duplicate keys can share placeholder, selected, or cached data between different items.

Source: TanStack/query:docs/framework/react/reference/useQueries.md

### MEDIUM Full-page spinner on background refetch

Wrong:

```tsx
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const query = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return query.isFetching ? <p>Loading</p> : <pre>{JSON.stringify(query.data)}</pre>
}
```

Correct:

```tsx
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const query = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return <pre>{query.isFetching ? 'Refreshing ' : ''}{JSON.stringify(query.data ?? [])}</pre>
}
```

`isFetching` also covers background refreshes after data is already available.

Source: TanStack/query:docs/framework/react/guides/background-fetching-indicators.md
