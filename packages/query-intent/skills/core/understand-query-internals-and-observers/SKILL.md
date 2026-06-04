---
name: core/understand-query-internals-and-observers
description: >
  Use this when explaining or debugging TanStack Query internals: QueryClient,
  QueryCache, MutationCache, Query, QueryObserver, active versus inactive
  queries, observer-level options, subscriptions, stale timers, and why loaders
  or imperative cache reads are not the same as observed queries.
type: core
library: TanStack Query
library_version: '5.101.0'
requires:
  - core/fetch-and-observe-queries
sources:
  - https://tkdodo.eu/blog/inside-react-query
  - https://tkdodo.eu/blog/react-query-selectors-supercharged
  - TanStack/query:docs/reference/QueryClient.md
  - TanStack/query:docs/reference/QueryCache.md
  - TanStack/query:docs/reference/QueryObserver.md
  - TanStack/query:docs/reference/MutationCache.md
---

## Mental Model

`QueryClient` owns the caches. `QueryCache` stores `Query` instances. Hooks and adapter APIs create `QueryObserver` instances that subscribe components to one query. Observer-level options like `select`, `staleTime`, polling, and tracked result access shape what each component sees.

An inactive query can exist in the cache without active observers. It can be read imperatively, hydrated, invalidated, or garbage collected, but it is not the same as a component actively observing query state.

## Core Patterns

### Use observers for UI reads

```tsx
function TodoPage({ id }: { id: string }) {
  const todo = useQuery({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
  })

  if (todo.isPending) return <p>Loading...</p>
  if (todo.isError) return <p>{todo.error.message}</p>
  return <h1>{todo.data.title}</h1>
}
```

### Use QueryClient for cache orchestration

```ts
await queryClient.ensureQueryData(todoOptions(id))
queryClient.invalidateQueries({ queryKey: ['todo', id] })
queryClient.setQueryData(['todo', id], (old) => old && { ...old, title })
```

## Common Mistakes

### HIGH Treating cache presence as active usage

Wrong:

```tsx
const todo = queryClient.getQueryData(['todo', id])
return <TodoView todo={todo} />
```

Correct:

```tsx
const todo = useQuery(todoOptions(id))
return <TodoView todo={todo.data} />
```

UI reads should create observers so invalidation, refetch triggers, stale status, and garbage collection behave as expected.

Source: https://tkdodo.eu/blog/inside-react-query

### MEDIUM Expecting one query to have one option set

Wrong:

```ts
// assume staleTime is stored only on the Query
queryClient.getQueryCache().find({ queryKey })?.options.staleTime
```

Correct:

```ts
const query = queryClient.getQueryCache().find({ queryKey })
const observerStaleTimes = query?.observers.map(
  (observer) => observer.options.staleTime,
)
```

Several options are observer-level, so multiple components can observe the same query with different selectors or freshness behavior.

Source: https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations

### MEDIUM Debugging without checking observer count

Wrong:

```ts
queryClient.invalidateQueries({ queryKey: ['todos'] })
// expect every cached todo query to refetch immediately
```

Correct:

```ts
queryClient.invalidateQueries({ queryKey: ['todos'], refetchType: 'active' })
```

Inactive queries are not automatically the same as mounted queries. Check observer count in devtools when invalidation or garbage collection looks surprising.

Source: https://tkdodo.eu/blog/inside-react-query
