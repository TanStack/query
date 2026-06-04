---
name: core/fetch-and-observe-queries
description: >
  Use this when reading server state with useQuery, useQueries, createQuery,
  injectQuery, QueryObserver, QueryClient.fetchQuery, ensureQueryData, status,
  fetchStatus, pending, paused, success, and error states.
type: core
library: TanStack Query
library_version: "5.101.0"
requires:
  - lifecycle/setup-query-client-and-providers
  - core/design-query-keys-and-options
sources:
  - TanStack/query:docs/framework/react/guides/queries.md
  - TanStack/query:docs/framework/react/guides/query-functions.md
  - TanStack/query:docs/reference/QueryObserver.md
  - TanStack/query:docs/reference/QueryClient.md
  - TanStack/query:docs/eslint/no-void-query-fn.md
---

## Setup

```tsx
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: async () => [{ id: 1, title: 'Ship' }],
  })

  if (query.isPending) return <p>Loading</p>
  if (query.isError) return <p>{query.error.message}</p>
  return <pre>{JSON.stringify(query.data)}</pre>
}
```

## Core Patterns

### Fetch imperatively through QueryClient

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function loadTodo(todoId: string) {
  return queryClient.fetchQuery({
    queryKey: ['todo', todoId],
    queryFn: async () => ({ id: todoId }),
  })
}
```

### Ensure cached data for loaders

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function ensureTodos() {
  return queryClient.ensureQueryData({
    queryKey: ['todos'],
    queryFn: async () => [{ id: 1 }],
  })
}
```

### Distinguish status from fetchStatus

```tsx
import { useQuery } from '@tanstack/react-query'

export function TodoCount() {
  const query = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  const label = query.fetchStatus === 'fetching' && query.status === 'success' ? 'Refreshing' : 'Ready'
  return <p>{query.data?.length ?? 0} {label}</p>
}
```

## Common Mistakes

### CRITICAL Void query function

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => { await Promise.resolve([{ id: 1 }]) } })
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => Promise.resolve([{ id: 1 }]) })
}
```

Query functions must return data; a missing return caches `undefined`.

Source: TanStack/query:docs/eslint/no-void-query-fn.md

### HIGH Only checking pending offline

Wrong:

```tsx
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const query = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }], networkMode: 'online' })
  return query.isPending ? <p>Loading</p> : <p>{query.fetchStatus}</p>
}
```

Correct:

```tsx
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const query = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }], networkMode: 'online' })
  return query.fetchStatus === 'paused' ? <p>Offline</p> : <p>{query.status}</p>
}
```

`status` describes data state; `fetchStatus` describes whether fetching is paused, fetching, or idle.

Source: TanStack/query:docs/framework/react/guides/queries.md

### HIGH Using queries for writes

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useSaveTodo(title: string) {
  return useQuery({ queryKey: ['saveTodo', title], queryFn: async () => ({ id: 1, title }) })
}
```

Correct:

```ts
import { useMutation } from '@tanstack/react-query'

export function useSaveTodo() {
  return useMutation({ mutationFn: async (title: string) => ({ id: 1, title }) })
}
```

Queries are for reads; writes need mutation lifecycle hooks, invalidation, rollback, and mutation state.

Source: TanStack/query:docs/framework/react/guides/mutations.md

See also: `core/tune-defaults-freshness-retries-and-refetching` for how defaults change status behavior.

