---
name: framework/handle-status-and-errors
description: >
  Use this when designing TanStack Query loading, empty, stale, background error,
  retry, toast, throwOnError, and Error Boundary flows. Covers status versus
  fetchStatus, stale data after failed refetches, global QueryCache or
  MutationCache error callbacks, and local versus boundary-level error handling.
type: framework
library: TanStack Query
library_version: "5.101.0"
requires:
  - core/fetch-and-observe-queries
  - framework/use-suspense-and-error-boundaries
sources:
  - https://tkdodo.eu/blog/status-checks-in-react-query
  - https://tkdodo.eu/blog/react-query-error-handling
  - TanStack/query:docs/framework/react/guides/queries.md
  - TanStack/query:docs/framework/react/reference/QueryErrorResetBoundary.md
---

## Core Patterns

Prefer data-first rendering when stale data is useful. A failed background refetch can produce `isError` while `data` is still available.

```tsx
const todos = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

if (todos.data) return <TodoList todos={todos.data} isRefreshing={todos.isFetching} />
if (todos.isPending) return <Spinner />
if (todos.isError) return <ErrorMessage error={todos.error} />
return null
```

Use `throwOnError` when render-time Error Boundaries should own the fallback:

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  throwOnError: (error) => error.status >= 500,
})
```

Use global cache callbacks for cross-cutting notifications:

```ts
import { QueryCache, QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) showToast(error.message)
    },
  }),
})
```

## Common Mistakes

### HIGH Hiding stale data on background error

Wrong:

```tsx
if (query.isError) return <ErrorMessage error={query.error} />
if (query.data) return <Todos todos={query.data} />
```

Correct:

```tsx
if (query.data) return <Todos todos={query.data} staleError={query.isError ? query.error : null} />
if (query.isError) return <ErrorMessage error={query.error} />
```

Background refetch failures should not necessarily erase already-rendered data.

Source: https://tkdodo.eu/blog/status-checks-in-react-query

### HIGH Sending validation errors to a global boundary

Wrong:

```ts
useMutation({ mutationFn: submitForm, throwOnError: true })
```

Correct:

```ts
useMutation({
  mutationFn: submitForm,
  throwOnError: (error) => error.status >= 500,
})
```

Handle expected 4xx validation errors near the form. Send unexpected server failures to the boundary.

Source: https://tkdodo.eu/blog/react-query-error-handling

### MEDIUM Duplicating toast notifications per observer

Wrong:

```ts
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  onError: toastError,
})
```

Correct:

```ts
new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) toastError(error)
    },
  }),
})
```

Observer-level callbacks can duplicate notifications across components. Use cache-level callbacks for global side effects.

Source: https://tkdodo.eu/blog/react-query-error-handling
