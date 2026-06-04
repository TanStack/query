---
name: lifecycle/migrate-major-versions-and-codemods
description: >
  Use this when migrating TanStack Query across React Query v3, React Query v4,
  TanStack Query v5, Vue Query v5, Svelte Query v6, removed overloads,
  object syntax, cacheTime to gcTime, removed query callbacks, keepPreviousData
  migration, and query-codemods.
type: lifecycle
library: TanStack Query
library_version: "5.101.0"
sources:
  - TanStack/query:docs/framework/react/guides/migrating-to-react-query-3.md
  - TanStack/query:docs/framework/react/guides/migrating-to-react-query-4.md
  - TanStack/query:docs/framework/react/guides/migrating-to-v5.md
  - TanStack/query:docs/framework/vue/guides/migrating-to-v5.md
  - TanStack/query:docs/framework/svelte/migrate-from-v5-to-v6.md
  - TanStack/query:packages/query-codemods/package.json
---

## Setup

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => [{ id: 1 }],
    gcTime: 5 * 60 * 1000,
  })
}
```

## Core Patterns

### Use object syntax everywhere

```ts
import { QueryClient, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function useTodo(id: string) {
  return useQuery({ queryKey: ['todo', id], queryFn: async () => ({ id }) })
}

export function prefetchTodo(id: string) {
  return queryClient.prefetchQuery({ queryKey: ['todo', id], queryFn: async () => ({ id }) })
}
```

### Rename cacheTime to gcTime

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 10 * 60 * 1000 } },
})
```

### Migrate keepPreviousData

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export function usePage(page: number) {
  return useQuery({ queryKey: ['page', page], queryFn: async () => ({ page }), placeholderData: keepPreviousData })
}
```

## Common Mistakes

### CRITICAL v4 overload syntax

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery(['todos'], async () => [{ id: 1 }])
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
}
```

v5 removed hook and client overloads in favor of a single object signature.

Source: TanStack/query:docs/framework/react/guides/migrating-to-v5.md

### HIGH Removed query callbacks

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }], onSuccess: () => console.log('loaded') })
}
```

Correct:

```tsx
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

export function TodosLogger() {
  const { data } = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  React.useEffect(() => { if (data) console.log('loaded') }, [data])
  return null
}
```

v5 removed query callbacks from queries; react to data changes outside the query options.

Source: TanStack/query:docs/framework/react/guides/migrating-to-v5.md

### HIGH cacheTime in v5

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { cacheTime: 60_000 } },
})
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 60_000 } },
})
```

`cacheTime` was renamed to `gcTime` to describe garbage collection of unused queries.

Source: TanStack/query:docs/framework/react/guides/migrating-to-v5.md

