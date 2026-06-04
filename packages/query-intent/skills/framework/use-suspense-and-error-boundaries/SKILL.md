---
name: framework/use-suspense-and-error-boundaries
description: >
  Use this when using useSuspenseQuery, useSuspenseQueries,
  useSuspenseInfiniteQuery, QueryErrorResetBoundary, throwOnError,
  useQueryErrorResetBoundary, React.use query.promise, streamed hydration, and
  Suspense constraints in Query adapters.
type: framework
library: TanStack Query
framework: cross-adapter
library_version: "5.101.0"
requires:
  - core/fetch-and-observe-queries
  - lifecycle/prefetch-and-remove-request-waterfalls
sources:
  - TanStack/query:docs/framework/react/guides/suspense.md
  - TanStack/query:docs/framework/react/reference/QueryErrorResetBoundary.md
  - TanStack/query:docs/framework/react/reference/useSuspenseQuery.md
  - TanStack/query:docs/framework/react/reference/useSuspenseQueries.md
  - TanStack/query:docs/framework/react/reference/useSuspenseInfiniteQuery.md
  - TanStack/query:docs/framework/solid/guides/suspense.md
  - TanStack/query:docs/framework/vue/guides/suspense.md
---

This skill builds on `core/fetch-and-observe-queries` and `lifecycle/prefetch-and-remove-request-waterfalls`.

## Setup

```tsx
import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

function Todos() {
  const { data } = useSuspenseQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return <pre>{JSON.stringify(data)}</pre>
}

export function App() {
  return <Suspense fallback={<p>Loading</p>}><Todos /></Suspense>
}
```

## Hooks and Components

### Reset query errors with the boundary

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

export function QueryErrorBoundary(props: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => <button onClick={resetErrorBoundary}>Retry</button>}>
          {props.children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```

### Use suspense when data must be defined

```ts
import { useSuspenseQuery } from '@tanstack/react-query'

export function useTodos() {
  return useSuspenseQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
}
```

### Use normal queries for disabled flows

```ts
import { useQuery } from '@tanstack/react-query'

export function useMaybeTodo(id: string | undefined) {
  return useQuery({ queryKey: ['todo', id], queryFn: async () => ({ id }), enabled: Boolean(id) })
}
```

## Common Mistakes

### HIGH Disabled suspense query

Wrong:

```ts
import { useSuspenseQuery } from '@tanstack/react-query'

export function useTodo(id: string | undefined) {
  return useSuspenseQuery({ queryKey: ['todo', id], queryFn: async () => ({ id }), enabled: Boolean(id) })
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodo(id: string | undefined) {
  return useQuery({ queryKey: ['todo', id], queryFn: async () => ({ id }), enabled: Boolean(id) })
}
```

Suspense hooks guarantee `data` and do not support conditional disabling like normal queries.

Source: TanStack/query:docs/framework/react/guides/suspense.md

### HIGH Missing reset boundary

Wrong:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

export function Todos() {
  const { data } = useSuspenseQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return <pre>{JSON.stringify(data)}</pre>
}
```

Correct:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

export function WrappedTodos(props: { children: React.ReactNode }) {
  return <QueryErrorResetBoundary>{({ reset }) => <ErrorBoundary onReset={reset} fallback={<p>Error</p>}>{props.children}</ErrorBoundary>}</QueryErrorResetBoundary>
}
```

Error boundaries need Query reset coordination so failed queries can retry after reset.

Source: TanStack/query:docs/framework/react/reference/QueryErrorResetBoundary.md

### MEDIUM query.promise without flag

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodoPromise() {
  return useQuery({ queryKey: ['todo', 1], queryFn: async () => ({ id: 1 }) }).promise
}
```

Correct:

```ts
import { QueryClient, useQuery } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { experimental_prefetchInRender: true } },
})

export function useTodoPromise() {
  return useQuery({ queryKey: ['todo', 1], queryFn: async () => ({ id: 1 }) }).promise
}
```

The stable `promise` property requires the experimental prefetch-in-render flag.

Source: TanStack/query:docs/framework/react/guides/suspense.md

See also: `lifecycle/ssr-hydration-and-streaming` for streamed hydration constraints.

